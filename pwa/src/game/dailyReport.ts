/**
 * Books each song of today's round on the server as soon as it is decided, so
 * a paused run continues on any device and cannot be started again.
 * Reports go out one after the other (the server only takes the next song);
 * a network error is retried a few times. The server accepts the same song
 * again with the same verdict, so a retry never counts twice.
 */
import { api, ApiError } from '@/api/client'

const RETRIES = [1000, 3000, 8000]
let chain: Promise<unknown> = Promise.resolve()

export function reportDailyTurn(day: string, index: number, ok: boolean, onFailed?: () => void): Promise<unknown> {
  const send = async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await api(`/api/daily/${day}/turn`, { method: 'POST', json: { index, ok } })
      } catch (e) {
        // A refusal (409) will not change by trying again
        if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
          onFailed?.()
          return null
        }
        if (attempt >= RETRIES.length) {
          onFailed?.()
          return null
        }
        await new Promise((r) => setTimeout(r, RETRIES[attempt]))
      }
    }
  }
  chain = chain.then(send, send)
  return chain
}
