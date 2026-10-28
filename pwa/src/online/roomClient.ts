/**
 * One live connection to a room: reconnects on its own (backoff 0.5 s … 8 s),
 * keeps the clock offset to the server, and holds intents through a short
 * drop (QUEUE_MAX_AGE_MS) — an older tap belongs to a game that has moved on.
 * Snapshots are never queued — only the latest state matters.
 */
import { medianOffset, type ClockSample } from './clock'
import type { AudioCue, Intent, ServerMessage, Snapshot } from './protocol'

/** A tap sent while offline is only delivered if the connection is back within this time. */
export const QUEUE_MAX_AGE_MS = 3000

export type Connection = 'connecting' | 'open' | 'closed'

export interface RoomClientHandlers {
  onMessage: (msg: ServerMessage) => void
  onConnection: (state: Connection) => void
}

const PING_EVERY_MS = 5000
const SAMPLES = 5
const MAX_BACKOFF_MS = 8000

export class RoomClient {
  private ws: WebSocket | null = null
  private stopped = false
  private backoff = 500
  private retry: number | undefined
  private pinger: number | undefined
  private samples: ClockSample[] = []
  private queue: { raw: string; at: number }[] = []
  /** Server ms − local ms. */
  offset = 0

  constructor(
    private code: string,
    private handlers: RoomClientHandlers,
    private makeSocket: (url: string) => WebSocket = (url) => new WebSocket(url)
  ) {}

  private url(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/api/rooms/${encodeURIComponent(this.code)}/ws`
  }

  connect(): void {
    this.stopped = false
    this.handlers.onConnection('connecting')
    const ws = this.makeSocket(this.url())
    this.ws = ws
    ws.onopen = () => {
      this.backoff = 500
      this.handlers.onConnection('open')
      const fresh = Date.now() - QUEUE_MAX_AGE_MS
      for (const q of this.queue.splice(0)) if (q.at >= fresh) ws.send(q.raw)
      this.ping()
      window.clearInterval(this.pinger)
      this.pinger = window.setInterval(() => this.ping(), PING_EVERY_MS)
    }
    ws.onmessage = (ev) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(String(ev.data)) as ServerMessage
      } catch {
        return
      }
      if (msg.type === 'pong') {
        this.samples = [...this.samples, { sent: msg.t, received: Date.now(), server: msg.server }].slice(-SAMPLES)
        this.offset = medianOffset(this.samples)
        return
      }
      this.handlers.onMessage(msg)
    }
    ws.onclose = (ev) => {
      window.clearInterval(this.pinger)
      if (this.ws !== ws) return
      this.ws = null
      // 4001 = not allowed, 4003 = removed / room closed: don't hammer the server
      if (this.stopped || ev.code === 4001 || ev.code === 4003) {
        this.handlers.onConnection('closed')
        if (!this.stopped && ev.code !== 4000) this.handlers.onMessage({ type: 'closed', reason: ev.reason || 'closed' })
        return
      }
      if (ev.code === 4000) return // replaced by a newer connection of the same seat
      this.handlers.onConnection('connecting')
      this.retry = window.setTimeout(() => this.connect(), this.backoff)
      this.backoff = Math.min(MAX_BACKOFF_MS, this.backoff * 2)
    }
  }

  close(): void {
    this.stopped = true
    window.clearTimeout(this.retry)
    window.clearInterval(this.pinger)
    this.ws?.close()
    this.ws = null
  }

  private send(raw: string, queueIfOffline: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(raw)
    else if (queueIfOffline) this.queue = [...this.queue, { raw, at: Date.now() }].slice(-5)
  }

  private ping(): void {
    this.send(JSON.stringify({ type: 'ping', t: Date.now() }), false)
  }

  sendIntent(intent: Intent): void {
    this.send(JSON.stringify({ type: 'intent', ...intent }), true)
  }

  sendState(snapshot: Snapshot): void {
    this.send(JSON.stringify({ type: 'state', snapshot }), false)
  }

  sendAudio(cue: Omit<AudioCue, 'at'>): void {
    this.send(JSON.stringify({ type: 'audio', ...cue }), false)
  }
}
