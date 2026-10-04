import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { prefersReducedMotion } from '../policy'
import {
  installViewTransitionGate,
  isViewTransitionActive,
  onViewTransitionChange,
  __resetViewTransitionGate
} from '../viewTransitionGate'
import { setReducedMotion } from '@/test/motion'

describe('reduced-motion policy', () => {
  beforeEach(() => setReducedMotion(false))

  it('reads the live media query every time', () => {
    expect(prefersReducedMotion()).toBe(false)
    setReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
  })
})

describe('view transition gate', () => {
  beforeEach(() => __resetViewTransitionGate())

  function fakeDoc() {
    let finish!: () => void
    const finished = new Promise<void>((r) => (finish = r))
    const doc = { startViewTransition: vi.fn(() => ({ finished })) } as unknown as Document
    return { doc, finish: () => finish() }
  }

  it('is active between start and finish and notifies listeners', async () => {
    const { doc, finish } = fakeDoc()
    const seen: boolean[] = []
    onViewTransitionChange(() => seen.push(isViewTransitionActive()))
    installViewTransitionGate(doc)

    expect(isViewTransitionActive()).toBe(false)
    ;(doc as unknown as { startViewTransition: () => unknown }).startViewTransition()
    expect(isViewTransitionActive()).toBe(true)

    finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(isViewTransitionActive()).toBe(false)
    expect(seen).toEqual([true, false])
  })

  it('still returns the original transition object', () => {
    const { doc } = fakeDoc()
    const original = doc.startViewTransition as unknown as ReturnType<typeof vi.fn>
    installViewTransitionGate(doc)
    const vt = (doc as unknown as { startViewTransition: () => unknown }).startViewTransition()
    expect(original).toHaveBeenCalledTimes(1)
    expect(vt).toBe(original.mock.results[0].value)
  })

  it('does nothing without the API', () => {
    installViewTransitionGate({} as Document)
    expect(isViewTransitionActive()).toBe(false)
  })
})

describe('motion import guard', () => {
  const SRC = resolve(__dirname, '../..')
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(name) && !p.includes('__tests__')) files.push(p)
    }
  }
  walk(SRC)

  it('never imports the eager `motion` component (LazyMotion uses `m`)', () => {
    const offenders = files.filter((f) =>
      /import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*['"](motion\/react|framer-motion)['"]/.test(readFileSync(f, 'utf8'))
    )
    expect(offenders).toEqual([])
  })
})
