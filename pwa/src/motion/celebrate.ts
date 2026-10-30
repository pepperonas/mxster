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

/** Where the waves of the light rain after a right card start (x across the top). */
export const SMALL_RAIN = [0.25, 0.75, 0.5]
/** One wave of that rain: few, slow, falling down (angle 270), lingering a little. */
export const RAIN = { particleCount: 22, angle: 270, spread: 150, startVelocity: 10, gravity: 0.7, ticks: 280, scalar: 0.9 }

/** Fire confetti; returns a cancel function for multi-burst celebrations. */
export function celebrate(kind: Celebration = 'small', origin = { x: 0.5, y: 0.65 }): () => void {
  if (prefersReducedMotion()) return () => {}
  const colors = tokenColours()

  if (kind === 'small') {
    // A clear burst where the card landed …
    void confetti({ particleCount: 100, spread: 80, startVelocity: 42, gravity: 1, ticks: 200, scalar: 1.1, origin, colors, disableForReducedMotion: true })
    // … and a short, light rain from the top edge: three waves that drift down
    const waves = SMALL_RAIN.map((wave, i) =>
      window.setTimeout(() => {
        void confetti({ ...RAIN, origin: { x: wave, y: -0.05 }, drift: i % 2 ? 0.4 : -0.4, colors, disableForReducedMotion: true })
      }, i * 150)
    )
    return () => waves.forEach((id) => window.clearTimeout(id))
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
