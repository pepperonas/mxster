import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setCsrfToken, SESSION_LOST, type Me } from '@/api/client'

type AuthState =
  | { kind: 'loading' }
  | { kind: 'offline' }
  | { kind: 'anonymous' }
  | { kind: 'signed-in'; me: Me }

interface AuthValue {
  state: AuthState
  /** Re-reads /api/me (e.g. while waiting for approval). */
  refresh: () => Promise<Me | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ kind: 'loading' })

  const refresh = useCallback(async () => {
    try {
      const { me } = await api<{ me: Me | null }>('/api/session')
      setCsrfToken(me?.csrf ?? '')
      setState(me ? { kind: 'signed-in', me } : { kind: 'anonymous' })
      return me
    } catch {
      setState((prev) => (prev.kind === 'signed-in' ? prev : { kind: 'offline' }))
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setCsrfToken('')
      setState({ kind: 'anonymous' })
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onLost = () => void refresh()
    window.addEventListener(SESSION_LOST, onLost)
    return () => window.removeEventListener(SESSION_LOST, onLost)
  }, [refresh])

  return <AuthContext.Provider value={{ state, refresh, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** The signed-in, approved account. Only valid inside the approved app. */
export function useMe(): Me {
  const { state } = useAuth()
  if (state.kind !== 'signed-in') throw new Error('useMe outside the signed-in app')
  return state.me
}
