import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import { Backdrop, wavePath } from '../Backdrop'
import { useBackdropPlaying } from '@/hooks/useBackdropPlaying'
import { AT_REST, REST, settled, stepSwell, swellScale, type SwellState } from '../backdropSwell'

const css = readFileSync(join(__dirname, '../../../styles/tailwind.css'), 'utf8')
const backdropCss = css.slice(css.indexOf('/* ── Backdrop'))
const playing = () => document.documentElement.dataset.playing ?? null

afterEach(() => {
  delete document.documentElement.dataset.playing
})

describe('Backdrop', () => {
  it('is decoration only: hidden from assistive tech, nothing to focus', () => {
    const { container } = render(<Backdrop />)
    const root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.querySelectorAll('a, button, input, [tabindex]').length).toBe(0)
    expect(root.querySelectorAll('.mx-backdrop-wave').length).toBeGreaterThanOrEqual(3)
  })

  it('a wave repeats exactly after one period, so the drift loops without a seam', () => {
    const pts = wavePath({ parts: [[2, 20, 0.4], [5, 7, 1.3]], y: 100 })
      .slice(1)
      .split(' L')
      .map((p) => p.split(' ').map(Number))
    const at = (x: number) => pts.find(([px]) => px === x)![1]
    expect(at(0)).toBeCloseTo(at(1200), 1)
    expect(at(300)).toBeCloseTo(at(1500), 1)
  })
})

describe('useBackdropPlaying', () => {
  it('sets the signal while playing and clears it on pause and unmount', () => {
    const { rerender, unmount } = renderHook(({ on }) => useBackdropPlaying(on), { initialProps: { on: false } })
    expect(playing()).toBeNull()
    rerender({ on: true })
    expect(playing()).toBe('1')
    rerender({ on: false })
    expect(playing()).toBeNull()
    rerender({ on: true })
    unmount()
    expect(playing()).toBeNull()
  })

  it('two players: the signal stays until the last one stops', () => {
    const a = renderHook(() => useBackdropPlaying(true))
    const b = renderHook(() => useBackdropPlaying(true))
    a.unmount()
    expect(playing()).toBe('1')
    b.unmount()
    expect(playing()).toBeNull()
  })
})

describe('backdrop CSS', () => {
  it('the body paints no background of its own, or it would cover the layer', () => {
    const body = /\n  body \{([\s\S]*?)\n  \}/.exec(css)![1].replace(/\/\*[\s\S]*?\*\//g, '')
    expect(body).not.toMatch(/bg-|background/)
  })

  it('sits behind everything and never takes a click', () => {
    const rule = /\.mx-backdrop \{([\s\S]*?)\}/.exec(backdropCss)![1]
    expect(rule).toMatch(/position: fixed/)
    expect(rule).toMatch(/z-index: -1/)
    expect(rule).toMatch(/pointer-events: none/)
  })

  it('animates only transform and opacity', () => {
    const frames = [...backdropCss.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n\}/g)].map((m) => m[1])
    expect(frames.length).toBe(1)
    for (const f of frames) {
      for (const [, prop] of f.matchAll(/([a-z-]+):/g)) expect(['transform', 'opacity']).toContain(prop)
    }
  })

  it('stands still with reduced motion', () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(backdropCss)![1]
    expect(reduced).toMatch(/\.mx-backdrop-wave \{ animation: none/)
    // the swell is driven from script and stays put too
    expect(readFileSync(join(__dirname, '../Backdrop.tsx'), 'utf8')).toMatch(/if \(prefersReducedMotion\(\) \|\| frame\) return/)
  })
})

describe('the swell glides with play and pause', () => {
  const FRAME = 1 / 60
  const run = (s: SwellState, target: number, seconds: number, each?: (s: SwellState, prev: SwellState) => void) => {
    for (let t = 0; t < seconds; t += FRAME) {
      const next = stepSwell(s, target, FRAME)
      each?.(next, s)
      s = next
    }
    return s
  }

  it('starts without a jolt and rises smoothly, without overshooting', () => {
    const first = stepSwell(AT_REST, 1, FRAME)
    expect(first.energy).toBeLessThan(0.005)
    let maxStep = 0
    const end = run(AT_REST, 1, 2.5, (n, p) => {
      expect(n.energy).toBeGreaterThanOrEqual(p.energy - 1e-9)
      expect(n.energy).toBeLessThanOrEqual(1)
      maxStep = Math.max(maxStep, Math.abs(swellScale(n) - swellScale(p)))
    })
    expect(end.energy).toBeGreaterThan(0.97)
    expect(maxStep).toBeLessThan(0.02)
  })

  it('on pause it settles down slowly from wherever the pulse was — no step', () => {
    const playing = run(AT_REST, 1, 3.3)
    let maxStep = 0
    const after1s = run(playing, 0, 1, (n, p) => (maxStep = Math.max(maxStep, Math.abs(swellScale(n) - swellScale(p)))))
    expect(maxStep).toBeLessThan(0.02)
    expect(after1s.energy).toBeGreaterThan(0.2) // still on its way down after a second
    const later = run(after1s, 0, 5)
    expect(settled(later, 0)).toBe(true)
    expect(swellScale(later)).toBeCloseTo(REST, 2)
  })

  it('falls more slowly than it rises', () => {
    const up = run(AT_REST, 1, 0.6).energy
    const down = 1 - run({ energy: 1, velocity: 0, phase: 0 }, 0, 0.6).energy
    expect(down).toBeLessThan(up)
  })

  it('the pulse fades with the swell: at rest the phase changes nothing', () => {
    expect(swellScale({ energy: 0, velocity: 0, phase: 0.5 })).toBe(REST)
    expect(swellScale({ energy: 1, velocity: 0, phase: 0.5 })).toBeGreaterThan(swellScale({ energy: 1, velocity: 0, phase: 0 }))
  })

  it('a long gap (background tab) is taken as one small step', () => {
    expect(stepSwell(AT_REST, 1, 30).energy).toBeLessThan(0.15)
  })

  it('the background follows: swells while a song plays, comes back to rest and stops its loop', () => {
    let queue: FrameRequestCallback[] = []
    let now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (queue.push(cb), queue.length))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const frames = (n: number) => {
      for (let i = 0; i < n && queue.length; i++) {
        const q = queue
        queue = []
        now += 1000 / 60
        q.forEach((cb) => cb(now))
      }
    }
    const { container } = render(<Backdrop />)
    const swell = container.querySelector('.mx-backdrop-swell') as HTMLElement
    const scale = () => Number(/scaleY\(([\d.]+)\)/.exec(swell.style.transform)?.[1] ?? REST)
    const player = renderHook(({ on }) => useBackdropPlaying(on), { initialProps: { on: false } })
    expect(queue.length).toBe(0) // silence: no loop at all
    act(() => player.rerender({ on: true }))
    frames(2)
    expect(scale()).toBeLessThan(REST + 0.01) // no jump on play
    frames(180)
    expect(scale()).toBeGreaterThan(1.05)
    act(() => player.rerender({ on: false }))
    const before = scale()
    frames(1)
    expect(Math.abs(scale() - before)).toBeLessThan(0.02) // no jump on pause
    frames(600)
    expect(scale()).toBeCloseTo(REST, 2)
    expect(queue.length).toBe(0) // settled: the loop stopped
    player.unmount()
    vi.unstubAllGlobals()
  })
})
