import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { haptic, canVibrate, setHapticsEnabled, resetHaptics, HAPTIC_PATTERNS, TICK_GAP_MS } from '../haptics'
import { hapticFor } from '@/components/game/FeedbackLayer'
import { normalizeSettings } from '@/contexts/SettingsContext'
import type { Reveal } from '@/game/useTurnFlow'

const vibrate = vi.fn(() => true)
let coarse = true

beforeEach(() => {
  resetHaptics()
  vibrate.mockClear()
  coarse = true
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true })
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(pointer: coarse)' ? coarse : false, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  // @ts-expect-error test cleanup
  delete navigator.vibrate
})

describe('haptic', () => {
  it('plays the fixed, short pattern of each kind', () => {
    for (const kind of Object.keys(HAPTIC_PATTERNS) as (keyof typeof HAPTIC_PATTERNS)[]) {
      vibrate.mockClear()
      haptic(kind, 10_000 * Math.random() + 1000)
      if (kind !== 'tick') expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS[kind])
    }
    // subtle: nothing longer than a third of a second in total
    for (const p of Object.values(HAPTIC_PATTERNS)) {
      const total = ([] as number[]).concat(p).reduce((a, b) => a + b, 0)
      expect(total).toBeLessThan(200)
    }
  })

  it('stays silent with a fine pointer, without the API, or when switched off', () => {
    coarse = false
    expect(canVibrate()).toBe(false)
    expect(haptic('success')).toBe(false)
    coarse = true
    setHapticsEnabled(false)
    expect(haptic('success')).toBe(false)
    setHapticsEnabled(true)
    // @ts-expect-error API missing (iPhone)
    delete navigator.vibrate
    expect(canVibrate()).toBe(false)
    expect(haptic('success')).toBe(false)
  })

  it('throttles drag ticks', () => {
    expect(haptic('tick', 1000)).toBe(true)
    expect(haptic('tick', 1000 + TICK_GAP_MS - 1)).toBe(false)
    expect(haptic('tick', 1000 + TICK_GAP_MS + 1)).toBe(true)
    expect(vibrate).toHaveBeenCalledTimes(2)
  })
})

describe('what a verdict feels like', () => {
  const song = { id: 's', title: 'T', artist: 'A', year: 1990 } as never
  const placement = (o: Partial<Extract<Reveal, { kind: 'placement' }>>) =>
    ({ kind: 'placement', song, isCorrect: true, isFirstCard: false, challenge: null, ...o }) as Reveal
  const guess = (total: number) => ({ kind: 'guess', song, breakdown: { total } }) as unknown as Reveal

  it('right, wrong, objection won, first card', () => {
    expect(hapticFor(placement({}))).toBe('success')
    expect(hapticFor(placement({ isCorrect: false }))).toBe('miss')
    expect(hapticFor(placement({ isCorrect: false, challenge: { won: true } as never }))).toBe('success')
    expect(hapticFor(placement({ isFirstCard: true }))).toBeNull()
  })

  it('hardcore points', () => {
    expect(hapticFor(guess(15))).toBe('win')
    expect(hapticFor(guess(10))).toBe('success')
    expect(hapticFor(guess(5))).toBe('success')
    expect(hapticFor(guess(2))).toBeNull()
    expect(hapticFor(guess(0))).toBe('miss')
  })
})

describe('setting', () => {
  it('is on unless switched off', () => {
    expect(normalizeSettings({}).haptics).toBe(true)
    expect(normalizeSettings({ haptics: false }).haptics).toBe(false)
  })
})
