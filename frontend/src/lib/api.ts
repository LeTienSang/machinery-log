import axios from 'axios'

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
}

export type LoginRequest = {
  username: string
  password: string
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type DailyLog = {
  id: number
  contractId: number
  equipmentId: number
  workDate: string
  operatingHours: number
  standbyHours: number
  workDescription?: string
  operatorName?: string
  originalImageUrl?: string
  approvalStatus: ApprovalStatus
  rejectionReason?: string
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
})

export async function login(request: LoginRequest) {
  const { data } = await api.post<AuthResponse>('/auth/login', request)
  sessionStorage.setItem('machinery-log.access-token', data.accessToken)
  sessionStorage.setItem('machinery-log.refresh-token', data.refreshToken)
  return data
}

async function refreshSession() {
  const refreshToken = sessionStorage.getItem('machinery-log.refresh-token')
  if (!refreshToken) throw new Error('No refresh token')
  const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken })
  sessionStorage.setItem('machinery-log.access-token', data.accessToken)
  sessionStorage.setItem('machinery-log.refresh-token', data.refreshToken)
  return data
}

export function clearSession() {
  sessionStorage.removeItem('machinery-log.access-token')
  sessionStorage.removeItem('machinery-log.refresh-token')
}

export async function getDailyLogs() {
  const { data } = await api.get<PageResponse<DailyLog>>('/daily-logs', { params: { page: 0, size: 20 } })
  return data
}

export async function approveDailyLog(id: number, approvalStatus: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
  const { data } = await api.put<DailyLog>(`/daily-logs/${id}/approve`, { approvalStatus, rejectionReason })
  return data
}

export async function reopenDailyLog(id: number, reopenReason: string) {
  const { data } = await api.post<DailyLog>(`/daily-logs/${id}/reopen`, { reopenReason })
  return data
}

export async function processOcrLog(file: File, contractId: number, equipmentId: number, workDate: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('contractId', String(contractId))
  form.append('equipmentId', String(equipmentId))
  form.append('workDate', workDate)
  const { data } = await api.post<DailyLog>('/ocr/process-log', form)
  return data
}

export async function saveDailyLog(log: DailyLog) {
  const { data } = await api.post<DailyLog[]>('/daily-logs/batch-save', [log])
  return data[0]
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('machinery-log.access-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, async (error) => {
  const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined
  const isAuthRequest = originalRequest?.url?.includes('/auth/')
  if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
    return Promise.reject(error)
  }

  originalRequest._retry = true
  try {
    await refreshSession()
    return api(originalRequest)
  } catch (refreshError) {
    clearSession()
    return Promise.reject(refreshError)
  }
})
