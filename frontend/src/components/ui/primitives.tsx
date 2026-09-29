import { cn } from '@/lib/utils'

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-gray-100 last:border-0">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
      <p className="text-base font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border-transparent',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  destructive: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
}
const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

// ─── Input ────────────────────────────────────────────────────────────────────

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { error?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'

// ─── Label ────────────────────────────────────────────────────────────────────

export function Label({ htmlFor, children, required }: { htmlFor?: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-gray-700">
      {children}{required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({ label, htmlFor, required, children }: { label: string; htmlFor?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} required={required}>{label}</Label>
      {children}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <select
        ref={ref}
        className={cn(
          'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
)
Select.displayName = 'Select'

// ─── Textarea ─────────────────────────────────────────────────────────────────

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Modal / Dialog ───────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({
  open, onClose, title, children, size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) { if (!el.open) el.showModal() }
    else { el.close() }
  }, [open])

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40',
        sizeClass[size],
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  )
}
