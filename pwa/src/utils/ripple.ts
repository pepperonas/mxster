/**
 * M3 ripple — progressive enhancement via a single delegated listener.
 * Targets `.btn`, `.m3-state-layer` and anything opting in with [data-ripple].
 *
 * Two phases (see motion.css): the wave spreads from the pointer while it is
 * held and fades only after release, so a long press stays visibly pressed.
 * A minimum spread time keeps quick taps from vanishing before they're seen.
 * Hosts get position/overflow from the shared state-layer rule in CSS.
 */

import { prefersReducedMotion } from '@/motion/policy'

const RIPPLE_SELECTOR = '.btn, .m3-state-layer, [data-ripple]'
const MIN_SPREAD_MS = 120
const REMOVE_AFTER_MS = 900

let initialized = false

export function initRipple(): void {
  if (initialized) return
  initialized = true
  document.addEventListener('pointerdown', onPointerDown, { passive: true })
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || prefersReducedMotion()) return

  const host = (event.target as HTMLElement | null)?.closest<HTMLElement>(RIPPLE_SELECTOR)
  if (!host || (host as HTMLButtonElement).disabled) return

  const rect = host.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  // Diameter that reaches the farthest corner from the press point
  const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))

  const ripple = document.createElement('span')
  ripple.className = 'm3-ripple'
  ripple.setAttribute('aria-hidden', 'true')
  ripple.style.width = ripple.style.height = `${radius * 2}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  host.appendChild(ripple)

  const startedAt = performance.now()
  // Next frame: start spreading (needs a committed initial transform)
  requestAnimationFrame(() => ripple.setAttribute('data-state', 'spread'))

  const release = () => {
    window.removeEventListener('pointerup', release)
    window.removeEventListener('pointercancel', release)
    const wait = Math.max(0, MIN_SPREAD_MS - (performance.now() - startedAt))
    window.setTimeout(() => ripple.setAttribute('data-state', 'released'), wait)
    window.setTimeout(() => ripple.remove(), wait + REMOVE_AFTER_MS)
  }
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
}
