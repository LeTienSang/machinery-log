import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

// ─── Toast types ─────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  function toast(message: string, variant: ToastVariant = 'success') {
    const id = ++counter
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-md',
              t.variant === 'success' && 'bg-green-50 border-green-200 text-green-800',
              t.variant === 'error' && 'bg-red-50 border-red-200 text-red-800',
              t.variant === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
            )}
          >
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
