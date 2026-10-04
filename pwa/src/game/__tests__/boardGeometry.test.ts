import { describe, it, expect } from 'vitest'
import { computeInsertionIndex, isNearBoard, autoScrollSpeed, HYSTERESIS_PX } from '../boardGeometry'

// Gaps every 100px: 0, 100, 200, 300
const centres = [0, 100, 200, 300]

describe('computeInsertionIndex', () => {
  it('picks the nearest gap at rest', () => {
    expect(computeInsertionIndex({ centres, pointer: 10 })).toBe(0)
    expect(computeInsertionIndex({ centres, pointer: 140 })).toBe(1)
    expect(computeInsertionIndex({ centres, pointer: 160 })).toBe(2)
    expect(computeInsertionIndex({ centres, pointer: 999 })).toBe(3)
    expect(computeInsertionIndex({ centres, pointer: -999 })).toBe(0)
  })

  it('projects along the velocity', () => {
    // 140 alone → gap 1; flicking down at 800 px/s projects ~96 px further → gap 2
    expect(computeInsertionIndex({ centres, pointer: 140, velocity: 800 })).toBe(2)
    expect(computeInsertionIndex({ centres, pointer: 160, velocity: -800 })).toBe(1)
  })

  it('never projects further than one row', () => {
    // A violent flick from gap 0 must not skip to gap 3
    expect(computeInsertionIndex({ centres, pointer: 0, velocity: 100000 })).toBe(1)
  })

  it('holds the current gap until another is clearly closer (no flicker)', () => {
    // 152 is 2 px closer to gap 2 than to gap 1 — not enough to switch
    expect(computeInsertionIndex({ centres, pointer: 152, current: 1 })).toBe(1)
    // well past the hysteresis band
    expect(computeInsertionIndex({ centres, pointer: 150 + HYSTERESIS_PX, current: 1 })).toBe(2)
  })

  it('handles empty and single-gap boards', () => {
    expect(computeInsertionIndex({ centres: [], pointer: 0 })).toBeNull()
    expect(computeInsertionIndex({ centres: [500], pointer: 0, velocity: 5000 })).toBe(0)
  })
})

describe('isNearBoard', () => {
  const rect = { left: 100, right: 300, top: 100, bottom: 500 }
  it('accepts the board plus a margin', () => {
    expect(isNearBoard(rect, 200, 300)).toBe(true)
    expect(isNearBoard(rect, 60, 300)).toBe(true)
    expect(isNearBoard(rect, 40, 300)).toBe(false)
    expect(isNearBoard(rect, 200, 560)).toBe(false)
  })
})

describe('autoScrollSpeed', () => {
  it('is zero in the middle and ramps quadratically at the edges', () => {
    expect(autoScrollSpeed(400, 0, 800)).toBe(0)
    expect(autoScrollSpeed(0, 0, 800)).toBe(-18)
    expect(autoScrollSpeed(36, 0, 800)).toBe(-5) // half way into the zone → quarter speed
    expect(autoScrollSpeed(800, 0, 800)).toBe(18)
    expect(autoScrollSpeed(-50, 0, 800)).toBe(-18) // capped
  })
})
