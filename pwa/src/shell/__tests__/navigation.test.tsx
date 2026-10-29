import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { fakeApiFetch } from '@/test/fakeApi'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthGate } from '@/auth/AuthGate'
import { AppProviders } from '@/contexts/AppProviders'
import { AppShell, DESTINATIONS, isActive } from '../AppShell'
import { Tabs } from '@/components/ui/Tabs'
import { normalizeRoomCode, roomCodeOrNull } from '@/online/roomCode'
import { tabStep } from '@/navigation/backStack'
import { TOP_LEVEL } from '../AppShell'

const src = (f: string) => readFileSync(join(process.cwd(), 'src', f), 'utf8')

describe('destinations', () => {
  it('Spielen · Rückblick · Songs · Erfolge · Leute, in that order (five: the M3 maximum)', () => {
    expect(DESTINATIONS.map((d) => d.label)).toEqual(['play', 'review', 'songs', 'achievements', 'people'])
    expect(DESTINATIONS.map((d) => d.to)).toEqual(['/', '/history', '/songs', '/achievements', '/players'])
  })

  it('a destination is active on all its tabs and the pages below them', () => {
    const [play, review, songs, , people] = DESTINATIONS
    for (const p of ['/history', '/history/abc', '/stats']) expect(isActive(review, p)).toBe(true)
    for (const p of ['/players', '/players/Lisa', '/friends']) expect(isActive(people, p)).toBe(true)
    expect(isActive(songs, '/songs')).toBe(true)
    expect(isActive(play, '/')).toBe(true)
    expect(isActive(play, '/history')).toBe(false) // "/" never matches everything
    expect(isActive(review, '/settings')).toBe(false)
  })

  it('switching tabs inside a destination swaps the entry (no stacked pages); back goes Home', () => {
    expect(tabStep('/stats', '/history', TOP_LEVEL, 1, {})).toEqual({ kind: 'go', to: '/stats', replace: true })
    expect(tabStep('/friends', '/players', TOP_LEVEL, 1, {})).toEqual({ kind: 'go', to: '/friends', replace: true })
    expect(tabStep('/settings', '/songs', TOP_LEVEL, 1, {})).toEqual({ kind: 'go', to: '/settings', replace: true })
  })
})

describe('routes', () => {
  it('old addresses land on the new pages (with search, sort and filters kept for the songs)', () => {
    const app = src('App.tsx')
    expect(app).toContain(`{ path: '/profile', element: <Navigate to="/settings" replace /> }`)
    expect(app).toContain(`{ path: '/stats/songs', element: <KeepQuery to="/songs" /> }`)
    expect(app).toMatch(/function KeepQuery[\s\S]*?to=\{`\$\{to\}\$\{search\}`\}/)
    for (const r of ["'/songs'", "'/friends'", "'/settings'"]) expect(app).toContain(`{ path: ${r}`)
  })

  it('the songs card left the statistics (Songs is a destination now)', () => {
    expect(src('screens/StatisticsScreen.tsx')).not.toContain('LibraryEntry')
    expect(src('screens/SongLibraryScreen.tsx')).not.toContain('SubPageHeader')
  })
})

describe('the shell on a phone and on a desktop', () => {
  let where = ''
  function Where() {
    where = useLocation().pathname
    return null
  }
  const me = (isAdmin: boolean) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 })
        if (url === '/api/session') return json({ me: { id: 1, email: 'a@example.com', name: 'Anna', picture: '', status: 'approved', isAdmin, csrf: 't' } })
        if (url === '/api/songs/overrides') return json({ overrides: [] })
        if (url.startsWith('/api/admin/users')) return json({ counts: { pending: 2 } })
        if (url.startsWith('/api/friends')) return json({ friends: [], incoming: [{ id: 2 }], outgoing: [] })
        return fakeApiFetch(input, init)
      })
    )
  const shell = (path = '/') =>
    render(
      <MotionTestProvider>
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <AuthGate>
              <AppProviders>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route path="*" element={<Where />} />
                  </Route>
                </Routes>
              </AppProviders>
            </AuthGate>
          </AuthProvider>
        </MemoryRouter>
      </MotionTestProvider>
    )
  afterEach(() => vi.unstubAllGlobals())

  it('the gear opens the settings — one obvious way, on every top-level page', async () => {
    me(false)
    shell('/songs')
    await waitFor(() => expect(document.querySelectorAll('[data-settings-link]').length).toBeGreaterThan(0))
    fireEvent.click(document.querySelector('[data-settings-link]')!)
    await waitFor(() => expect(where).toBe('/settings'))
  })

  it('the admin entry (with open requests) is there for the admin only', async () => {
    me(true)
    const a = shell('/')
    await waitFor(() => expect(document.querySelector('[data-admin-link]')?.textContent).toContain('2'))
    a.unmount()
    me(false)
    shell('/')
    await waitFor(() => expect(document.querySelectorAll('[data-settings-link]').length).toBeGreaterThan(0))
    expect(document.querySelector('[data-admin-link]')).toBeNull()
  })

  it('five items in the bottom bar; "Rückblick" is current on the stats tab', async () => {
    me(false)
    shell('/stats')
    await waitFor(() => expect(document.querySelectorAll('[data-nav-item]').length).toBeGreaterThan(0))
    // bar and rail are both in the DOM (CSS shows one): five items each
    for (const nav of screen.getAllByRole('navigation')) expect(nav.querySelectorAll('[data-nav-item]').length).toBe(5)
    const current = [...document.querySelectorAll('[data-nav-item][aria-current="page"]')].map((a) => a.getAttribute('data-nav-item'))
    expect(new Set(current)).toEqual(new Set(['review']))
  })
})

describe('tabs', () => {
  it('mark the current one, swap pages with the arrow keys and show a badge', async () => {
    let where = ''
    function Where() {
      where = useLocation().pathname
      return null
    }
    render(
      <MotionTestProvider>
        <MemoryRouter initialEntries={['/players']}>
          <Tabs id="t" label="Leute" items={[{ to: '/players', label: 'Spieler' }, { to: '/friends', label: 'Freunde', badge: 3 }]} />
          <Routes>
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </MotionTestProvider>
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false'])
    expect(tabs[1].textContent).toBe('Freunde3')
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    await waitFor(() => expect(where).toBe('/friends'))
  })

  it('Rückblick and Leute carry them', () => {
    expect(src('screens/HistoryScreen.tsx')).toContain('<ReviewHeader />')
    expect(src('screens/StatisticsScreen.tsx')).toContain('<ReviewHeader />')
    expect(src('screens/PlayersScreen.tsx')).toContain('<PeopleHeader />')
    expect(src('screens/FriendsScreen.tsx')).toContain('<PeopleHeader />')
    // friends no longer hide at the bottom of the players page
    expect(src('screens/PlayersScreen.tsx')).not.toContain('<FriendsSection')
  })
})

describe('settings', () => {
  it('account first, then appearance, game, notifications, data, about — no duplicate way to the players', () => {
    const s = src('screens/ProfileScreen.tsx')
    const order = ['t.account', 't.appearance', 't.game', 't.notifications', 't.data', 't.about'].map((k) => s.indexOf(`<Group title={${k}}>`))
    expect(order.every((i) => i > 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(s).not.toContain('managePlayers')
  })
})

describe('joining with a code', () => {
  it('forgives what people type, like the server', () => {
    expect(normalizeRoomCode('ab12-cd34')).toBe('AB12CD34')
    expect(normalizeRoomCode(' aBlo cdu4 ')).toBe('AB10CDV4')
    expect(roomCodeOrNull('ab12-cd34')).toBe('AB12CD34')
    expect(roomCodeOrNull('AB12CD3')).toBeNull() // too short
    expect(roomCodeOrNull('AB12CD3!')).toBeNull()
  })

  it('a valid code opens the room, an invalid one says so', async () => {
    const { JoinWithCode } = await import('@/screens/HomeScreen')
    let where = ''
    function Where() {
      where = useLocation().pathname
      return null
    }
    render(
      <MotionTestProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppProviders>
            <JoinWithCode />
            <Routes>
              <Route path="*" element={<Where />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      </MotionTestProvider>
    )
    const input = screen.getByLabelText('Raum-Code')
    fireEvent.change(input, { target: { value: 'xyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Beitreten' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(where).toBe('/')
    fireEvent.change(input, { target: { value: 'ab12-cdo4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Beitreten' }))
    await waitFor(() => expect(where).toBe('/r/AB12CD04'))
  })
})
