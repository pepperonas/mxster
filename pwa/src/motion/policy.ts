/**
 * One reduced-motion policy for the whole app.
 *
 * Every consumer — Motion (via <MotionConfig reducedMotion="user">), the route
 * View Transitions, the theme reveal, the ripple, confetti and the particle
 * background — reads the same live media query. CSS follows the same query in
 * design-tokens.css (spatial tokens → instant, effects → short fade).
 */
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function mediaQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null
}

/** Live check — safe to call at any time (re-reads the media query). */
export function prefersReducedMotion(): boolean {
  return mediaQuery()?.matches ?? false
}

export function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = mediaQuery()
  if (!mq) return () => {}
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }
  // Safari < 14
  mq.addListener(onChange)
  return () => mq.removeListener(onChange)
}

/** React hook that re-renders when the user toggles the OS setting. */
export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false)
}
