import { ClipboardCheck, FileSpreadsheet, LayoutDashboard, Upload, Wrench } from 'lucide-react'

const navigation = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Upload nhật ký', icon: Upload },
  { label: 'Duyệt log', icon: ClipboardCheck },
  { label: 'Báo cáo', icon: FileSpreadsheet },
  { label: 'Danh mục', icon: Wrench },
]

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>ML</span><div><strong>MACHINERY</strong><small>Digital logbook</small></div></div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ label, icon: Icon }, index) => (
            <button className={`nav-item ${index === 0 ? 'active' : ''}`} key={label} type="button">
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

export default App
