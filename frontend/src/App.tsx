import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/auth'
import { ToastProvider } from '@/components/ui/toast'

import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { UploadPage } from '@/pages/upload'
import { ReviewPage } from '@/pages/review'
import { CustomersPage } from '@/pages/customers'
import { EquipmentPage } from '@/pages/equipment'
import { ContractsPage, ContractDetailPage } from '@/pages/contracts'
import { DebtPage } from '@/pages/debt'
import { ExportPage } from '@/pages/export'
import { AuditPage } from '@/pages/audit'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'ACCOUNTANT_ADMIN' }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={<PrivateRoute><DashboardPage /></PrivateRoute>}
      />
      <Route
        path="/upload"
        element={<PrivateRoute><UploadPage /></PrivateRoute>}
      />
      <Route
        path="/review"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><ReviewPage /></PrivateRoute>}
      />
      <Route
        path="/customers"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><CustomersPage /></PrivateRoute>}
      />
      <Route
        path="/equipment"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><EquipmentPage /></PrivateRoute>}
      />
      <Route
        path="/contracts"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><ContractsPage /></PrivateRoute>}
      />
      <Route
        path="/contracts/:id"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><ContractDetailPage /></PrivateRoute>}
      />
      <Route
        path="/debt"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><DebtPage /></PrivateRoute>}
      />
      <Route
        path="/export"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><ExportPage /></PrivateRoute>}
      />
      <Route
        path="/audit"
        element={<PrivateRoute requiredRole="ACCOUNTANT_ADMIN"><AuditPage /></PrivateRoute>}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
