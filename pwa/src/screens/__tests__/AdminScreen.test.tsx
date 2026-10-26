import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthGate } from '@/auth/AuthGate'
import { UIProvider } from '@/contexts/UIContext'
import { Toast } from '@/components/Toast'
import { AdminScreen } from '../AdminScreen'

const account = (id: number, name: string, status: string) => ({
  id,
  email: `${name.toLowerCase()}@example.com`,
  name,
  picture: '',
  status,
  isAdmin: false,
  createdAt: '2026-10-26T20:00:00+00:00',
  decidedAt: null,
  lastLoginAt: null
})

let users = [account(2, 'Anna', 'pending'), account(3, 'Tom', 'approved')]
const calls: string[] = []

function serve() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 })
      if (url === '/api/session')
        return json({ me: { id: 1, email: 'boss@example.com', name: 'Boss', picture: '', status: 'approved', isAdmin: true, csrf: 't' } })
      if (url === '/api/admin/users') return json({ users })
      const m = /\/api\/admin\/users\/(\d+)\/(\w+)/.exec(url)
      if (m && init?.method === 'POST') {
        calls.push(`${m[1]}:${m[2]}`)
        const status = { approve: 'approved', reset: 'pending', reject: 'rejected', block: 'blocked' }[m[2]]!
        users = users.map((u) => (u.id === Number(m[1]) ? { ...u, status } : u))
        return json(users.find((u) => u.id === Number(m[1])))
      }
      return new Response('{}', { status: 404 })
    })
  )
}

const renderAdmin = () =>
  render(
    <MotionTestProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AuthGate>
            <UIProvider>
              <AdminScreen />
              <Toast />
            </UIProvider>
          </AuthGate>
        </AuthProvider>
      </MemoryRouter>
    </MotionTestProvider>
  )

afterEach(() => {
  vi.unstubAllGlobals()
  users = [account(2, 'Anna', 'pending'), account(3, 'Tom', 'approved')]
  calls.length = 0
})

describe('AdminScreen', () => {
  it('lists pending requests first and approves with one tap', async () => {
    serve()
    renderAdmin()
    const tabs = await screen.findByRole('tablist')
    expect(within(tabs).getByRole('tab', { selected: true }).textContent).toContain('Wartend')
    expect(await screen.findByText('Anna')).toBeTruthy()
    expect(screen.queryByText('Tom')).toBeNull() // approved: other tab

    fireEvent.click(screen.getByRole('button', { name: /freischalten/i }))
    await waitFor(() => expect(calls).toEqual(['2:approve']))
    await waitFor(() => expect(screen.queryByText('Anna')).toBeNull())
    expect(await screen.findByText('Anna ist freigeschaltet')).toBeTruthy()
  })

  it('undo restores the previous status', async () => {
    serve()
    renderAdmin()
    fireEvent.click(await screen.findByRole('button', { name: /freischalten/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Rückgängig' }))
    await waitFor(() => expect(calls).toEqual(['2:approve', '2:reset']))
    expect(await screen.findByText('Anna')).toBeTruthy()
  })

  it('shows approved accounts with a block action in their tab', async () => {
    serve()
    renderAdmin()
    fireEvent.click(await screen.findByRole('tab', { name: /freigeschaltet/i }))
    expect(await screen.findByText('Tom')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /sperren/i }))
    await waitFor(() => expect(calls).toEqual(['3:block']))
  })
})
