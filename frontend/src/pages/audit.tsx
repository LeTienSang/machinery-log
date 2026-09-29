import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { Button, Input, Select, FormField } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState } from '@/components/ui/primitives'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AuditLog } from '@/lib/types'

const ENTITY_TYPES = ['', 'DailyLog', 'MonthlyAcceptance', 'DebtReconciliation', 'AdvancePayment', 'Contract', 'Customer', 'Equipment']
const ACTIONS = ['', 'APPROVE', 'REJECT', 'REOPEN', 'SIGN', 'RECONCILE', 'EXPORT_CREATED', 'EXPORT_INVALIDATED']

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = log.oldValues || log.newValues

  return (
    <>
      <tr
        className={`border-b border-gray-50 text-sm ${hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasDetails && setExpanded((e) => !e)}
      >
        <td className="px-4 py-3 font-mono text-xs text-gray-500">
          {new Date(log.createdAt).toLocaleString('vi-VN')}
        </td>
        <td className="px-4 py-3 font-medium">{log.actorUsername}</td>
        <td className="px-4 py-3">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">{log.entityType}</span>
          <span className="ml-1 text-gray-400">#{log.entityId}</span>
        </td>
        <td className="px-4 py-3">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">{log.action}</span>
        </td>
        <td className="px-4 py-3 text-gray-500">{log.reason ?? '—'}</td>
        <td className="px-4 py-3 text-gray-400">
          {hasDetails && (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={6} className="px-6 py-3">
            <div className="grid grid-cols-2 gap-4">
              {log.oldValues && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Trước</p>
                  <pre className="max-h-40 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800">
                    {JSON.stringify(log.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              {log.newValues && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Sau</p>
                  <pre className="max-h-40 overflow-auto rounded bg-green-50 p-2 text-xs text-green-800">
                    {JSON.stringify(log.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditPage() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, action, from, to, page],
    queryFn: () =>
      getAuditLogs({
        entityType: entityType || undefined,
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        size: 30,
      }),
  })

  const logs = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <AppShell>
      <PageHeader title="Lịch sử thao tác" />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FormField label="Loại đối tượng">
          <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(0) }} className="w-44">
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t || '— Tất cả —'}</option>)}
          </Select>
        </FormField>
        <FormField label="Hành động">
          <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(0) }} className="w-44">
            {ACTIONS.map((a) => <option key={a} value={a}>{a || '— Tất cả —'}</option>)}
          </Select>
        </FormField>
        <FormField label="Từ ngày">
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0) }} className="w-40" />
        </FormField>
        <FormField label="Đến ngày">
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0) }} className="w-40" />
        </FormField>
        <Button variant="secondary" size="sm" onClick={() => { setEntityType(''); setAction(''); setFrom(''); setTo(''); setPage(0) }}>
          Xóa bộ lọc
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : logs.length === 0 ? (
        <EmptyState title="Không có bản ghi thao tác nào" description="Thử thay đổi bộ lọc." />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Người thực hiện</th>
                  <th className="px-4 py-3 text-left">Đối tượng</th>
                  <th className="px-4 py-3 text-left">Hành động</th>
                  <th className="px-4 py-3 text-left">Lý do</th>
                  <th className="px-4 py-3 text-left">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => <AuditRow key={log.id} log={log} />)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Trang {page + 1} / {totalPages} — {data?.totalElements ?? 0} bản ghi
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Trước
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
