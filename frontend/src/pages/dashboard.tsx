import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getDailyLogs, getContracts } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button, Card } from '@/components/ui/primitives'
import { useAuth } from '@/contexts/auth'
import { formatDate, currentMonth } from '@/lib/utils'
import { Upload, ClipboardCheck, FileSpreadsheet, ArrowRight, Clock } from 'lucide-react'

function MetricCard({ label, value, sub, color = 'blue' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-700 bg-blue-50',
    amber: 'text-amber-700 bg-amber-50',
    green: 'text-green-700 bg-green-50',
  }
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colorMap[color] ? '' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const isAccountant = user?.role === 'ACCOUNTANT_ADMIN'
  const month = currentMonth()

  const { data: pendingLogs } = useQuery({
    queryKey: ['daily-logs-pending', month],
    queryFn: () => getDailyLogs({ month, approvalStatus: 'PENDING' }),
    enabled: isAccountant,
  })

  const { data: approvedLogs } = useQuery({
    queryKey: ['daily-logs-approved', month],
    queryFn: () => getDailyLogs({ month, approvalStatus: 'APPROVED' }),
    enabled: isAccountant,
  })

  const { data: myLogs } = useQuery({
    queryKey: ['my-daily-logs', month],
    queryFn: () => getDailyLogs({ month }),
    enabled: !isAccountant,
  })

  const { data: contracts } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => getContracts({ status: 'ACTIVE' }),
    enabled: isAccountant,
  })

  return (
    <AppShell>
      <PageHeader title={`Xin chào, ${user?.displayName ?? 'bạn'}!`} />

      {isAccountant ? (
        <>
          {/* Metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Log chờ duyệt"
              value={pendingLogs?.totalElements ?? '—'}
              sub="Cần xử lý hôm nay"
              color="amber"
            />
            <MetricCard
              label="Log đã duyệt tháng này"
              value={approvedLogs?.totalElements ?? '—'}
              sub={`Tháng ${month}`}
              color="green"
            />
            <MetricCard
              label="Hợp đồng đang hoạt động"
              value={contracts?.totalElements ?? '—'}
              sub="Hợp đồng ACTIVE"
              color="blue"
            />
          </div>

          {/* Quick actions */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { to: '/review', icon: ClipboardCheck, label: 'Duyệt nhật ký', desc: 'Review và approve/reject log', color: 'blue' },
              { to: '/export', icon: FileSpreadsheet, label: 'Xuất báo cáo', desc: 'Xuất bộ 3 file Excel + ZIP', color: 'green' },
              { to: '/debt', icon: Clock, label: 'Công nợ', desc: 'Theo dõi tạm ứng và đối chiếu', color: 'amber' },
            ].map(({ to, icon: Icon, label, desc, color }) => (
              <Link key={to} to={to}>
                <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className={`grid h-10 w-10 place-items-center rounded-lg ${
                      color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      color === 'green' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300" />
                </Card>
              </Link>
            ))}
          </div>

          {/* Pending logs preview */}
          {pendingLogs && pendingLogs.content.length > 0 && (
            <Card>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Nhật ký chờ duyệt gần đây</h2>
                <Link to="/review">
                  <Button variant="ghost" size="sm">Xem tất cả <ArrowRight size={14} /></Button>
                </Link>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-2 text-left">Ngày</th>
                    <th className="px-6 py-2 text-left">Người vận hành</th>
                    <th className="px-6 py-2 text-right">Giờ VH</th>
                    <th className="px-6 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLogs.content.slice(0, 5).map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-3">{formatDate(log.workDate)}</td>
                      <td className="px-6 py-3 text-gray-600">{log.operatorName ?? '—'}</td>
                      <td className="px-6 py-3 text-right font-mono">{log.operatingHours}h</td>
                      <td className="px-6 py-3"><StatusBadge status={log.approvalStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : (
        /* Operator view */
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              label="Log tháng này"
              value={myLogs?.totalElements ?? '—'}
              sub={`Tháng ${month}`}
              color="blue"
            />
            <MetricCard
              label="Đang chờ duyệt"
              value={myLogs?.content.filter((l) => l.approvalStatus === 'PENDING').length ?? '—'}
              sub="Chưa được xử lý"
              color="amber"
            />
          </div>

          {/* Quick upload */}
          <Card className="mb-6 flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <Upload size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Upload nhật ký hôm nay</p>
                <p className="text-sm text-gray-500">Chụp ảnh sổ nhật ký và gửi để kế toán duyệt.</p>
              </div>
            </div>
            <Link to="/upload">
              <Button>Upload ngay</Button>
            </Link>
          </Card>

          {/* My logs */}
          {myLogs && myLogs.content.length > 0 && (
            <Card>
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Nhật ký của tôi — {month}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-2 text-left">Ngày</th>
                    <th className="px-6 py-2 text-right">Giờ VH</th>
                    <th className="px-6 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {myLogs.content.slice(0, 10).map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-3">{formatDate(log.workDate)}</td>
                      <td className="px-6 py-3 text-right font-mono">{log.operatingHours}h</td>
                      <td className="px-6 py-3"><StatusBadge status={log.approvalStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </AppShell>
  )
}
