import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { clearSavedGame } from '@/game/savedGame'
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
  /**
   * The last signed-in account. After sign-out or a lost session the app does
   * not vanish at once: AuthGate fades it out (AnimatePresence) while it is
   * still rendered, and its components keep reading the account meanwhile.
   */
  lastMe: Me | null
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ kind: 'loading' })
  const lastMe = useRef<Me | null>(null)
  if (state.kind === 'signed-in') lastMe.current = state.me

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
      // The round on this device belongs to this account: the next one
      // signing in here must not be offered it
      clearSavedGame()
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

  return <AuthContext.Provider value={{ state, refresh, logout, lastMe: lastMe.current }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** The auth state, or null outside the provider (components used in tests and previews). */
export function useAuthMaybe() {
  return useContext(AuthContext)
}

/**
 * The signed-in, approved account. Only valid inside the approved app — and
 * while that app fades out after sign-out, when the last account stands in.
 */
export function useMe(): Me {
  const { state, lastMe } = useAuth()
  if (state.kind === 'signed-in') return state.me
  if (lastMe) return lastMe
  throw new Error('useMe outside the signed-in app')
}
