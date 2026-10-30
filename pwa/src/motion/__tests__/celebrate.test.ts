/**
 * A right card earns a clear burst and a short, light rain from the top —
 * clearly more than one small puff, but not a storm; nothing under reduced motion.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const fired: Array<Record<string, unknown>> = []
vi.mock('canvas-confetti', () => ({ default: (o: Record<string, unknown>) => (fired.push(o), Promise.resolve()) }))
let reduced = false
vi.mock('../policy', () => ({ prefersReducedMotion: () => reduced }))
const { celebrate, RAIN, SMALL_RAIN } = await import('../celebrate')

beforeEach(() => {
  fired.length = 0
  reduced = false
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('confetti after a right card', () => {
  it('a burst, then three waves of rain from the top edge', () => {
    celebrate('small')
    expect(fired).toHaveLength(1)
    expect(fired[0].particleCount).toBe(100)
    vi.advanceTimersByTime(400)
    expect(fired).toHaveLength(1 + SMALL_RAIN.length)
    for (const wave of fired.slice(1)) {
      expect((wave.origin as { y: number }).y).toBeLessThan(0) // from above the screen
      expect(wave.angle).toBe(270) // falling down
    }
  })

  it('stays gentle: about two hundred pieces in all, the rain slow and light', () => {
    celebrate('small')
    vi.advanceTimersByTime(400)
    const total = fired.reduce((n, o) => n + Number(o.particleCount), 0)
    expect(total).toBeGreaterThan(120)
    expect(total).toBeLessThan(220)
    expect(RAIN.startVelocity).toBeLessThan(20)
    expect(RAIN.gravity).toBeLessThan(1)
  })

  it('can be cancelled before the rain starts', () => {
    const cancel = celebrate('small')
    cancel()
    vi.advanceTimersByTime(400)
    expect(fired).toHaveLength(1)
  })

  it('nothing at all with reduced motion', () => {
    reduced = true
    celebrate('small')
    vi.advanceTimersByTime(400)
    expect(fired).toHaveLength(0)
  })
})
