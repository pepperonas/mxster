/**
 * TV mode: a screen joins a running round too, a round on one device can be
 * mirrored to a TV (the round stays local), /tv takes a typed code.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts'
import { gameReducer, initialState } from '@/contexts/GameContext'
import { mirrorFix } from '../useHostBridge'
import { isRoomPath } from '@/auth/AuthGate'
import { navKind } from '@/navigation/navDirection'
import type { RoomInfo } from '../protocol'

const read = vi.fn()
vi.mock('../roomApi', () => ({ roomApi: { read: (c: string) => read(c), join: vi.fn() }, roomLink: (c: string) => `/r/${c}` }))
vi.mock('@/auth/AuthContext', async (orig) => ({
  ...(await orig<typeof import('@/auth/AuthContext')>()),
  useAuth: () => ({ state: { kind: 'anonymous' }, refresh: async () => {}, logout: async () => {} })
}))
const { TvScreen } = await import('@/screens/TvScreen')
const { JoinScreen } = await import('@/screens/JoinScreen')

let where = ''
function Where() {
  const l = useLocation()
  where = l.pathname + l.search
  return null
}
const at = (path: string, ui: React.ReactNode, route: string) =>
  render(
    <MotionTestProvider>
      <AppProviders>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={route} element={ui} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    </MotionTestProvider>
  )

describe('the round remembers its TV', () => {
  it('a rematch keeps the TV, a new round drops it', () => {
    const on = gameReducer({ ...initialState, isGameStarted: true }, { type: 'SET_TV_ROOM', payload: 'ABCD2345' })
    expect(on.tvRoom).toBe('ABCD2345')
    expect(gameReducer(on, { type: 'REMATCH' } as never).tvRoom).toBe('ABCD2345')
    expect(gameReducer(on, { type: 'RESET_GAME' }).tvRoom).toBeNull()
  })
})

describe('what the TV receives from a mirrored round', () => {
  it('the TV sees an online round (it never saves it), without the phone\'s TV link', () => {
    const g = mirrorFix({ tvRoom: 'ABCD2345', onlineRoom: null, finished: false }, 'ABCD2345')
    expect(g.onlineRoom).toBe('ABCD2345')
    expect(g.tvRoom).toBeNull()
  })
  it('an online room is left alone', () => {
    const g = { onlineRoom: 'X', finished: false }
    expect(mirrorFix(g, null)).toBe(g)
  })
})

beforeEach(() => {
  where = ''
})

describe('/tv', () => {
  it('is open to everyone and a full-screen page', () => {
    expect(isRoomPath('/tv')).toBe(true)
    expect(isRoomPath('/tv/')).toBe(true)
    expect(isRoomPath('/tvx')).toBe(false)
    expect(navKind('/', '/tv')).toBe('up')
  })

  it('a typed code (any case, with a dash, O for 0) opens the room as a screen', () => {
    at('/tv', <TvScreen />, '/tv')
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'abcd-23o5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verbinden' }))
    expect(where).toBe('/r/ABCD2305?screen=1')
  })

  it('a wrong code says so and goes nowhere', () => {
    at('/tv', <TvScreen />, '/tv')
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'ABCD-23!5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verbinden' }))
    expect(screen.getByRole('alert').textContent).toContain('8 Zeichen')
    expect(where).not.toContain('/r/')
  })
})

describe('joining a running round', () => {
  const room = (status: RoomInfo['status']) =>
    ({ code: 'ABCD2345', status, music: 'room', host: { name: 'Martin' }, members: [{ seat: 0, name: 'Martin' }], me: null, options: {} }) as unknown as RoomInfo
  beforeEach(() => read.mockReset())

  it('a screen may still join: only the screen choice is offered', async () => {
    read.mockResolvedValue(room('running'))
    at('/r/ABCD2345', <JoinScreen />, '/r/:code')
    await waitFor(() => expect(document.querySelector('[data-join-running]')).not.toBeNull())
    expect(screen.getByRole('button', { name: /Bildschirm/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /als Spieler|mitspielen/i })).toBeNull()
  })

  it('a finished round stays closed', async () => {
    read.mockResolvedValue(room('finished'))
    at('/r/ABCD2345', <JoinScreen />, '/r/:code')
    await waitFor(() => expect(document.querySelector('[data-join-running]')).toBeNull())
    await waitFor(() => expect(screen.queryByRole('button', { name: /Bildschirm/ })).toBeNull())
  })
})
