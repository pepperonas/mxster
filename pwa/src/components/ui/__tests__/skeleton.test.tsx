import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '@/i18n'
import { MotionTestProvider } from '@/test/MotionTestProvider'

const state = { history: [] as unknown[], ready: false }
vi.mock('@/contexts', () => ({
  useGameHistory: () => state,
  useUI: () => ({ openModal: vi.fn(), addToast: vi.fn() })
}))

import { HistoryScreen } from '@/screens/HistoryScreen'

const renderHistory = () =>
  render(
    <MemoryRouter>
      <LanguageProvider initial="de">
        <MotionTestProvider>
          <HistoryScreen />
        </MotionTestProvider>
      </LanguageProvider>
    </MemoryRouter>
  )

beforeEach(() => {
  state.history = []
  state.ready = false
})

describe('loading placeholders', () => {
  it('the history shows placeholders while it loads, never the empty state', () => {
    renderHistory()
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(status.textContent).toContain('Wird geladen')
    expect(status.querySelectorAll('.mx-skeleton').length).toBeGreaterThanOrEqual(4)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('once loaded and empty, the placeholders give way to the empty state', () => {
    state.ready = true
    renderHistory()
    expect(screen.queryByRole('status')).toBeNull()
    expect(document.querySelector('.mx-skeleton')).toBeNull()
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('the statistics show placeholders while loading', () => {
    const src = readFileSync(join(process.cwd(), 'src/screens/StatisticsScreen.tsx'), 'utf8')
    const loading = src.slice(src.indexOf('history.length === 0 && !ready'), src.indexOf('if (history.length === 0) {'))
    expect(loading).toContain('<SkeletonGroup')
    expect(loading).toContain('<SkeletonBlock')
  })

  it('placeholders wait before they show, and stand still with reduced motion', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/motion.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).toMatch(/\.mx-skeleton \{[^}]*animation: mx-skeleton-in [^;]* 250ms both/)
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.mx-skeleton::after \{\s*animation: none;/)
  })

  it('statistics and profile build up in a stagger', () => {
    for (const f of ['StatisticsScreen', 'ProfileScreen']) {
      const src = readFileSync(join(process.cwd(), `src/screens/${f}.tsx`), 'utf8')
      expect(src, f).toContain('space-y-6 stagger-children')
    }
  })
})
