/**
 * Decides what the visitor sees: sign-in, the waiting room, a closed door,
 * or the app. Nothing of the app (or its audio) loads before approval.
 */
import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useAuth } from './AuthContext'
import { LoginScreen } from '@/screens/LoginScreen'
import { WaitingScreen } from '@/screens/WaitingScreen'
import { spring } from '@/motion/springs'

const POLL_MS = 30_000

export function AuthGate({ children }: { children: ReactNode }) {
  const { state, refresh } = useAuth()
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

  // The first check is not part of the transition: with mode="wait" the empty
  // loading frame had to finish an exit animation before the app could mount,
  // and that exit sometimes never completed — the page stayed blank.
  if (state.kind === 'loading') return <div className="min-h-dvh" />

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
