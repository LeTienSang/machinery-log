import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContracts, getAdvancePayments, createAdvancePayment, deleteAdvancePayment,
  getDebtReconciliations, createDebtReconciliation, reconcileDebt,
  getMonthlyAcceptances,
} from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button, Input, Select, FormField, Modal, Card, CardHeader } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, formatMonth, currentMonth } from '@/lib/utils'
import { Plus, Trash2, CheckCircle } from 'lucide-react'
import type { AdvancePayment, DebtReconciliation } from '@/lib/types'

export function DebtPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [contractId, setContractId] = useState<string>('')
  const [tab, setTab] = useState<'advance' | 'reconciliation'>('reconciliation')
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showAddRecon, setShowAddRecon] = useState(false)
  const [reconMonth, setReconMonth] = useState(currentMonth())

  // Payment form state
  const [payForm, setPayForm] = useState({ documentDate: '', documentNumber: '', description: '', amount: '' })

  const { data: contractsPage } = useQuery({ queryKey: ['contracts'], queryFn: () => getContracts() })
  const cid = contractId ? Number(contractId) : null

  const { data: payments, isLoading: payLoading } = useQuery({
    queryKey: ['advance-payments', cid],
    queryFn: () => getAdvancePayments(cid!),
    enabled: cid !== null,
  })

  const { data: reconciliations, isLoading: reconLoading } = useQuery({
    queryKey: ['debt-reconciliations', cid],
    queryFn: () => getDebtReconciliations(cid!),
    enabled: cid !== null,
  })

  const addPayMut = useMutation({
    mutationFn: () => createAdvancePayment(cid!, {
      documentDate: payForm.documentDate,
      documentNumber: payForm.documentNumber || undefined,
      description: payForm.description || undefined,
      amount: payForm.amount,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['advance-payments', cid] })
      setShowAddPayment(false)
      setPayForm({ documentDate: '', documentNumber: '', description: '', amount: '' })
      toast('Đã ghi nhận tạm ứng.', 'success')
    },
    onError: () => toast('Không thể thêm tạm ứng.', 'error'),
  })

  const delPayMut = useMutation({
    mutationFn: (id: number) => deleteAdvancePayment(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['advance-payments', cid] }); toast('Đã xóa tạm ứng.', 'success') },
    onError: () => toast('Không thể xóa tạm ứng (đã được đưa vào đối chiếu).', 'error'),
  })

  const addReconMut = useMutation({
    mutationFn: () => createDebtReconciliation(cid!, reconMonth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['debt-reconciliations', cid] })
      setShowAddRecon(false)
      toast('Đã tạo đối chiếu công nợ.', 'success')
    },
    onError: () => toast('Không thể tạo đối chiếu công nợ.', 'error'),
  })

  const reconMut = useMutation({
    mutationFn: (id: number) => reconcileDebt(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['debt-reconciliations', cid] }); toast('Đã chốt đối chiếu.', 'success') },
    onError: () => toast('Không thể chốt đối chiếu.', 'error'),
  })

  // Latest remaining balance
  const latestRecon = reconciliations?.[0]
  const remainingBalance = latestRecon ? Number(latestRecon.remainingBalance) : null

  return (
    <AppShell>
      <PageHeader title="Tạm ứng & Công nợ" />

      {/* Contract selector */}
      <div className="mb-6 flex items-end gap-4">
        <FormField label="Chọn hợp đồng" htmlFor="debt-contract">
          <Select
            id="debt-contract"
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
      </div>

      {!cid ? (
        <EmptyState title="Chọn hợp đồng để xem thông tin công nợ" />
      ) : (
        <>
          {/* Balance summary */}
          <Card className="mb-6">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-sm text-gray-500">Dư nợ hiện tại</p>
                <p
                  className={`mt-1 text-3xl font-bold ${
                    remainingBalance !== null && remainingBalance > 0 ? 'text-amber-600' : 'text-gray-900'
                  }`}
                >
                  {remainingBalance !== null ? formatCurrency(remainingBalance) : '—'}
                </p>
              </div>
              {latestRecon && <StatusBadge status={latestRecon.status} />}
            </div>
          </Card>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
            {([
              { key: 'reconciliation', label: 'Lịch sử đối chiếu công nợ' },
              { key: 'advance', label: 'Lịch sử tạm ứng' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={
                  tab === key
                    ? 'rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white'
                    : 'rounded-md px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100'
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Debt Reconciliation Tab */}
          {tab === 'reconciliation' && (
            <Card>
              <CardHeader
                title="Lịch sử đối chiếu công nợ"
                action={
                  <Button size="sm" onClick={() => setShowAddRecon(true)}>
                    <Plus size={14} /> Tạo đối chiếu mới
                  </Button>
                }
              />
              <div className="p-4">
                {reconLoading ? (
                  <TableSkeleton rows={3} cols={6} />
                ) : !reconciliations || reconciliations.length === 0 ? (
                  <EmptyState title="Chưa có đối chiếu công nợ nào" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-2 text-left">Ngày đối chiếu</th>
                        <th className="py-2 text-right">Dư nợ kỳ trước</th>
                        <th className="py-2 text-right">Phát sinh kỳ này</th>
                        <th className="py-2 text-right">Đã thanh toán</th>
                        <th className="py-2 text-right">Còn lại</th>
                        <th className="py-2 text-left">Trạng thái</th>
                        <th className="py-2 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliations.map((r) => (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5">{formatDate(r.reconciliationDate)}</td>
                          <td className="py-2.5 text-right font-mono text-gray-600">{formatCurrency(r.previousBalance)}</td>
                          <td className="py-2.5 text-right font-mono text-gray-600">{formatCurrency(r.currentPeriodAcceptance)}</td>
                          <td className="py-2.5 text-right font-mono text-green-600">−{formatCurrency(r.totalPaid)}</td>
                          <td className="py-2.5 text-right font-mono font-semibold">{formatCurrency(r.remainingBalance)}</td>
                          <td className="py-2.5"><StatusBadge status={r.status} /></td>
                          <td className="py-2.5 text-center">
                            {r.status === 'PENDING_RECONCILIATION' && (
                              <button
                                type="button"
                                title="Chốt đối chiếu"
                                onClick={() => { if (confirm('Chốt đối chiếu công nợ này?')) reconMut.mutate(r.id) }}
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
          )}

          {/* Advance Payments Tab */}
          {tab === 'advance' && (
            <Card>
              <CardHeader
                title="Lịch sử tạm ứng"
                action={
                  <Button size="sm" onClick={() => setShowAddPayment(true)}>
                    <Plus size={14} /> Ghi nhận tạm ứng
                  </Button>
                }
              />
              <div className="p-4">
                {payLoading ? (
                  <TableSkeleton rows={3} cols={5} />
                ) : !payments || payments.length === 0 ? (
                  <EmptyState title="Chưa có khoản tạm ứng nào" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-2 text-left">Ngày</th>
                        <th className="py-2 text-left">Số chứng từ</th>
                        <th className="py-2 text-left">Mô tả</th>
                        <th className="py-2 text-right">Số tiền</th>
                        <th className="py-2 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5">{formatDate(p.documentDate)}</td>
                          <td className="py-2.5 font-mono text-xs text-gray-500">{p.documentNumber ?? '—'}</td>
                          <td className="py-2.5 text-gray-600">{p.description ?? '—'}</td>
                          <td className="py-2.5 text-right font-mono font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => { if (confirm('Xóa khoản tạm ứng này?')) delPayMut.mutate(p.id) }}
                              className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Add Advance Payment Modal */}
      <Modal open={showAddPayment} onClose={() => setShowAddPayment(false)} title="Ghi nhận tạm ứng">
        <div className="flex flex-col gap-4">
          <FormField label="Ngày chứng từ" required>
            <Input type="date" value={payForm.documentDate} onChange={(e) => setPayForm((f) => ({ ...f, documentDate: e.target.value }))} required />
          </FormField>
          <FormField label="Số chứng từ">
            <Input value={payForm.documentNumber} onChange={(e) => setPayForm((f) => ({ ...f, documentNumber: e.target.value }))} placeholder="VD: PT-2026-001" />
          </FormField>
          <FormField label="Mô tả">
            <Input value={payForm.description} onChange={(e) => setPayForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Số tiền (VNĐ)" required>
            <Input type="number" min="0" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} required />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddPayment(false)}>Hủy</Button>
            <Button
              loading={addPayMut.isPending}
              disabled={!payForm.documentDate || !payForm.amount}
              onClick={() => addPayMut.mutate()}
            >
              Lưu
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Reconciliation Modal */}
      <Modal open={showAddRecon} onClose={() => setShowAddRecon(false)} title="Tạo đối chiếu công nợ kỳ mới">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Hệ thống sẽ tự động tính: <br />
            Dư nợ còn lại = Dư nợ kỳ trước + Phát sinh nghiệm thu − Đã thanh toán
          </p>
          <FormField label="Tháng đối chiếu" required>
            <Input type="month" value={reconMonth} onChange={(e) => setReconMonth(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddRecon(false)}>Hủy</Button>
            <Button loading={addReconMut.isPending} onClick={() => addReconMut.mutate()}>
              Tạo đối chiếu
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
