/**
 * Decides what the visitor sees: sign-in, the waiting room, a closed door,
 * or the app. Nothing of the app (or its audio) loads before approval.
 */
import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SyncModeProvider } from '@/sync/syncMode'
import { useSongOverrides } from '@/data/useSongOverrides'
import { AnimatePresence, m } from 'motion/react'
import { useAuth } from './AuthContext'
import { LoginScreen } from '@/screens/LoginScreen'
import { WaitingScreen } from '@/screens/WaitingScreen'
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen'
import { spring } from '@/motion/springs'

const POLL_MS = 30_000

/** A room link works without an account: guests join by name. */
export const isRoomPath = (path: string) => /^\/(r|room|raum)\/[^/]+\/?$/.test(path)
/** Imprint, privacy policy and terms: readable by everyone, signed in or not. */
export const isLegalPath = (path: string) => /^\/(imprint|privacy|terms)\/?$/.test(path)
/** The link from the reset mail: works whoever is signed in on this device. */
export const isResetPath = (path: string) => /^\/reset-password\/?$/.test(path)

export function AuthGate({ children }: { children: ReactNode }) {
  const { state, refresh } = useAuth()
  const { pathname } = useLocation()
  const status = state.kind === 'signed-in' ? state.me.status : null

  // While waiting for approval: check again every 30 s and when the tab returns.
  useEffect(() => {
    if (status !== 'pending') return
    const id = window.setInterval(() => void refresh(), POLL_MS)
    const onFocus = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [status, refresh])

  useSongOverrides(state.kind === 'signed-in' && state.me.status === 'approved')

  // The first check is not part of the transition: with mode="wait" the empty
  // loading frame had to finish an exit animation before the app could mount,
  // and that exit sometimes never completed — the page stayed blank.
  if (state.kind === 'loading') return <div className="min-h-dvh" />

  if (isResetPath(pathname)) return <ResetPasswordScreen />

  // Room links: anyone without an approved account plays as a guest — the app
  // runs without account data (nothing loaded, nothing saved)
  const approved = state.kind === 'signed-in' && state.me.status === 'approved'
  if (!approved && isLegalPath(pathname)) return <SyncModeProvider mode="guest">{children}</SyncModeProvider>
  if (!approved && isRoomPath(pathname)) return <SyncModeProvider mode="guest">{children}</SyncModeProvider>

  let key: string
  let view: ReactNode
  if (state.kind === 'offline') {
    key = 'offline'
    view = <WaitingScreen variant="offline" />
  } else if (state.kind === 'anonymous') {
    key = 'login'
    view = <LoginScreen />
  } else if (state.me.status === 'approved') {
    key = 'app'
    view = children
  } else {
    key = state.me.status
    view = <WaitingScreen variant={state.me.status} />
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={key}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.01, transition: spring.effectsDefault }}
        transition={spring.spatialSlow}
      >
        {view}
      </m.div>
    </AnimatePresence>
  )
}
