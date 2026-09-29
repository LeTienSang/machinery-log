import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function formatMonth(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month] = value.split('-')
  return `Tháng ${month}/${year}`
}

export function formatHours(value: number | string | null | undefined): string {
  if (value == null) return '—'
  return `${value}h`
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
