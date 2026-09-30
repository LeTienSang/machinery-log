import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getDailyLogs, getContracts, processOcrLog, logout } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button, Card } from '@/components/ui/primitives'
import { useAuth } from '@/contexts/auth'
import { useToast } from '@/components/ui/toast'
import { formatDate, currentMonth } from '@/lib/utils'
import { compressForOCR } from '@/utils/compressImage'
import { Upload, ClipboardCheck, FileSpreadsheet, ArrowRight, Clock, FileImage, LogOut } from 'lucide-react'

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

function OperatorHome() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const month = currentMonth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const { data: myLogs } = useQuery({
    queryKey: ['my-daily-logs', month],
    queryFn: () => getDailyLogs({ month }),
  })

  const total = myLogs?.totalElements ?? '—'
  const pending = myLogs ? myLogs.content.filter((l) => l.approvalStatus === 'PENDING').length : '—'

  function pick(f: File | null) {
    setFile(f)
    setDone(false)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSend() {
    if (!file || sending) return
    setSending(true)
    try {
      let uploadFile = file
      try {
        uploadFile = await compressForOCR(file)
      } catch {
        /* dùng ảnh gốc */
      }
      // Không gửi contractId / workDate — kế toán bổ sung ở Review nếu thiếu.
      await processOcrLog(uploadFile, null, null, null)
      setDone(true)
      setFile(null)
      setPreview(null)
      toast('Đã gửi nhật ký, chờ kế toán duyệt.', 'success')
      void queryClient.invalidateQueries({ queryKey: ['my-daily-logs'] })
    } catch {
      toast('Gửi thất bại. Kiểm tra ảnh và mạng rồi thử lại.', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleLogout() {
    await logout()
    signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar tối giản, không sidebar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-[11px] font-bold text-white">ML</span>
          <span className="text-sm font-bold tracking-widest text-gray-900">MACHINERY</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="max-w-28 truncate text-sm text-gray-600">{user?.displayName}</span>
          <button type="button" onClick={() => void handleLogout()} title="Đăng xuất" className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-5">
        {/* Số liệu — chỉ số, không biểu đồ */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="mt-1 text-xs text-gray-500">Log tháng này</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{pending}</p>
            <p className="mt-1 text-xs text-gray-500">Chờ duyệt</p>
          </Card>
        </div>

        {/* Upload gộp chung một khối */}
        <Card className="p-5">
          {done && !file ? (
            <div className="py-4 text-center">
              <p className="text-base font-semibold text-green-700">Đã gửi xong ✔</p>
              <p className="mt-1 text-sm text-gray-500">Nhật ký đang chờ kế toán duyệt.</p>
              <label htmlFor="op-log-file" className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium text-white hover:bg-blue-700">
                Chụp tiếp
              </label>
            </div>
          ) : (
            <>
              <label
                htmlFor="op-log-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-10 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50"
              >
                <FileImage size={36} className="text-gray-400" />
                <span className="font-medium text-gray-700">{file ? file.name : 'Chạm để chụp / chọn ảnh sổ'}</span>
                {!file && <span className="text-xs">JPG, PNG, HEIC — tối đa 10MB</span>}
              </label>
              <input
                id="op-log-file"
                type="file"
                accept="image/jpeg,image/png,image/heic"
                capture="environment"
                className="sr-only"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              {preview && <img src={preview} alt="Preview" className="mt-3 max-h-56 w-full rounded-lg object-contain" />}
              <Button size="lg" loading={sending} disabled={!file} onClick={() => void handleSend()} className="mt-4 w-full">
                <Upload size={18} />
                {sending ? 'Đang gửi...' : 'Gửi nhật ký'}
              </Button>
            </>
          )}
        </Card>

        {/* Log gần đây — dạng thẻ đơn giản */}
        {myLogs && myLogs.content.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {myLogs.content.slice(0, 10).map((log) => (
              <Card key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(log.workDate)}</p>
                  <p className="text-xs text-gray-400">{log.operatingHours}h vận hành</p>
                </div>
                <StatusBadge status={log.approvalStatus} />
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
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

  const { data: contracts } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => getContracts({ status: 'ACTIVE' }),
    enabled: isAccountant,
  })

  // Operator: một trang duy nhất, không sidebar, không trang Tổng quan riêng.
  if (!isAccountant) return <OperatorHome />

  return (
    <AppShell>
      <PageHeader title={`Xin chào, ${user?.displayName ?? 'bạn'}!`} />

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
    </AppShell>
  )
}
