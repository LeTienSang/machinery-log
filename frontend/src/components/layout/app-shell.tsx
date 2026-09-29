import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, ClipboardCheck, FileSpreadsheet,
  Users, Wrench, FileText, Banknote, History, LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth'
import { logout } from '@/lib/api'

type NavItem = {
  label: string
  to: string
  icon: React.ElementType
  roles?: Array<'OPERATOR' | 'ACCOUNTANT_ADMIN'>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload nhật ký', to: '/upload', icon: Upload, roles: ['OPERATOR', 'ACCOUNTANT_ADMIN'] },
  { label: 'Duyệt nhật ký', to: '/review', icon: ClipboardCheck, roles: ['ACCOUNTANT_ADMIN'] },
  { label: 'Hợp đồng', to: '/contracts', icon: FileText, roles: ['ACCOUNTANT_ADMIN'] },
  { label: 'Khách hàng', to: '/customers', icon: Users, roles: ['ACCOUNTANT_ADMIN'] },
  { label: 'Thiết bị', to: '/equipment', icon: Wrench, roles: ['ACCOUNTANT_ADMIN'] },
  { label: 'Công nợ', to: '/debt', icon: Banknote, roles: ['ACCOUNTANT_ADMIN'] },
  { label: 'Xuất báo cáo', to: '/export', icon: FileSpreadsheet, roles: ['ACCOUNTANT_ADMIN'] },
  { label: 'Lịch sử thao tác', to: '/audit', icon: History, roles: ['ACCOUNTANT_ADMIN'] },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    signOut()
    navigate('/')
  }

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || !user || item.roles.includes(user.role),
  )

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-xs font-bold text-white">
          ML
        </span>
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-900">MACHINERY</p>
          <p className="text-[11px] text-gray-400">Digital Logbook</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {visible.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 font-semibold text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100',
              )
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-100 p-3">
        {user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {user.displayName.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">{user.displayName}</p>
              <p className="text-[11px] text-gray-400">
                {user.role === 'ACCOUNTANT_ADMIN' ? 'Kế toán / Admin' : 'Vận hành'}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
}: {
  title: string
  breadcrumbs?: Array<{ label: string; to?: string }>
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-gray-400">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} />}
                <span>{crumb.label}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
