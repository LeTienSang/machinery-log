import { FormEvent, useEffect, useState } from 'react'
import { ClipboardCheck, FileSpreadsheet, LayoutDashboard, LogIn, Upload, Wrench } from 'lucide-react'
import axios from 'axios'
import { approveDailyLog, clearSession, DailyLog, getDailyLogs, login, reopenDailyLog } from './lib/api'

const navigation = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Upload nhật ký', icon: Upload },
  { label: 'Duyệt log', icon: ClipboardCheck },
  { label: 'Báo cáo', icon: FileSpreadsheet },
  { label: 'Danh mục', icon: Wrench },
]

function Dashboard() {
  const [view, setView] = useState<'overview' | 'logs'>('overview')

  if (view === 'logs') return <DailyLogsPage onBack={() => setView('overview')} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>ML</span><div><strong>MACHINERY</strong><small>Digital logbook</small></div></div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ label, icon: Icon }, index) => (
            <button className={`nav-item ${index === 0 ? 'active' : ''}`} key={label} type="button" onClick={() => index === 2 && setView('logs')}>
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer"><span className="status-dot" /> Hệ thống sẵn sàng</div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">OPERATIONS / OVERVIEW</p><h1>Nhật ký vận hành</h1></div><div className="profile"><span className="avatar">AT</span><div><strong>Accountant Admin</strong><small>Đang đăng nhập</small></div></div></header>
        <section className="welcome-panel"><div><p className="eyebrow accent">WORKSPACE STATUS</p><h2>Nền tảng đã sẵn sàng cho phiên làm việc đầu tiên.</h2><p>Kết nối dữ liệu nhật ký, quy trình duyệt và báo cáo trong một không gian tập trung.</p></div><div className="signal"><span className="signal-ring" /><strong>01</strong><small>workspace</small></div></section>
        <section className="metric-grid" aria-label="Tổng quan hệ thống"><article><span className="metric-label">Log chờ duyệt</span><strong>--</strong><small>Chưa kết nối dữ liệu</small></article><article><span className="metric-label">Giờ vận hành tháng này</span><strong>--</strong><small>Đang chờ kỳ billing</small></article><article><span className="metric-label">Báo cáo đã xuất</span><strong>--</strong><small>Chưa có bản ghi</small></article></section>
        <section className="setup-grid"><article className="setup-card"><div className="card-heading"><span className="step-index">01</span><div><h3>Khởi tạo backend</h3><p>Spring Boot API và lớp xác thực JWT.</p></div></div><span className="tag">IN PROGRESS</span></article><article className="setup-card"><div className="card-heading"><span className="step-index">02</span><div><h3>Chuẩn bị cơ sở dữ liệu</h3><p>PostgreSQL, migrations và audit trail.</p></div></div><span className="tag muted">NEXT</span></article></section>
      </main>
    </div>
  )
}

function DailyLogsPage({ onBack }: { onBack: () => void }) {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function loadLogs() {
    setIsLoading(true)
    setError('')
    try {
      const page = await getDailyLogs()
      setLogs(page.content)
    } catch {
      setError('Không thể tải danh sách nhật ký.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadLogs() }, [])

  async function handleApproval(log: DailyLog, status: 'APPROVED' | 'REJECTED') {
    const rejectionReason = status === 'REJECTED' ? window.prompt('Nhập lý do từ chối') ?? '' : undefined
    if (status === 'REJECTED' && !(rejectionReason ?? '').trim()) return
    setBusyId(log.id)
    try {
      await approveDailyLog(log.id, status, rejectionReason)
      await loadLogs()
    } catch {
      setError('Không thể cập nhật trạng thái nhật ký.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReopen(log: DailyLog) {
    const reason = window.prompt('Nhập lý do mở lại nhật ký') ?? ''
    if (!reason.trim()) return
    setBusyId(log.id)
    try {
      await reopenDailyLog(log.id, reason)
      await loadLogs()
    } catch {
      setError('Không thể mở lại nhật ký.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>ML</span><div><strong>MACHINERY</strong><small>Digital logbook</small></div></div>
        <button className="nav-item active" type="button" onClick={onBack}><LayoutDashboard size={18} /> Tổng quan</button>
        <div className="sidebar-footer"><span className="status-dot" /> Hệ thống sẵn sàng</div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">OPERATIONS / REVIEW</p><h1>Danh sách nhật ký</h1></div><button className="text-button" type="button" onClick={onBack}>Quay lại tổng quan</button></header>
        <section className="logs-toolbar"><div><strong>Review queue</strong><span>{logs.length} bản ghi trong trang hiện tại</span></div><button className="refresh-button" type="button" onClick={() => void loadLogs()}>Làm mới</button></section>
        {error && <p className="form-error" role="alert">{error}</p>}
        {isLoading ? <div className="empty-state">Đang tải nhật ký...</div> : logs.length === 0 ? <div className="empty-state">Chưa có nhật ký cần xử lý.</div> : <div className="logs-table-wrap"><table className="logs-table"><thead><tr><th>Ngày</th><th>Thiết bị</th><th>Operator</th><th>Giờ vận hành</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{log.workDate}</td><td>#{log.equipmentId}</td><td>{log.operatorName ?? 'Chưa gán'}</td><td>{log.operatingHours}h</td><td><span className={`status-badge ${log.approvalStatus.toLowerCase()}`}>{log.approvalStatus}</span></td><td><div className="row-actions">{log.approvalStatus === 'PENDING' && <><button type="button" disabled={busyId === log.id} onClick={() => void handleApproval(log, 'APPROVED')}>Duyệt</button><button type="button" disabled={busyId === log.id} onClick={() => void handleApproval(log, 'REJECTED')}>Từ chối</button></>}{log.approvalStatus !== 'PENDING' && <button type="button" disabled={busyId === log.id} onClick={() => void handleReopen(log)}>Mở lại</button>}</div></td></tr>)}</tbody></table></div>}
      </main>
    </div>
  )
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login({ username, password })
      onAuthenticated()
    } catch (requestError) {
      clearSession()
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.')
      } else {
        setError('Không thể kết nối máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark login-brand"><span>ML</span><div><strong>MACHINERY</strong><small>Digital logbook</small></div></div>
        <p className="eyebrow accent">SECURE WORKSPACE</p>
        <h1 id="login-title">Đăng nhập hệ thống</h1>
        <p className="login-copy">Truy cập nhật ký vận hành, quy trình duyệt và báo cáo của đội ngũ.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Tên đăng nhập</label>
          <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="login-button" type="submit" disabled={isSubmitting}>
            <LogIn size={17} />
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </section>
      <aside className="login-aside"><span className="aside-kicker">OPERATIONS / 01</span><strong>Ghi nhận chính xác.<br />Vận hành rõ ràng.</strong><span>Không gian làm việc tập trung cho dữ liệu máy móc và quyết định nhanh hơn.</span></aside>
    </main>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(sessionStorage.getItem('machinery-log.access-token')))

  if (!isAuthenticated) return <LoginScreen onAuthenticated={() => setIsAuthenticated(true)} />
  return <Dashboard />
}

export default App
