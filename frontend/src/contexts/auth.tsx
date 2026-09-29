import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CurrentUser } from '@/lib/types'
import { getStoredUser, clearSession } from '@/lib/api'

type AuthContextValue = {
  user: CurrentUser | null
  setUser: (u: CurrentUser | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(() => getStoredUser())

  function setUser(u: CurrentUser | null) {
    setUserState(u)
  }

  function signOut() {
    clearSession()
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
