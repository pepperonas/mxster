import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AuthProvider } from '../AuthContext'
import { AuthGate } from '../AuthGate'
import { fakeApiFetch } from '@/test/fakeApi'

const me = (status: string) => ({
  id: 1,
  email: 'anna@example.com',
  name: 'Anna Beispiel',
  picture: '',
  status,
  isAdmin: false,
  csrf: 'csrf'
})

function serveSession(...answers: Array<ReturnType<typeof me> | null>) {
  const queue = [...answers]
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/session') {
        const next = queue.length > 1 ? queue.shift() : queue[0]
        return new Response(JSON.stringify({ me: next }), { status: 200 })
      }
      return fakeApiFetch(input, init)
    })
  )
}

const renderGate = () =>
  render(
    <MotionTestProvider>
      <AuthProvider>
        <AuthGate>
          <p>DIE APP</p>
        </AuthGate>
      </AuthProvider>
    </MotionTestProvider>
  )

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AuthGate', () => {
  it('shows the Google sign-in when nobody is signed in', async () => {
    serveSession(null)
    renderGate()
    const link = await screen.findByRole('link', { name: /mit google anmelden/i })
    expect(link.getAttribute('href')).toBe('/api/auth/login')
    expect(screen.queryByText('DIE APP')).toBeNull()
  })

  it('keeps pending accounts in the waiting room', async () => {
    serveSession(me('pending'))
    renderGate()
    expect(await screen.findByText('Fast geschafft, Anna.')).toBeTruthy()
    expect(screen.queryByText('DIE APP')).toBeNull()
  })

  it.each([
    ['blocked', 'Zugang gesperrt.'],
    ['rejected', 'Kein Zugang.']
  ])('closes the door for %s accounts', async (status, title) => {
    serveSession(me(status))
    renderGate()
    expect(await screen.findByText(title)).toBeTruthy()
    expect(screen.queryByText('DIE APP')).toBeNull()
  })

  it('lets approved accounts in', async () => {
    serveSession(me('approved'))
    renderGate()
    expect(await screen.findByText('DIE APP')).toBeTruthy()
  })

  it('moves from the waiting room into the app once approved', async () => {
    serveSession(me('pending'), me('approved'))
    renderGate()
    fireEvent.click(await screen.findByRole('button', { name: /jetzt prüfen/i }))
    await waitFor(() => expect(screen.getByText('DIE APP')).toBeTruthy())
  })

  it('reports a dead connection instead of pretending to be signed out', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    renderGate()
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy()
  })
})
