import { describe, it, expect, vi, afterEach } from 'vitest'
import { RoomClient, QUEUE_MAX_AGE_MS } from '../roomClient'

class FakeSocket {
  static last: FakeSocket
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    FakeSocket.last = this
  }
  send(raw: string) {
    this.sent.push(raw)
  }
  close() {}
  open() {
    this.readyState = 1
    this.onopen?.()
  }
}

afterEach(() => vi.useRealTimers())

const client = () =>
  new RoomClient('ABCD1234', { onMessage: () => {}, onConnection: () => {} } as never, () => new FakeSocket() as unknown as WebSocket)

const intents = (s: FakeSocket) => s.sent.map((r) => JSON.parse(r)).filter((m) => m.type === 'intent').map((m) => m.action)

describe('taps while the connection is down', () => {
  it('arrive when it is back quickly', () => {
    vi.useFakeTimers()
    const c = client()
    c.connect()
    c.sendIntent({ action: 'reveal' } as never)
    vi.advanceTimersByTime(QUEUE_MAX_AGE_MS - 500)
    FakeSocket.last.open()
    expect(intents(FakeSocket.last)).toEqual(['reveal'])
  })

  it('are dropped once the game has had time to move on', () => {
    vi.useFakeTimers()
    const c = client()
    c.connect()
    c.sendIntent({ action: 'challenge' } as never)
    vi.advanceTimersByTime(QUEUE_MAX_AGE_MS + 500)
    FakeSocket.last.open()
    expect(intents(FakeSocket.last)).toEqual([])
  })
})

type CloseEv = { code: number; reason?: string }
const watched = () => {
  const states: string[] = []
  const messages: unknown[] = []
  let sockets = 0
  const c = new RoomClient(
    'ABCD1234',
    { onMessage: (m: unknown) => messages.push(m), onConnection: (s: string) => states.push(s) } as never,
    () => {
      sockets++
      return new FakeSocket() as unknown as WebSocket
    }
  )
  const close = (ev: CloseEv) => (FakeSocket.last.onclose as unknown as (e: CloseEv) => void)(ev)
  return { c, states, messages, close, sockets: () => sockets }
}

describe('when the connection ends', () => {
  it('reconnects after a drop, with growing pauses', () => {
    vi.useFakeTimers()
    const w = watched()
    w.c.connect()
    FakeSocket.last.open()
    w.close({ code: 1006 })
    expect(w.states.slice(-1)).toEqual(['connecting'])
    vi.advanceTimersByTime(10_000)
    expect(w.sockets()).toBe(2)
  })

  it('says so when another tab took the seat, and does not fight back', () => {
    vi.useFakeTimers()
    const w = watched()
    w.c.connect()
    FakeSocket.last.open()
    w.close({ code: 4000, reason: 'replaced' })
    expect(w.states.slice(-1)).toEqual(['closed'])
    expect(w.messages).toContainEqual({ type: 'closed', reason: 'replaced' })
    vi.advanceTimersByTime(60_000)
    expect(w.sockets()).toBe(1)
  })

  it('stops for good when removed or the room closed, passing the reason on', () => {
    vi.useFakeTimers()
    const w = watched()
    w.c.connect()
    FakeSocket.last.open()
    w.close({ code: 4003, reason: 'kicked' })
    expect(w.states.slice(-1)).toEqual(['closed'])
    expect(w.messages).toContainEqual({ type: 'closed', reason: 'kicked' })
    vi.advanceTimersByTime(60_000)
    expect(w.sockets()).toBe(1)
  })

  it('stays quiet after its own close', () => {
    vi.useFakeTimers()
    const w = watched()
    w.c.connect()
    FakeSocket.last.open()
    const socket = FakeSocket.last
    w.c.close()
    ;(socket.onclose as unknown as (e: CloseEv) => void)({ code: 1000 })
    expect(w.messages).toEqual([])
    vi.advanceTimersByTime(60_000)
    expect(w.sockets()).toBe(1)
  })
})
