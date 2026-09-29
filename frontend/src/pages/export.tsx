import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContracts, getMonthlyAcceptances, signAcceptance, downloadReportSet } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button, Select, Input, FormField, Card } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatHours, formatMonth, currentMonth } from '@/lib/utils'
import { Download, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react'

export function ExportPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [contractId, setContractId] = useState<string>('')
  const [month, setMonth] = useState(currentMonth())
  const [downloading, setDownloading] = useState(false)

  const { data: contractsPage } = useQuery({ queryKey: ['contracts'], queryFn: () => getContracts() })

  const cid = contractId ? Number(contractId) : null

  const { data: acceptances, isLoading } = useQuery({
    queryKey: ['monthly-acceptances', cid, month],
    queryFn: () => getMonthlyAcceptances(cid!, month),
    enabled: cid !== null && Boolean(month),
  })

  const signMut = useMutation({
    mutationFn: (id: number) => signAcceptance(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['monthly-acceptances'] })
      toast('Đã đánh dấu ký biên bản nghiệm thu.', 'success')
    },
    onError: () => toast('Không thể ký biên bản.', 'error'),
  })

  async function handleDownload() {
    if (!cid || !month) return
    setDownloading(true)
    try {
      await downloadReportSet(cid, month)
      void qc.invalidateQueries({ queryKey: ['monthly-acceptances'] })
      toast('Đã tải bộ báo cáo Excel thành công.', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errorCode?: string } } }).response?.data?.errorCode
      if (msg === 'NO_APPROVED_LOGS') {
        toast('Không có nhật ký nào đã duyệt trong tháng này để xuất báo cáo.', 'error')
      } else {
        toast('Không thể tạo báo cáo. Vui lòng thử lại.', 'error')
      }
    } finally {
      setDownloading(false)
    }
  }

  // Summary totals
  const totalHours = acceptances?.reduce((s, a) => s + Number(a.totalOperatingHours), 0) ?? 0
  const totalAmount = acceptances?.reduce((s, a) => s + Number(a.totalAmount), 0) ?? 0
  const totalVat = acceptances?.reduce((s, a) => s + Number(a.vatAmount), 0) ?? 0
  const subtotal = acceptances?.reduce((s, a) => s + Number(a.subtotalBeforeVat), 0) ?? 0
  const hasNeedsRecalc = acceptances?.some((a) => a.status === 'NEEDS_RECALCULATION')

  return (
    <AppShell>
      <PageHeader title="Xuất báo cáo tháng" />

      {/* Selectors */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <FormField label="Hợp đồng" htmlFor="export-contract">
          <Select
            id="export-contract"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="w-72"
          >
            <option value="">— Chọn hợp đồng —</option>
            {contractsPage?.content.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractNumber} — {c.projectName ?? c.constructionSite ?? ''}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tháng billing" htmlFor="export-month">
          <Input
            id="export-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-44"
          />
        </FormField>
      </div>

      {!cid ? (
        <EmptyState title="Chọn hợp đồng và tháng để xem trước số liệu và xuất báo cáo" />
      ) : isLoading ? (
        <TableSkeleton rows={3} cols={5} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Acceptance table */}
          <Card>
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Biên bản nghiệm thu tháng {formatMonth(month)}</h2>
              <p className="text-sm text-gray-500">Danh sách nghiệm thu theo thiết bị</p>
            </div>
            <div className="p-4">
              {!acceptances || acceptances.length === 0 ? (
                <EmptyState
                  title="Chưa có nhật ký nào được duyệt trong tháng này"
                  description="Cần có ít nhất 1 nhật ký APPROVED để xuất báo cáo."
                />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                      <th className="py-2 text-left">Thiết bị</th>
                      <th className="py-2 text-right">Tổng giờ</th>
                      <th className="py-2 text-right">Đơn giá</th>
                      <th className="py-2 text-right">Tổng tiền</th>
                      <th className="py-2 text-left">Trạng thái</th>
                      <th className="py-2 text-center">Ký BB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptances.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 font-medium">#{a.equipmentId}</td>
                        <td className="py-2.5 text-right font-mono">{formatHours(a.totalOperatingHours)}</td>
                        <td className="py-2.5 text-right font-mono text-gray-600">{formatCurrency(a.appliedUnitPrice)}</td>
                        <td className="py-2.5 text-right font-mono font-semibold">{formatCurrency(a.totalAmount)}</td>
                        <td className="py-2.5"><StatusBadge status={a.status} /></td>
                        <td className="py-2.5 text-center">
                          {a.status === 'PENDING_SIGNATURE' && (
                            <button
                              type="button"
                              title="Đánh dấu đã ký"
                              onClick={() => { if (confirm('Đánh dấu biên bản nghiệm thu này đã được ký?')) signMut.mutate(a.id) }}
                              className="rounded p-1.5 text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Preview + Export panel */}
          <div className="flex flex-col gap-4">
            {hasNeedsRecalc && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Dữ liệu đã thay đổi</strong>
                  <p className="mt-0.5">Một số biên bản nghiệm thu cần tính lại do nhật ký đã được mở lại. Hệ thống sẽ tự động tính lại khi bạn xuất báo cáo.</p>
                </div>
              </div>
            )}

            <Card>
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Xem trước số liệu</h2>
              </div>
              <div className="flex flex-col gap-3 p-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng giờ vận hành:</span>
                  <span className="font-semibold">{formatHours(totalHours)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính trước thuế:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT:</span>
                  <span className="font-semibold">{formatCurrency(totalVat)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </Card>

            <Button
              size="lg"
              loading={downloading}
              disabled={!acceptances || acceptances.length === 0}
              onClick={() => void handleDownload()}
              className="w-full"
            >
              <Download size={18} />
              {downloading ? 'Đang tạo báo cáo...' : 'Xuất báo cáo Excel (.zip)'}
            </Button>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Gồm 3 file Excel:</p>
              {[
                'Bảng tổng hợp giờ làm',
                'Biên bản bàn giao & nghiệm thu',
                'Biên bản đối chiếu công nợ',
              ].map((name) => (
                <div key={name} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                  <FileSpreadsheet size={14} className="text-green-600" />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
