import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDailyLogs, approveDailyLog, reopenDailyLog, batchSaveDailyLogs, getContracts } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button, Input, Select, FormField, Textarea, Modal, Card } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatHours, currentMonth } from '@/lib/utils'
import type { DailyLog, ApprovalStatus } from '@/lib/types'
import { Eye, Check, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

const TABS: { label: string; value: ApprovalStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
]

export function ReviewPage() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const [tab, setTab] = useState<ApprovalStatus | 'ALL'>('PENDING')
  const [contractId, setContractId] = useState<string>('')
  const [month, setMonth] = useState(currentMonth())
  const [selected, setSelected] = useState<DailyLog | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [pendingLog, setPendingLog] = useState<DailyLog | null>(null)

  // Edit state for selected log
  const [editDraft, setEditDraft] = useState<DailyLog | null>(null)

  const { data: contractsPage } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => getContracts(),
  })

  const { data: logsPage, isLoading } = useQuery({
    queryKey: ['daily-logs', contractId, month, tab],
    queryFn: () =>
      getDailyLogs({
        ...(contractId ? { contractId: Number(contractId) } : {}),
        month,
        ...(tab !== 'ALL' ? { approvalStatus: tab } : {}),
      }),
    enabled: Boolean(month),
  })

  const logs = logsPage?.content ?? []

  // Count per status
  const allLogs = logsPage?.content ?? []
  const counts = {
    ALL: logsPage?.totalElements ?? 0,
    PENDING: allLogs.filter((l) => l.approvalStatus === 'PENDING').length,
    APPROVED: allLogs.filter((l) => l.approvalStatus === 'APPROVED').length,
    REJECTED: allLogs.filter((l) => l.approvalStatus === 'REJECTED').length,
  }

  const approveMut = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      approveDailyLog(id, status, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-logs'] })
      setSelected(null)
      toast('Cập nhật trạng thái thành công.', 'success')
    },
    onError: () => toast('Không thể cập nhật trạng thái.', 'error'),
  })

  const reopenMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => reopenDailyLog(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-logs'] })
      setSelected(null)
      toast('Đã mở lại nhật ký.', 'success')
    },
    onError: () => toast('Không thể mở lại nhật ký.', 'error'),
  })

  const saveMut = useMutation({
    mutationFn: (log: DailyLog) => batchSaveDailyLogs([log]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-logs'] })
      setEditDraft(null)
      toast('Đã lưu chỉnh sửa.', 'success')
    },
    onError: () => toast('Không thể lưu chỉnh sửa.', 'error'),
  })

  function openDetail(log: DailyLog) {
    setSelected(log)
    setEditDraft({ ...log })
  }

  function handleApprove(log: DailyLog) {
    approveMut.mutate({ id: log.id, status: 'APPROVED' })
  }

  function handleRejectOpen(log: DailyLog) {
    setPendingLog(log)
    setRejectReason('')
    setShowRejectModal(true)
  }

  function handleRejectConfirm() {
    if (!pendingLog || !rejectReason.trim()) return
    approveMut.mutate({ id: pendingLog.id, status: 'REJECTED', reason: rejectReason })
    setShowRejectModal(false)
  }

  function handleReopenOpen(log: DailyLog) {
    setPendingLog(log)
    setReopenReason('')
    setShowReopenModal(true)
  }

  function handleReopenConfirm() {
    if (!pendingLog || !reopenReason.trim()) return
    reopenMut.mutate({ id: pendingLog.id, reason: reopenReason })
    setShowReopenModal(false)
  }

  function updateEdit(field: keyof DailyLog, value: string) {
    setEditDraft((cur) =>
      cur
        ? { ...cur, [field]: ['operatingHours', 'standbyHours'].includes(field) ? Number(value) : value }
        : cur,
    )
  }

  return (
    <AppShell>
      <PageHeader title="Duyệt nhật ký" />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <FormField label="Hợp đồng" htmlFor="filter-contract">
          <Select id="filter-contract" value={contractId} onChange={(e) => setContractId(e.target.value)} className="w-64">
            <option value="">— Tất cả hợp đồng —</option>
            {contractsPage?.content.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractNumber} — {c.projectName ?? ''}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tháng" htmlFor="filter-month">
          <Input id="filter-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
        </FormField>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={
              tab === value
                ? 'rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white'
                : 'rounded-md px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100'
            }
          >
            {label}
            {value !== 'ALL' && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {counts[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={selected ? 'grid grid-cols-[1fr_420px] gap-6' : 'block'}>
        {/* Table */}
        <div>
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : logs.length === 0 ? (
            <EmptyState
              title="Không có nhật ký nào"
              description="Chưa có nhật ký nào trong tháng này hoặc theo bộ lọc đã chọn."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 text-left">Ngày</th>
                    <th className="px-4 py-3 text-left">Thiết bị</th>
                    <th className="px-4 py-3 text-left">Người vận hành</th>
                    <th className="px-4 py-3 text-right">Giờ VH</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => openDetail(log)}
                      className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/50 ${selected?.id === log.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium">{formatDate(log.workDate)}</td>
                      <td className="px-4 py-3 text-gray-600">#{log.equipmentId}</td>
                      <td className="px-4 py-3 text-gray-600">{log.operatorName ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatHours(log.operatingHours)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.approvalStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {log.approvalStatus === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                title="Duyệt"
                                onClick={(e) => { e.stopPropagation(); handleApprove(log) }}
                                className="rounded p-1.5 text-green-600 hover:bg-green-50"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                type="button"
                                title="Từ chối"
                                onClick={(e) => { e.stopPropagation(); handleRejectOpen(log) }}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {log.approvalStatus !== 'PENDING' && (
                            <button
                              type="button"
                              title="Mở lại"
                              onClick={(e) => { e.stopPropagation(); handleReopenOpen(log) }}
                              className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
                            >
                              <RefreshCw size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Xem chi tiết"
                            onClick={(e) => { e.stopPropagation(); openDetail(log) }}
                            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && editDraft && (
          <Card className="flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <span className="text-xs font-bold tracking-wider text-blue-600">CHI TIẾT</span>
                <h2 className="mt-0.5 text-base font-semibold">{formatDate(selected.workDate)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Original image */}
            {selected.originalImageUrl && (
              <div className="border-b border-gray-100 bg-gray-50 p-4">
                <img
                  src={selected.originalImageUrl}
                  alt="Ảnh nhật ký gốc"
                  className="max-h-60 w-full rounded-lg object-contain"
                />
              </div>
            )}

            {/* Edit form */}
            <div className="flex flex-col gap-3 overflow-y-auto p-5">
              <StatusBadge status={selected.approvalStatus} />

              {selected.rejectionReason && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <strong>Lý do từ chối:</strong> {selected.rejectionReason}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Giờ vận hành">
                  <Input type="number" min="0" step="0.01" value={editDraft.operatingHours} onChange={(e) => updateEdit('operatingHours', e.target.value)} />
                </FormField>
                <FormField label="Giờ chờ">
                  <Input type="number" min="0" step="0.01" value={editDraft.standbyHours} onChange={(e) => updateEdit('standbyHours', e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ca sáng: Bắt đầu">
                  <Input type="time" value={editDraft.morningStartTime ?? ''} onChange={(e) => updateEdit('morningStartTime', e.target.value)} />
                </FormField>
                <FormField label="Ca sáng: Kết thúc">
                  <Input type="time" value={editDraft.morningEndTime ?? ''} onChange={(e) => updateEdit('morningEndTime', e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ca chiều: Bắt đầu">
                  <Input type="time" value={editDraft.afternoonStartTime ?? ''} onChange={(e) => updateEdit('afternoonStartTime', e.target.value)} />
                </FormField>
                <FormField label="Ca chiều: Kết thúc">
                  <Input type="time" value={editDraft.afternoonEndTime ?? ''} onChange={(e) => updateEdit('afternoonEndTime', e.target.value)} />
                </FormField>
              </div>
              <FormField label="Người vận hành">
                <Input value={editDraft.operatorName ?? ''} onChange={(e) => updateEdit('operatorName', e.target.value)} />
              </FormField>
              <FormField label="Mô tả công việc">
                <Textarea rows={3} value={editDraft.workDescription ?? ''} onChange={(e) => updateEdit('workDescription', e.target.value)} />
              </FormField>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={saveMut.isPending}
                  onClick={() => saveMut.mutate(editDraft)}
                >
                  Lưu chỉnh sửa
                </Button>
                {selected.approvalStatus === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      loading={approveMut.isPending}
                      onClick={() => handleApprove(selected)}
                    >
                      <Check size={14} /> Duyệt
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectOpen(selected)}
                    >
                      <X size={14} /> Từ chối
                    </Button>
                  </>
                )}
                {selected.approvalStatus !== 'PENDING' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReopenOpen(selected)}
                  >
                    <RefreshCw size={14} /> Mở lại
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Từ chối nhật ký"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Nhập lý do từ chối để Operator biết cần chỉnh sửa gì.</p>
          <FormField label="Lý do từ chối" htmlFor="reject-reason" required>
            <Textarea
              id="reject-reason"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Giờ ghi không khớp ảnh gốc..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              loading={approveMut.isPending}
              onClick={handleRejectConfirm}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reopen Modal */}
      <Modal
        open={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Mở lại nhật ký"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Nhật ký sẽ chuyển về PENDING để chỉnh sửa và review lại.</p>
          <FormField label="Lý do mở lại" htmlFor="reopen-reason" required>
            <Textarea
              id="reopen-reason"
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="VD: Bổ sung giờ làm theo ảnh gốc..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowReopenModal(false)}>Hủy</Button>
            <Button
              disabled={!reopenReason.trim()}
              loading={reopenMut.isPending}
              onClick={handleReopenConfirm}
            >
              Xác nhận mở lại
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
