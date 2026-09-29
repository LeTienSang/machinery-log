import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { login } from '@/lib/api'
import { useAuth } from '@/contexts/auth'
import { Button, Input, FormField } from '@/components/ui/primitives'

export function LoginPage() {
  const { setUser } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      setUser(user)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      setError(status === 401
        ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
        : 'Không thể kết nối máy chủ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Form panel */}
      <div className="flex w-full max-w-md flex-col justify-center px-10 py-12">
        {/* Brand */}
        <div className="mb-10 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            ML
          </span>
          <div>
            <p className="text-sm font-bold tracking-widest text-gray-900">MACHINERY</p>
            <p className="text-xs text-gray-400">Digital Logbook</p>
          </div>
        </div>

        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">Đăng nhập</p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">Chào mừng trở lại</h1>
        <p className="mb-8 text-sm text-gray-500">
          Truy cập nhật ký vận hành, quy trình duyệt và báo cáo.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <FormField label="Tên đăng nhập" htmlFor="username" required>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Mật khẩu" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            <LogIn size={16} />
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </Button>
        </form>
      </div>

      {/* Aside banner */}
      <div className="hidden flex-1 flex-col justify-end bg-gradient-to-br from-blue-900 to-blue-600 p-16 lg:flex">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-200">
          Hệ thống số hóa nhật ký
        </p>
        <h2 className="text-5xl font-bold leading-tight tracking-tight text-white">
          Ghi nhận<br />chính xác.<br />Vận hành<br />rõ ràng.
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-blue-200">
          Không gian tập trung cho dữ liệu máy móc — từ ảnh nhật ký đến báo cáo Excel trong vài phút.
        </p>
      </div>
    </div>
  )
}
