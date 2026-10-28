/**
 * Theme switch as M3 Expressive circular reveal via the View Transitions API.
 * The new theme expands as a clip-path circle from the toggle control.
 * Fallback (no API / reduced motion): instant switch.
 */

import { prefersReducedMotion } from '@/motion/policy'
import { M3_SPRINGS, springToCss } from '@/motion/springs'
import type { ThemeMode } from '@/contexts/SettingsContext'

interface ViewTransitionLike {
  ready: Promise<void>
  finished: Promise<void>
  skipTransition: () => void
}

type DocWithVT = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike
}

let pendingTransition: ViewTransitionLike | null = null

/** Spatial-slow spring as WAAPI timing; bezier fallback without linear(). */
function revealTiming(): { duration: number; easing: string } {
  const { durationMs, easing } = springToCss(M3_SPRINGS.spatialSlow)
  const linearOk = typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
  return linearOk
    ? { duration: durationMs, easing }
    : { duration: 650, easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)' }
}

export function toggleThemeWithReveal(
  next: ThemeMode,
  applyState: () => void,
  originElement?: HTMLElement | null
): void {
  revealChange(() => {
    document.documentElement.dataset.theme = next
    applyState()
  }, originElement)
}

/**
 * Any change of the app's look (theme, colour scheme) with the same circular
 * reveal from the control that made it. `apply` must change the DOM
 * synchronously (the View Transition snapshots right after it).
 */
export function revealChange(apply: () => void, originElement?: HTMLElement | null): void {
  const doc = document as DocWithVT

  if (prefersReducedMotion() || typeof doc.startViewTransition !== 'function') {
    apply()
    return
  }

  let x = window.innerWidth / 2
  let y = 64
  if (originElement) {
    const rect = originElement.getBoundingClientRect()
    x = rect.left + rect.width / 2
    y = rect.top + rect.height / 2
  }
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // Rapid re-toggles: skip the in-flight transition instead of racing it
  if (pendingTransition) {
    pendingTransition.skipTransition()
    pendingTransition = null
  }

  // Suppress the default route VT animation while the theme reveal runs
  document.documentElement.setAttribute('data-theme-transition', '')

  const transition = doc.startViewTransition(apply)
  pendingTransition = transition

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          ...revealTiming(),
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
    .catch(() => {})

  const cleanup = () => {
    if (pendingTransition === transition) pendingTransition = null
    document.documentElement.removeAttribute('data-theme-transition')
  }
  transition.finished.then(cleanup, cleanup)
  // Safety net: snapshot capture can be slow on weak GPUs — never leave the
  // route-VT suppression attribute stuck if finished stalls
  setTimeout(cleanup, 3000)
}
