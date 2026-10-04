/**
 * Confetti in the app's own colours, respecting the reduced-motion policy.
 * Colours are read from the design tokens at call time, so they follow the
 * theme (no hard-coded palettes).
 */
import confetti from 'canvas-confetti'
import { prefersReducedMotion } from './policy'

const TOKENS = ['--md-ref-primary-70', '--md-ref-tertiary-70', '--md-ref-primary-90', '--md-ref-tertiary-80', '--md-ref-success-80']

function tokenColours(): string[] {
  const style = getComputedStyle(document.documentElement)
  return TOKENS.map((name) => style.getPropertyValue(name).trim())
    .filter(Boolean)
    .map((triplet) => `rgb(${triplet.split(/\s+/).join(',')})`)
}

export type Celebration = 'small' | 'big'

/** Fire confetti; returns a cancel function for multi-burst celebrations. */
export function celebrate(kind: Celebration = 'small', origin = { x: 0.5, y: 0.65 }): () => void {
  if (prefersReducedMotion()) return () => {}
  const colors = tokenColours()

  if (kind === 'small') {
    void confetti({ particleCount: 70, spread: 70, startVelocity: 38, gravity: 1.1, ticks: 160, origin, colors, disableForReducedMotion: true })
    return () => {}
  }

  void confetti({ particleCount: 120, spread: 90, startVelocity: 45, origin, colors, disableForReducedMotion: true })
  let raf = 0
  const end = performance.now() + 1600
  const frame = () => {
    if (performance.now() > end) return
    void confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors, disableForReducedMotion: true })
    void confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors, disableForReducedMotion: true })
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
