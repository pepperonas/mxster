/**
 * Theme switch as M3 Expressive circular reveal via the View Transitions API.
 * The new theme expands as a clip-path circle from the toggle control.
 * Fallback (no API / reduced motion): instant switch.
 */

import { prefersReducedMotion } from './animationHelpers'
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

export function toggleThemeWithReveal(
  next: ThemeMode,
  applyState: () => void,
  originElement?: HTMLElement | null
): void {
  const doc = document as DocWithVT

  // The DOM mutation must happen inside the VT callback; React's state update
  // (persistence + meta sync) may flush later without breaking the visual.
  const apply = () => {
    document.documentElement.dataset.theme = next
    applyState()
  }

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
          duration: 650,
          easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)',
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
