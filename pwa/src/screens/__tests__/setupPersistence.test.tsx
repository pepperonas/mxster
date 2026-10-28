import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { saveGame, loadSavedGame } from '@/game/savedGame'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { fakeApiFetch } from '@/test/fakeApi'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthGate } from '@/auth/AuthGate'
import { AppProviders } from '@/contexts/AppProviders'
import { SetupScreen } from '../SetupScreen'

const OPTIONS_KEY = 'mxster_last_options'

function serve() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 })
      if (url === '/api/session')
        return json({ me: { id: 1, email: 'a@example.com', name: 'Anna', picture: '', status: 'approved', isAdmin: false, csrf: 't' } })
      if (url === '/api/songs/overrides') return json({ overrides: [] })
      return fakeApiFetch(input, init)
    })
  )
}

// A fresh tree is what a reload gives: every context starts from scratch
const renderSetup = () =>
  render(
    <MotionTestProvider>
      <MemoryRouter initialEntries={['/new']}>
        <AuthProvider>
          <AuthGate>
            <AppProviders>
              <SetupScreen />
            </AppProviders>
          </AuthGate>
        </AuthProvider>
      </MemoryRouter>
    </MotionTestProvider>
  )

const objection = async () => (await screen.findByRole('switch', { name: 'Einspruch' })) as HTMLInputElement

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.removeItem(OPTIONS_KEY)
})

describe('SetupScreen options survive a reload', () => {
  it('keeps Einspruch switched off without starting a round', async () => {
    serve()
    renderSetup()
    const sw = await objection()
    expect(sw.checked).toBe(true)
    fireEvent.click(sw)
    await waitFor(() => expect(JSON.parse(localStorage.getItem(OPTIONS_KEY)!).challengesEnabled).toBe(false))

    cleanup()
    renderSetup()
    await objection()
    await waitFor(async () => expect((await objection()).checked).toBe(false))
  })

  it('does not overwrite stored options with the defaults on the first render', async () => {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify({ challengesEnabled: false, bonus: true, goal: 15 }))
    serve()
    renderSetup()
    await objection()
    await waitFor(async () => expect((await objection()).checked).toBe(false))
    const stored = JSON.parse(localStorage.getItem(OPTIONS_KEY)!)
    expect(stored).toMatchObject({ challengesEnabled: false, bonus: true, goal: 15 })
  })
})

describe('SetupScreen and a round running on this device', () => {
  const running = { isGameStarted: true, finished: false, gameMode: 'timeline_global', players: [{ name: 'Anna', timeline: [], cards: 3, score: 0 }] }
  const renderAt = (entry: string | { pathname: string; state: unknown }) =>
    render(
      <MotionTestProvider>
        <MemoryRouter initialEntries={[entry as never]}>
          <AuthProvider>
            <AuthGate>
              <AppProviders>
                <Routes>
                  <Route path="/" element={<p>Startseite</p>} />
                  <Route path="/new" element={<SetupScreen />} />
                </Routes>
              </AppProviders>
            </AuthGate>
          </AuthProvider>
        </MemoryRouter>
      </MotionTestProvider>
    )
  afterEach(() => localStorage.removeItem('mxster_running_game'))

  it('is not thrown away by reaching the setup some other way: back to Home, where it can be continued', async () => {
    saveGame(running)
    serve()
    renderAt('/new')
    expect(await screen.findByText('Startseite')).toBeTruthy()
    expect(loadSavedGame<{ players: unknown[] }>()?.players).toHaveLength(1)
  })

  it('is replaced once Home asked and the player chose a new round', async () => {
    saveGame(running)
    serve()
    renderAt({ pathname: '/new', state: { newRound: true } })
    await objection()
    expect(screen.queryByText('Startseite')).toBeNull()
  })
})
