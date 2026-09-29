import { cn } from '@/lib/utils'
import type { ApprovalStatus, AcceptanceStatus, ContractStatus, DebtReconciliationStatus } from '@/lib/types'

type StatusValue = ApprovalStatus | AcceptanceStatus | ContractStatus | DebtReconciliationStatus | string

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Approval
  PENDING: { label: 'Chờ duyệt', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  APPROVED: { label: 'Đã duyệt', className: 'text-green-700 bg-green-50 border-green-200' },
  REJECTED: { label: 'Từ chối', className: 'text-red-700 bg-red-50 border-red-200' },
  // Acceptance
  PENDING_SIGNATURE: { label: 'Chờ ký', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  SIGNED: { label: 'Đã ký', className: 'text-green-700 bg-green-50 border-green-200' },
  NEEDS_RECALCULATION: { label: 'Cần tính lại', className: 'text-orange-700 bg-orange-50 border-orange-200' },
  // Contract
  ACTIVE: { label: 'Đang hoạt động', className: 'text-green-700 bg-green-50 border-green-200' },
  EXPIRED: { label: 'Hết hạn', className: 'text-gray-600 bg-gray-50 border-gray-200' },
  TERMINATED: { label: 'Đã chấm dứt', className: 'text-red-700 bg-red-50 border-red-200' },
  // Debt
  PENDING_RECONCILIATION: { label: 'Chưa đối chiếu', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  RECONCILED: { label: 'Đã đối chiếu', className: 'text-green-700 bg-green-50 border-green-200' },
}

export function StatusBadge({ status }: { status: StatusValue }) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'text-gray-600 bg-gray-50 border-gray-200' }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.className)}>
      {cfg.label}
    </span>
  )
}
