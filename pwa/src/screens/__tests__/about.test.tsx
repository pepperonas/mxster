/**
 * /about: the playable timeline follows the game's rule, the page is open to
 * everyone, both languages carry the same content, and the help states what
 * the code does.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { LanguageProvider } from '@/i18n'
import { ABOUT } from '@/i18n/messages/about'
import { allSongs } from '@/data/catalogue'
import { isAboutPath, isLegalPath } from '@/auth/AuthGate'
import { navKind } from '@/navigation/navDirection'
import { DEMO_MIN_GAP, DEMO_TIMELINE, demoPool, judge, pickRound } from '../aboutDemo'
import { STARTING_CHALLENGES } from '@/game/challenge'
import { MAX_JOKERS } from '@/game/bonus'
import { AWAY_GRACE_MS } from '@/game/presence'
import { DAILY_MAX } from '@/game/daily'
import { ACHIEVEMENT_POINTS } from '@/game/achievementPoints'
import { guessBreakdown } from '@/game/guess'
import type { Song } from '@/types'

let authState: unknown = { kind: 'anonymous' }
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ state: authState }) }))
const { AboutScreen } = await import('../AboutScreen')

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const song = (id: string, year: number, extra: Partial<Song> = {}): Song =>
  ({ id, title: id, artist: 'A', year, previewUrl: '', genre: 'Pop', ...extra }) as Song

const page = (lang: 'de' | 'en' = 'de') =>
  render(
    <MotionTestProvider>
      <LanguageProvider initial={lang}>
        <MemoryRouter initialEntries={['/about']}>
          <AboutScreen />
        </MemoryRouter>
      </LanguageProvider>
    </MotionTestProvider>
  )

describe('demo round (pure)', () => {
  it('draws three songs in year order and a fourth to place, years apart, no exotics', () => {
    for (let s = 1; s < 60; s++) {
      const r = pickRound(allSongs(), seeded(s))!
      expect(r.timeline).toHaveLength(DEMO_TIMELINE)
      const years = [r.card, ...r.timeline].map((x) => x.year)
      for (let i = 0; i < years.length; i++)
        for (let j = i + 1; j < years.length; j++) expect(Math.abs(years[i] - years[j])).toBeGreaterThanOrEqual(DEMO_MIN_GAP)
      expect(r.timeline.map((x) => x.year)).toEqual([...r.timeline.map((x) => x.year)].sort((a, b) => a - b))
      expect([r.card, ...r.timeline].some((x) => x.exotic)).toBe(false)
    }
  })

  it('leaves out exotic songs and avoids recently shown ones while there are enough', () => {
    const list = [song('a', 1960), song('b', 1970), song('c', 1980), song('d', 1990), song('x', 2000, { exotic: true }), song('e', 2010)]
    expect(demoPool(list).map((s) => s.id)).not.toContain('x')
    for (let s = 1; s < 20; s++) {
      const r = pickRound(list, seeded(s), new Set(['a']))!
      expect([r.card, ...r.timeline].map((x) => x.id)).not.toContain('a')
    }
  })

  it('judges like the game: only the gap between the neighbours is right', () => {
    const round = { timeline: [song('a', 1960), song('b', 1980), song('c', 2000)], card: song('x', 1990) }
    expect([0, 1, 2, 3].map((g) => judge(round, g).right)).toEqual([false, false, true, false])
    const wrong = judge(round, 0)
    expect(wrong.gap).toBe(2)
    expect(wrong.settled.map((s) => s.year)).toEqual([1960, 1980, 1990, 2000])
  })
})

describe('about page', () => {
  it('lets a visitor place the song; a wrong guess shows where it belonged', () => {
    page()
    const demo = document.querySelector('[data-demo]') as HTMLElement
    const card = [...demo.querySelectorAll('[data-demo-card] span')].map((e) => e.textContent).join(' ')
    const gaps = within(demo).getAllByRole('button', { name: /Hier ablegen/ })
    expect(gaps).toHaveLength(DEMO_TIMELINE + 1)
    fireEvent.click(gaps[0])
    const result = demo.querySelector('[data-demo-result]')!
    // the waiting card never showed the year the reveal names
    const year = /\b(19|20)\d\d\b/.exec(result.textContent!)![0]
    expect(card).not.toContain(year)
    expect(demo.querySelectorAll('[data-demo-row]')).toHaveLength(DEMO_TIMELINE + 1)
    expect(demo.querySelectorAll('[data-demo-gap]')).toHaveLength(0)
    expect(result.textContent).toMatch(/^(Richtig|Daneben)/)
    expect(document.querySelector('[data-demo-score]')!.textContent).toMatch(/^[01] von 1 richtig$/)
    fireEvent.click(screen.getByRole('button', { name: 'Nächster Song' }))
    expect(document.querySelectorAll('[data-demo-gap]')).toHaveLength(DEMO_TIMELINE + 1)
  })

  it('counts the songs and decades from the catalogue', () => {
    page()
    const facts = document.querySelector('[data-about-facts]')!.textContent!
    const songs = allSongs()
    expect(facts).toContain(`${songs.length}Songs`)
    const decades = new Set(songs.map((s) => Math.floor(s.year / 10)))
    expect(facts).toContain(`${decades.size}Jahrzehnte, ${Math.min(...decades) * 10} bis heute`)
  })

  it('the call to action fits who is looking', () => {
    authState = { kind: 'anonymous' }
    const a = page()
    expect(document.querySelector('[data-about-cta="hero"]')!.textContent).toContain('Anmelden')
    a.unmount()
    authState = { kind: 'signed-in', me: { status: 'approved' } }
    const b = page('en')
    expect(document.querySelector('[data-about-cta="hero"]')!.textContent).toContain('Go to the game')
    expect(document.querySelector('[data-about-cta="hero"]')!.getAttribute('href')).toBe('/')
    b.unmount()
    authState = { kind: 'signed-in', me: { status: 'pending' } }
    page()
    expect(document.querySelector('[data-about-cta="hero"]')!.textContent).toContain('Warteraum')
    authState = { kind: 'anonymous' }
  })

  it('opens every help answer as a native disclosure', () => {
    page('en')
    const faq = document.querySelectorAll('[data-about-faq] details')
    expect(faq).toHaveLength(ABOUT.en.faq.length)
    expect(faq[0].querySelector('summary')!.textContent).toBe(ABOUT.en.faq[0].q)
  })
})

describe('about content', () => {
  it('English has as many entries as German everywhere', () => {
    for (const k of ['steps', 'modes', 'ways', 'extras', 'faq'] as const) expect(ABOUT.en[k].length).toBe(ABOUT.de[k].length)
    ABOUT.de.faq.forEach((f, i) => expect(ABOUT.en.faq[i].a.length).toBe(f.a.length))
    ABOUT.de.modes.forEach((m, i) => expect(ABOUT.en.modes[i].icon).toBe(m.icon))
  })

  it('every icon exists', async () => {
    const { ICON_NAMES } = await import('@/components/ui/Icon')
    for (const lang of ['de', 'en'] as const)
      for (const it of [...ABOUT[lang].modes, ...ABOUT[lang].ways, ...ABOUT[lang].extras]) expect(ICON_NAMES).toContain(it.icon)
  })

  it('states the rules the game actually has', () => {
    const de = JSON.stringify(ABOUT.de)
    const en = JSON.stringify(ABOUT.en)
    const words: Record<number, [string, string]> = { 3: ['Drei', 'Three'] }
    // objections per round
    expect(STARTING_CHALLENGES).toBe(3)
    expect(de).toContain(`${words[3][0]} Einsprüche pro Runde`)
    expect(en).toContain(`${words[3][1]} objections per round`)
    // hardcore points
    expect(guessBreakdown({ titleMatch: true, artistMatch: true, yearDifference: 0 }).total).toBe(15)
    expect(guessBreakdown({ titleMatch: false, artistMatch: false, yearDifference: 1 }).total).toBe(2)
    expect(guessBreakdown({ titleMatch: false, artistMatch: false, yearDifference: 2 }).total).toBe(1)
    expect(de).toContain('Höchstens 15 Punkte pro Song')
    // the number of achievements
    expect(Object.keys(ACHIEVEMENT_POINTS)).toHaveLength(50)
    expect(de).toContain('50 Erfolge')
    expect(en).toContain('50 achievements')
    // daily round and jokers exist as described
    expect(DAILY_MAX).toBeGreaterThan(0)
    expect(MAX_JOKERS).toBeGreaterThan(0)
  })

  it('names the room limit and the 30-second grace the server and game use', () => {
    const db = readFileSync(join(__dirname, '../../../../server/app/db.py'), 'utf8')
    expect(db).toMatch(/MAX_SEATS\s*=\s*10\b/)
    expect(AWAY_GRACE_MS).toBe(30_000)
    expect(ABOUT.de.stats(1, 1, 1950).find((s) => s.l.includes('Raum'))!.n).toBe('10')
    expect(JSON.stringify(ABOUT.de.faq)).toContain('30 Sekunden')
  })
})

describe('routing', () => {
  it('the page is public, its old and short names too', () => {
    for (const p of ['/about', '/about/', '/landing', '/help']) expect(isAboutPath(p)).toBe(true)
    for (const p of ['/abouts', '/about/x', '/', '/stats']) expect(isAboutPath(p)).toBe(false)
    expect(isLegalPath('/about')).toBe(false)
  })

  it('is a full-screen page for the transitions', () => {
    expect(navKind('/', '/about')).toBe('up')
    expect(navKind('/about', '/')).toBe('down')
  })

  it('the app knows the route and the redirects, the service worker leaves them to the network', () => {
    const app = readFileSync(join(__dirname, '../../App.tsx'), 'utf8')
    expect(app).toContain("{ path: '/about', element: <AboutScreen /> }")
    expect(app).toContain("{ path: '/landing', element: <Navigate to=\"/about\" replace /> }")
    expect(app).toContain("{ path: '/help', element: <Navigate to=\"/about#help\" replace /> }")
    const vite = readFileSync(join(__dirname, '../../../vite.config.ts'), 'utf8')
    expect(vite).toContain('/^\\/(about|landing|help)\\/?$/')
  })
})
