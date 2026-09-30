import axios from 'axios'
import type {
  AuthResponse, CurrentUser, PageResponse, UserDto,
  DailyLog, Customer, Equipment, Contract, PricingAppendix,
  MonthlyAcceptance, AdvancePayment, DebtReconciliation, AuditLog,
  ContractStatus, HealthCheckResult,
} from './types'

// ─── Axios instance ──────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
})

// ─── Session helpers ─────────────────────────────────────────────────────────

const ACCESS_KEY = 'machinery-log.access-token'
const REFRESH_KEY = 'machinery-log.refresh-token'
const USER_KEY = 'machinery-log.user'

export function getAccessToken() { return sessionStorage.getItem(ACCESS_KEY) }
export function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
  sessionStorage.removeItem(USER_KEY)
}
export function saveSession(auth: AuthResponse, user?: CurrentUser) {
  sessionStorage.setItem(ACCESS_KEY, auth.accessToken)
  sessionStorage.setItem(REFRESH_KEY, auth.refreshToken)
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function getStoredUser(): CurrentUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as CurrentUser) : null
}

// ─── Request interceptor (attach Bearer token) ───────────────────────────────

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor (auto-refresh on 401) ──────────────────────────────

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined
  const isAuth = original?.url?.includes('/auth/')
  if (error.response?.status !== 401 || !original || original._retry || isAuth) {
    return Promise.reject(error)
  }
  original._retry = true
  try {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY)
    if (!refreshToken) throw new Error('no refresh token')
    const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken })
    saveSession(data)
    return api(original)
  } catch {
    clearSession()
    window.location.href = '/'
    return Promise.reject(error)
  }
})

// ─── Backend returns raw objects, no envelope ────────────────────────────────

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<CurrentUser> {
  const res = await api.post<AuthResponse>('/auth/login', { username, password })
  saveSession(res.data)
  // Fetch /me to get correct user info (id, displayName) from backend
  try {
    const meRes = await api.get<UserDto>('/auth/me')
    const user: CurrentUser = {
      id: meRes.data.id,
      username: meRes.data.username,
      displayName: meRes.data.displayName,
      role: meRes.data.role,
    }
    saveSession(res.data, user)
    return user
  } catch {
    // Fallback to JWT decoding if /me fails
    try {
      const [, payload] = res.data.accessToken.split('.')
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
      const rawRole = (decoded['role'] ?? decoded['roles'] ?? 'OPERATOR') as string
      const role = (Array.isArray(rawRole) ? rawRole[0] : rawRole).replace('ROLE_', '') as CurrentUser['role']
      const user: CurrentUser = {
        id: 0,
        username: decoded['sub'] as string ?? username,
        displayName: username,
        role: role ?? 'OPERATOR',
      }
      saveSession(res.data, user)
      return user
    } catch {
      const user: CurrentUser = { id: 0, username, displayName: username, role: 'OPERATOR' }
      saveSession(res.data, user)
      return user
    }
  }
}

export async function logout(): Promise<void> {
  try { await api.post('/auth/logout') } catch { /* ignore */ }
  clearSession()
}

// ─── Envelope unwrap ─────────────────────────────────────────────────────────
// Một số controller backend còn bọc ApiError {success,data,message}.
// Frontend chuẩn là data trần. unwrap chịu cả 2 để nút gửi không gãy.
function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    const rec = raw as Record<string, unknown>
    if ('success' in rec || 'message' in rec || 'errorCode' in rec) return rec.data as T
  }
  return raw as T
}

// ─── Daily Logs ──────────────────────────────────────────────────────────────

export async function getDailyLogs(params: {
  contractId?: number
  month?: string
  equipmentId?: number
  approvalStatus?: string
  page?: number
  size?: number
}): Promise<PageResponse<DailyLog>> {
  const { data } = await api.get<PageResponse<DailyLog>>('/daily-logs', { params: { page: 0, size: 50, ...params } })
  return data
}

export async function getDailyLog(id: number): Promise<DailyLog> {
  const { data } = await api.get<DailyLog>(`/daily-logs/${id}`)
  return data
}

export async function approveDailyLog(id: number, approvalStatus: 'APPROVED' | 'REJECTED', rejectionReason?: string): Promise<DailyLog> {
  const { data } = await api.put<DailyLog>(`/daily-logs/${id}/approve`, { approvalStatus, rejectionReason })
  return data
}

export async function reopenDailyLog(id: number, reopenReason: string): Promise<DailyLog> {
  const { data } = await api.post<DailyLog>(`/daily-logs/${id}/reopen`, { reopenReason })
  return data
}

export async function batchSaveDailyLogs(logs: Partial<DailyLog>[]): Promise<DailyLog[]> {
  const { data } = await api.post<DailyLog[]>('/daily-logs/batch-save', logs)
  return data
}

export async function processOcrLog(
  file: File, contractId?: number | null, equipmentId?: number | null, workDate?: string | null,
): Promise<DailyLog> {
  const form = new FormData()
  form.append('file', file)
  if (contractId != null && contractId !== 0) form.append('contractId', String(contractId))
  if (equipmentId != null && equipmentId !== 0) form.append('equipmentId', String(equipmentId))
  if (workDate) form.append('workDate', workDate)
  const { data } = await api.post('/ocr/process-log', form)
  return unwrap<DailyLog>(data)
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(search?: string): Promise<PageResponse<Customer>> {
  const { data } = await api.get('/customers', { params: { search, size: 100 } })
  return unwrap<PageResponse<Customer>>(data)
}

export async function createCustomer(body: Omit<Customer, 'id'>): Promise<Customer> {
  const { data } = await api.post('/customers', body)
  return unwrap<Customer>(data)
}

export async function updateCustomer(id: number, body: Omit<Customer, 'id'>): Promise<Customer> {
  const { data } = await api.put(`/customers/${id}`, body)
  return unwrap<Customer>(data)
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`)
}

// ─── Equipment ───────────────────────────────────────────────────────────────

export async function getEquipment(search?: string): Promise<PageResponse<Equipment>> {
  const { data } = await api.get('/equipment', { params: { search, size: 100 } })
  return unwrap<PageResponse<Equipment>>(data)
}

export async function createEquipment(body: Omit<Equipment, 'id'>): Promise<Equipment> {
  const { data } = await api.post('/equipment', body)
  return unwrap<Equipment>(data)
}

export async function updateEquipment(id: number, body: Omit<Equipment, 'id'>): Promise<Equipment> {
  const { data } = await api.put(`/equipment/${id}`, body)
  return unwrap<Equipment>(data)
}

export async function deleteEquipment(id: number): Promise<void> {
  await api.delete(`/equipment/${id}`)
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export async function getContracts(params?: { search?: string; customerId?: number; status?: ContractStatus }): Promise<PageResponse<Contract>> {
  const { data } = await api.get('/contracts', { params: { size: 100, ...params } })
  return unwrap<PageResponse<Contract>>(data)
}

export async function getContract(id: number): Promise<Contract> {
  const { data } = await api.get(`/contracts/${id}`)
  return unwrap<Contract>(data)
}

export async function createContract(body: Omit<Contract, 'id'>): Promise<Contract> {
  const { data } = await api.post('/contracts', body)
  return unwrap<Contract>(data)
}

export async function updateContract(id: number, body: Omit<Contract, 'id'>): Promise<Contract> {
  const { data } = await api.put(`/contracts/${id}`, body)
  return unwrap<Contract>(data)
}

// ─── Pricing Appendices ──────────────────────────────────────────────────────

export async function getPricingAppendices(contractId: number): Promise<PricingAppendix[]> {
  const { data } = await api.get(`/contracts/${contractId}/pricing-appendices`)
  return unwrap<PricingAppendix[]>(data)
}

export async function createPricingAppendix(contractId: number, body: Omit<PricingAppendix, 'id' | 'contractId'>): Promise<PricingAppendix> {
  const { data } = await api.post(`/contracts/${contractId}/pricing-appendices`, { ...body, contractId })
  return unwrap<PricingAppendix>(data)
}

export async function updatePricingAppendix(id: number, body: Omit<PricingAppendix, 'id'>): Promise<PricingAppendix> {
  const { data } = await api.put(`/pricing-appendices/${id}`, body)
  return unwrap<PricingAppendix>(data)
}

export async function deletePricingAppendix(id: number): Promise<void> {
  await api.delete(`/pricing-appendices/${id}`)
}

// ─── Monthly Acceptances ─────────────────────────────────────────────────────

export async function getMonthlyAcceptances(contractId: number, month: string): Promise<MonthlyAcceptance[]> {
  const { data } = await api.get('/monthly-acceptances', { params: { contractId, month } })
  return unwrap<MonthlyAcceptance[]>(data)
}

export async function signAcceptance(id: number): Promise<MonthlyAcceptance> {
  const { data } = await api.put(`/monthly-acceptances/${id}/sign`)
  return unwrap<MonthlyAcceptance>(data)
}

// ─── Advance Payments ────────────────────────────────────────────────────────

export async function getAdvancePayments(contractId: number): Promise<AdvancePayment[]> {
  const { data } = await api.get(`/contracts/${contractId}/advance-payments`)
  return unwrap<AdvancePayment[]>(data)
}

export async function createAdvancePayment(contractId: number, body: Omit<AdvancePayment, 'id' | 'contractId'>): Promise<AdvancePayment> {
  const { data } = await api.post(`/contracts/${contractId}/advance-payments`, body)
  return unwrap<AdvancePayment>(data)
}

export async function deleteAdvancePayment(id: number): Promise<void> {
  await api.delete(`/advance-payments/${id}`)
}

// ─── Debt Reconciliation ─────────────────────────────────────────────────────

export async function getDebtReconciliations(contractId: number): Promise<DebtReconciliation[]> {
  const { data } = await api.get(`/contracts/${contractId}/debt-reconciliations`)
  return unwrap<DebtReconciliation[]>(data)
}

export async function createDebtReconciliation(contractId: number, month: string): Promise<DebtReconciliation> {
  const { data } = await api.post(`/contracts/${contractId}/debt-reconciliations`, { month })
  return unwrap<DebtReconciliation>(data)
}

export async function reconcileDebt(id: number): Promise<DebtReconciliation> {
  const { data } = await api.put(`/debt-reconciliations/${id}/status`, { status: 'RECONCILED' })
  return unwrap<DebtReconciliation>(data)
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function downloadReportSet(contractId: number, month: string): Promise<void> {
  const res = await api.get('/export/report-set', {
    params: { contractId, month },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/zip' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `report-set_contract${contractId}_${month}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function getAuditLogs(params?: {
  entityType?: string
  entityId?: number
  actorUserId?: number
  action?: string
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<PageResponse<AuditLog>> {
  const { data } = await api.get('/audit-logs', { params: { size: 50, page: 0, ...params } })
  return unwrap<PageResponse<AuditLog>>(data)
}

// ─── Health Check ───────────────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthCheckResult> {
  const { data } = await api.get<HealthCheckResult>('/health')
  return data
}
