// ---- Auth ----
export type UserRole = 'OPERATOR' | 'ACCOUNTANT_ADMIN'

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
}

export type CurrentUser = {
  id: number
  username: string
  displayName: string
  role: UserRole
}

// UserDto returned by /auth/me
export type UserDto = {
  id: number
  username: string
  displayName: string
  role: UserRole
  isActive: boolean
}

// ---- Health Check ----
export type HealthStatus = 'UP' | 'DOWN'

export type HealthCheckResult = {
  status: HealthStatus
  timestamp: string
  database: {
    connected: boolean
    url: string
  } | null
  minio: null
  details: Record<string, unknown>
}

// ---- Shared ----
export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ---- Daily Logs ----
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type DailyLog = {
  id: number
  contractId?: number | null
  equipmentId?: number | null
  workDate?: string | null
  morningStartTime?: string
  morningEndTime?: string
  afternoonStartTime?: string
  afternoonEndTime?: string
  eveningStartTime?: string
  eveningEndTime?: string
  operatingHours: number
  standbyHours: number
  workDescription?: string
  operatorName?: string
  operatorId?: number
  reviewerId?: number
  reviewerName?: string
  originalImageUrl?: string
  approvalStatus: ApprovalStatus
  rejectionReason?: string
}

// ---- Customers ----
export type Customer = {
  id: number
  companyName: string
  taxCode?: string
  representativeName?: string
  position?: string
  phoneNumber?: string
  address?: string
}

// ---- Equipment ----
export type Equipment = {
  id: number
  equipmentName: string
  serialRegistrationNumber: string
  equipmentType?: string
}

// ---- Contracts ----
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

export type Contract = {
  id: number
  customerId: number
  contractNumber: string
  signingDate?: string
  projectName?: string
  constructionSite?: string
  status: ContractStatus
}

// ---- Pricing Appendices ----
export type PricingType = 'HOURLY' | 'DAILY' | 'MONTHLY'

export type PricingAppendix = {
  id: number
  contractId: number
  equipmentId: number
  pricingType: PricingType
  unitPrice: string
  unitOfMeasure?: string
}

// ---- Monthly Acceptances ----
export type AcceptanceStatus = 'PENDING_SIGNATURE' | 'SIGNED' | 'NEEDS_RECALCULATION'

export type MonthlyAcceptance = {
  id: number
  contractId: number
  equipmentId: number
  billingMonth: string
  totalOperatingHours: string
  appliedUnitPrice: string
  subtotalBeforeVat: string
  vatPercentage: number
  vatAmount: string
  totalAmount: string
  status: AcceptanceStatus
  exportVersion: number
  lastExportedAt?: string
  exportInvalidatedAt?: string
}

// ---- Advance Payments ----
export type AdvancePayment = {
  id: number
  contractId: number
  documentDate: string
  documentNumber?: string
  description?: string
  amount: string
}

// ---- Debt Reconciliation ----
export type DebtReconciliationStatus = 'PENDING_RECONCILIATION' | 'RECONCILED'

export type DebtReconciliation = {
  id: number
  contractId: number
  reconciliationDate: string
  previousBalance: string
  currentPeriodAcceptance: string
  totalPaid: string
  remainingBalance: string
  status: DebtReconciliationStatus
}

// ---- Audit Logs ----
export type AuditLog = {
  id: number
  entityType: string
  entityId: number
  actorUserId: number
  actorUsername: string
  action: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  reason?: string
  createdAt: string
}
