import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
