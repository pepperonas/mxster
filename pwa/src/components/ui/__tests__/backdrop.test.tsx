import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'
import { render, renderHook } from '@testing-library/react'
import { Backdrop } from '../Backdrop'
import { useBackdropPlaying } from '@/hooks/useBackdropPlaying'

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
    expect(root.querySelectorAll('.mx-backdrop-sheen').length).toBe(2)
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
    expect(frames.length).toBe(2)
    for (const f of frames) {
      for (const [, prop] of f.matchAll(/([a-z-]+):/g)) expect(['transform', 'opacity']).toContain(prop)
    }
  })

  it('stands still with reduced motion', () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(backdropCss)![1]
    expect(reduced).toMatch(/\.mx-backdrop-sheen,[\s\S]*animation: none/)
  })
})
