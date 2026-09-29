import { FormEvent, useEffect, useState } from 'react'
import { ClipboardCheck, FileSpreadsheet, LayoutDashboard, LogIn, Upload, Wrench } from 'lucide-react'
import axios from 'axios'
import { approveDailyLog, clearSession, DailyLog, getDailyLogs, login, processOcrLog, reopenDailyLog, saveDailyLog } from './lib/api'

const navigation = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Upload nhật ký', icon: Upload },
  { label: 'Duyệt log', icon: ClipboardCheck },
  { label: 'Báo cáo', icon: FileSpreadsheet },
  { label: 'Danh mục', icon: Wrench },
]

function Dashboard() {
  const [view, setView] = useState<'overview' | 'logs' | 'upload'>('overview')

  if (view === 'logs') return <DailyLogsPage onBack={() => setView('overview')} />
  if (view === 'upload') return <UploadLogPage onBack={() => setView('overview')} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>ML</span><div><strong>MACHINERY</strong><small>Digital logbook</small></div></div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ label, icon: Icon }, index) => (
            <button className={`nav-item ${index === 0 ? 'active' : ''}`} key={label} type="button" onClick={() => index === 1 ? setView('upload') : index === 2 ? setView('logs') : index === 0 ? setView('overview') : undefined}>
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

function UploadLogPage({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [contractId, setContractId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10))
  const [draft, setDraft] = useState<DailyLog | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleOcr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return setError('Chọn ảnh nhật ký trước khi xử lý.')
    setIsBusy(true)
    setError('')
    setMessage('Đang tải ảnh và đọc dữ liệu OCR...')
    try {
      const result = await processOcrLog(file, Number(contractId), Number(equipmentId), workDate)
      setDraft(result)
      setMessage('OCR hoàn tất. Kiểm tra và chỉnh sửa dữ liệu trước khi gửi.')
    } catch {
      setError('Không thể xử lý ảnh nhật ký. Kiểm tra file và kết nối máy chủ.')
      setMessage('')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSave() {
    if (!draft) return
    setIsBusy(true)
    setError('')
    try {
      const saved = await saveDailyLog(draft)
      setDraft(saved)
      setMessage('Đã gửi nhật ký vào hàng đợi chờ duyệt.')
    } catch {
      setError('Không thể lưu nhật ký đã chỉnh sửa.')
    } finally {
      setIsBusy(false)
    }
  }

  function updateDraft(field: keyof DailyLog, value: string) {
    setDraft((current) => current ? { ...current, [field]: field === 'operatingHours' || field === 'standbyHours' ? Number(value) : value } : current)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar"><div className="brand-mark"><span>ML</span><div><strong>MACHINERY</strong><small>Digital logbook</small></div></div><button className="nav-item active" type="button" onClick={onBack}><LayoutDashboard size={18} /> Tổng quan</button><div className="sidebar-footer"><span className="status-dot" /> Hệ thống sẵn sàng</div></aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">OPERATIONS / CAPTURE</p><h1>Upload nhật ký</h1></div><button className="text-button" type="button" onClick={onBack}>Quay lại tổng quan</button></header>
        <section className="upload-grid">
          <form className="upload-panel" onSubmit={handleOcr}>
            <div className="card-heading"><span className="step-index">01</span><div><h3>Đọc ảnh nhật ký</h3><p>Chụp rõ toàn bộ trang, sau đó kiểm tra dữ liệu OCR.</p></div></div>
            <label htmlFor="log-file">Ảnh nhật ký</label><input id="log-file" type="file" accept="image/jpeg,image/png,image/heic" capture="environment" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
            <div className="form-row"><div><label htmlFor="contract-id">Mã hợp đồng</label><input id="contract-id" type="number" min="1" value={contractId} onChange={(event) => setContractId(event.target.value)} required /></div><div><label htmlFor="equipment-id">Mã thiết bị</label><input id="equipment-id" type="number" min="1" value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)} required /></div></div>
            <label htmlFor="work-date">Ngày vận hành</label><input id="work-date" type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} required />
            {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-message" role="status">{message}</p>}
            <button className="login-button" type="submit" disabled={isBusy}>{isBusy ? 'Đang xử lý...' : 'Đọc dữ liệu từ ảnh'}</button>
          </form>
          <section className="upload-panel" aria-live="polite"><div className="card-heading"><span className="step-index">02</span><div><h3>Kiểm tra và gửi</h3><p>Dữ liệu OCR luôn có thể chỉnh sửa trước khi gửi.</p></div></div>{!draft ? <div className="empty-state">Kết quả OCR sẽ hiển thị tại đây.</div> : <div className="draft-form"><label htmlFor="draft-hours">Giờ vận hành</label><input id="draft-hours" type="number" min="0" step="0.01" value={draft.operatingHours} onChange={(event) => updateDraft('operatingHours', event.target.value)} /><label htmlFor="draft-standby">Giờ chờ</label><input id="draft-standby" type="number" min="0" step="0.01" value={draft.standbyHours} onChange={(event) => updateDraft('standbyHours', event.target.value)} /><label htmlFor="draft-description">Mô tả công việc</label><textarea id="draft-description" value={draft.workDescription ?? ''} onChange={(event) => updateDraft('workDescription', event.target.value)} rows={5} /><button className="login-button" type="button" disabled={isBusy} onClick={() => void handleSave()}>Gửi nhật ký chờ duyệt</button></div>}</section>
        </section>
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
