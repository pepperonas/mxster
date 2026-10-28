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
