/**
 * M3 ripple — progressive enhancement via a single delegated listener.
 * Targets `.btn`, `.m3-state-layer` and anything opting in with [data-ripple].
 * Components look correct without JS; the ripple only adds tactility.
 */

import { prefersReducedMotion } from './animationHelpers'

const RIPPLE_SELECTOR = '.btn, .m3-state-layer, [data-ripple]'

let initialized = false

export function initRipple(): void {
  if (initialized) return
  initialized = true

  document.addEventListener('pointerdown', (event) => {
    if (prefersReducedMotion()) return

    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(RIPPLE_SELECTOR)
    if (!target) return

    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'm3-ripple'
    ripple.style.width = `${size}px`
    ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`

    // Hosts without position context still render the ripple correctly
    const position = getComputedStyle(target).position
    if (position === 'static') target.style.position = 'relative'
    if (getComputedStyle(target).overflow !== 'hidden') target.style.overflow = 'hidden'

    target.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
  })
}
