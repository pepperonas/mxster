import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup as cleanupAll } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { fakeApiFetch } from '@/test/fakeApi'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthGate } from '@/auth/AuthGate'
import { AppProviders } from '@/contexts/AppProviders'
import { useGame } from '@/contexts'
import { DailyScreen } from '../DailyScreen'
import { DailyNotifyDialog, preselect } from '@/components/game/DailyNotify'
import { dailySongs, localDay } from '@/game/daily'
import { songs } from '@/data/songs'

const today = localDay()
type Row = { id: number; name: string; picture: string; score: number; total: number; turns: number; state: string; me: boolean }
const row = (extra: Partial<Row>): Row => ({ id: 1, name: 'Anna', picture: '', score: 0, total: 50, turns: 0, state: 'finished', me: false, ...extra })

function serve(board: Record<string, unknown>, start: { status: number; body: unknown } = { status: 200, body: { state: 'running', turns: 0, score: 0, max: 50 } }) {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
      if (url === '/api/session') return json({ me: { id: 1, email: 'a@example.com', name: 'Anna', picture: '', status: 'approved', isAdmin: false, csrf: 't' } })
      if (url === '/api/songs/overrides') return json({ overrides: [] })
      if (url.startsWith('/api/daily/')) {
        calls.push(`${init?.method ?? 'GET'} ${url}`)
        if (url.endsWith('/start')) return json(start.body, start.status)
        if (url === `/api/daily/${today}`) return json({ day: today, max: 50, board: [], running: [], mine: null, state: 'none', ...board })
        return json({ day: 'x', max: 50, board: yesterdayBoard, running: [], mine: null, state: 'none' })
      }
      return fakeApiFetch(input, init)
    })
  )
  return calls
}

let yesterdayBoard: Row[] = []
let game: ReturnType<typeof useGame> | null = null
function Peek() {
  game = useGame()
  return null
}
const page = () =>
  render(
    <MotionTestProvider>
      <MemoryRouter initialEntries={['/daily']}>
        <AuthProvider>
          <AuthGate>
            <AppProviders>
              <Peek />
              <Routes>
                <Route path="/daily" element={<DailyScreen />} />
                <Route path="/game" element={<p>im Spiel</p>} />
              </Routes>
            </AppProviders>
          </AuthGate>
        </AuthProvider>
      </MemoryRouter>
    </MotionTestProvider>
  )

afterEach(() => {
  yesterdayBoard = []
  vi.unstubAllGlobals()
  game = null
  localStorage.clear()
})

describe('daily round page', () => {
  it('not played yet: one start button; starting asks the server first', async () => {
    const calls = serve({})
    page()
    fireEvent.click(await screen.findByRole('button', { name: /Tagesrunde starten/ }))
    await screen.findByText('im Spiel')
    expect(calls).toContain(`POST /api/daily/${today}/start`)
    expect(game!.daily).toBe(today)
    expect(game!.players[0].timeline).toEqual([])
  })

  it('a paused run: only "continue", and the booked songs are back on the timeline', async () => {
    serve({ state: 'running', mine: row({ me: true, state: 'running', score: 3, turns: 3 }) }, { status: 200, body: { state: 'running', turns: 3, score: 3, max: 50 } })
    page()
    expect(screen.queryByRole('button', { name: /Tagesrunde starten/ })).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: /Weiterspielen · Serie 3/ }))
    await screen.findByText('im Spiel')
    const list = dailySongs(today, songs)
    expect(game!.players[0].cards).toBe(4)
    expect(game!.players[0].timeline.map((s) => s.id).sort()).toEqual(list.slice(0, 4).map((s) => s.id).sort())
    expect(game!.playedSongs).toHaveLength(4)
  })

  it('finished: the streak, and no way to start again', async () => {
    serve({ state: 'finished', mine: row({ me: true, score: 7, turns: 8 }), board: [row({ me: true, score: 7, turns: 8 })] })
    page()
    expect(await screen.findByText('Deine Serie heute')).toBeInTheDocument()
    expect(document.querySelector('[data-daily-state="finished"]')!.textContent).toContain('7')
    expect(screen.queryByRole('button', { name: /starten|Weiterspielen/ })).toBeNull()
  })

  it('the server refusing a second start keeps the player out of the game', async () => {
    const calls = serve({}, { status: 409, body: { code: 'already_played', message: 'x' } })
    page()
    fireEvent.click(await screen.findByRole('button', { name: /Tagesrunde starten/ }))
    // the page asks the server again for the real state (and shows it)
    await waitFor(() => expect(calls.filter((c) => c === `GET /api/daily/${today}`).length).toBe(2))
    expect(screen.queryByText('im Spiel')).toBeNull()
    expect(game!.isGameStarted).toBe(false)
  })

  it("yesterday's winner, only when someone was beaten; days from before keep their old format", async () => {
    yesterdayBoard = [row({ id: 2, name: 'Boss', score: 7, total: 10 })]
    serve({})
    page()
    await screen.findByRole('button', { name: /Tagesrunde starten/ })
    expect(document.querySelector('[data-yesterday]')).toBeNull()
    cleanupAll()
    yesterdayBoard = [row({ id: 2, name: 'Boss', score: 7, total: 10 }), row({ id: 3, name: 'Zoe', score: 4, total: 10 })]
    serve({})
    page()
    await waitFor(() => expect(document.querySelector('[data-yesterday]')?.textContent).toBe('Gestern gewann Boss – 7 von 10.'))
  })

  it('friends still playing are listed without a place; finished ones ranked by streak', async () => {
    serve({ board: [row({ id: 2, name: 'Boss', score: 9 }), row({ id: 3, name: 'Zoe', score: 4 })], running: [row({ id: 4, name: 'Kim', state: 'running', score: 2 })] })
    page()
    expect(await screen.findByText(/spielt gerade · Serie 2/)).toBeInTheDocument()
    const ranked = [...document.querySelectorAll('ol > li')].map((li) => li.textContent)
    expect(ranked[0]).toContain('Boss')
    expect(ranked[0]).toContain('Serie 9')
    expect(ranked[1]).toContain('Zoe')
  })
})

describe('telling friends after the round', () => {
  const friends = [
    { id: 2, name: 'Boss', picture: '', played: true },
    { id: 3, name: 'Kim', picture: '', played: false }
  ]

  it('preselects who has not played today', () => {
    expect(preselect(friends)).toEqual([3])
  })

  it('sends to the chosen friends only, once, in the app language', async () => {
    const sent: unknown[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).endsWith('/notify') && init?.method === 'POST') {
          sent.push(JSON.parse(String(init.body)))
          return new Response(JSON.stringify({ sent: 2 }), { status: 200 })
        }
        if (String(input).endsWith('/notify')) return new Response(JSON.stringify({ sent: false, friends }), { status: 200 })
        return fakeApiFetch(input, init)
      })
    )
    const onSent = vi.fn()
    const onClose = vi.fn()
    render(
      <MotionTestProvider>
        <AppProviders>
          <DailyNotifyDialog day={today} streak={5} onSent={onSent} onClose={onClose} />
        </AppProviders>
      </MotionTestProvider>
    )
    expect(await screen.findByText(/Serie von 5/)).toBeInTheDocument()
    const boss = screen.getByRole('checkbox', { name: /Boss/ }) as HTMLInputElement
    const kim = screen.getByRole('checkbox', { name: /Kim/ }) as HTMLInputElement
    expect([boss.checked, kim.checked]).toEqual([false, true])
    fireEvent.click(boss)
    fireEvent.click(screen.getByRole('button', { name: 'Senden (2)' }))
    await waitFor(() => expect(onSent).toHaveBeenCalled())
    expect(sent).toEqual([{ ids: [3, 2], lang: 'de' }])
    expect(onClose).toHaveBeenCalled()
  })

  it('nobody chosen: nothing to send', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
        String(input).endsWith('/notify') ? new Response(JSON.stringify({ sent: false, friends }), { status: 200 }) : fakeApiFetch(input, init)
      )
    )
    render(
      <MotionTestProvider>
        <AppProviders>
          <DailyNotifyDialog day={today} streak={5} onSent={() => {}} onClose={() => {}} />
        </AppProviders>
      </MotionTestProvider>
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Keine' }))
    expect(screen.getByRole('button', { name: /^Senden/ })).toBeDisabled()
  })
})

describe('the board during the daily round', () => {
  it('shows the streak — never "3/99" (the round has no goal to reach)', async () => {
    const { GameBoards } = await import('@/components/game/GameBoards')
    const { useEffect } = await import('react')
    const list = dailySongs(today, songs)
    function Daily({ daily }: { daily: boolean }) {
      const g = useGame()
      useEffect(() => {
        g.setGameMode('timeline_personal' as never)
        g.setOptions({ goal: 99, daily: daily ? today : null, songIds: list.map((s) => s.id) })
        g.setPlayers([{ name: 'Anna', timeline: list.slice(0, 4), cards: 4, score: 0 }])
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return (
        <GameBoards
          interactive={false}
          previewGap={null}
          hoverGap={null}
          reveal={null}
          revealPlayerIndex={null}
          onGapSelect={() => {}}
          boardRef={{ current: null }}
        />
      )
    }
    const view = (daily: boolean) =>
      render(
        <MotionTestProvider>
          <AppProviders>
            <Daily daily={daily} />
          </AppProviders>
        </MotionTestProvider>
      )
    const { container, unmount } = view(true)
    await waitFor(() => expect(container.querySelector('[data-streak]')?.textContent).toMatch(/^Serie 3+$/)) // the number: visible + for screen readers
    expect(container.textContent).not.toContain('/99')
    unmount()
    const normal = view(false)
    await waitFor(() => expect(normal.container.textContent).toContain('/99'))
    expect(normal.container.querySelector('[data-streak]')).toBeNull()
  })
})

describe('layers', () => {
  it('a dialog opens above the round-end screen (the mail dialog lives there), below toasts and unlock cards', async () => {
    const { readFileSync } = await import('node:fs')
    const z = (file: string, re: RegExp) => Number(re.exec(readFileSync(file, 'utf8'))![1])
    const modal = z('src/components/Modal.tsx', /fixed inset-0 z-\[(\d+)\] flex justify-center/)
    const gameOver = z('src/components/game/GameOver.tsx', /fixed inset-0 z-\[(\d+)\] overflow-y-auto/)
    const toast = z('src/components/Toast.tsx', /z-\[(\d+)\] flex flex-col/)
    const unlock = z('src/components/AchievementUnlockAnimation.tsx', /fixed inset-0 z-\[(\d+)\]/)
    expect(modal).toBeGreaterThan(gameOver)
    expect(modal).toBeLessThan(toast)
    expect(modal).toBeLessThan(unlock)
  })
})
