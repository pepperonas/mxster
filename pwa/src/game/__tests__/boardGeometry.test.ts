import { describe, it, expect } from 'vitest'
import { computeInsertionIndex, isNearBoard, autoScrollSpeed, HYSTERESIS_PX, edgeScrollStep, EDGE_DWELL_MS, EDGE_RAMP_MS, EDGE_MAX_PX_S } from '../boardGeometry'
import { stickyTop, EDGE_ZONE } from '../useCardDrag'

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

describe('edge scrolling only when really at the edge, and gently', () => {
  // px scrolled over `ms` at a frame rate, pointer held at `raw`
  const scrolled = (raw: number, ms: number, hz: number, from = 0) => {
    let px = 0
    const dt = 1000 / hz
    for (let t = from + dt; t <= from + ms; t += dt) px += edgeScrollStep(raw, t, dt)
    return px
  }

  it('the zone is only the last strip before an edge', () => {
    expect(EDGE_ZONE).toBeLessThanOrEqual(48)
    expect(autoScrollSpeed(800 - 60, 0, 800, EDGE_ZONE)).toBe(0) // 60 px from the dock: no scroll
  })

  it('nothing before the dwell, then it eases in instead of starting at full speed', () => {
    expect(edgeScrollStep(18, EDGE_DWELL_MS, 16)).toBe(0)
    const justAfter = edgeScrollStep(18, EDGE_DWELL_MS + 50, 16)
    const full = edgeScrollStep(18, EDGE_DWELL_MS + EDGE_RAMP_MS + 100, 16)
    expect(justAfter).toBeGreaterThan(0)
    expect(justAfter).toBeLessThan(full / 10)
  })

  it('a 120 Hz phone scrolls as fast as a 60 Hz one, and never faster than the cap', () => {
    const at60 = scrolled(18, 3000, 60)
    const at120 = scrolled(18, 3000, 120)
    expect(Math.abs(at120 - at60) / at60).toBeLessThan(0.03)
    const settled = scrolled(18, 1000, 120, EDGE_DWELL_MS + EDGE_RAMP_MS)
    expect(settled).toBeLessThanOrEqual(EDGE_MAX_PX_S + 1)
    expect(EDGE_MAX_PX_S).toBeLessThanOrEqual(800)
  })

  it('just touching the zone is slow, right at the edge is faster; up scrolls up', () => {
    const held = EDGE_DWELL_MS + EDGE_RAMP_MS + 1
    expect(edgeScrollStep(2, held, 16)).toBeLessThan(edgeScrollStep(18, held, 16) / 5)
    expect(edgeScrollStep(-18, held, 16)).toBeLessThan(0)
  })

  it('a frame gap (tab in the background) is not one long jump', () => {
    expect(edgeScrollStep(18, 5000, 2000)).toBeLessThanOrEqual(EDGE_MAX_PX_S * 0.05 + 0.01)
  })
})

describe('the top edge for scrolling', () => {
  const bar = (position: string, top: number, bottom: number) => {
    document.body.innerHTML = `<div data-player-bar style="position:${position}"></div>`
    const el = document.querySelector<HTMLElement>('[data-player-bar]')!
    el.getBoundingClientRect = () => ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top, x: 0, y: top, toJSON() {} })
  }

  it('a player bar in the normal flow is not an edge (the page ran up when it sat mid-screen)', () => {
    bar('static', 300, 420)
    expect(stickyTop()).toBe(64)
    bar('static', 64, 140) // right under the header now, but it scrolls away with the page
    expect(stickyTop()).toBe(64)
  })

  it('a sticky bar counts only while it is stuck under the header', () => {
    bar('sticky', 64, 140)
    expect(stickyTop()).toBe(140)
    bar('sticky', 400, 476) // still in the flow, not stuck yet
    expect(stickyTop()).toBe(64)
  })
})
