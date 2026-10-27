/**
 * The running round on this device (localStorage). Written on every change of
 * the game state, read once when the app starts — a reload or a closed tab
 * resumes the round exactly where it stood. Rounds older than MAX_AGE_MS and
 * snapshots of another format are dropped.
 */
const KEY = 'mxster_running_game'
const FORMAT = 1
export const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

interface Envelope<T> {
  format: number
  savedAt: number
  state: T
}

export function saveGame<T>(state: T, now = Date.now()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ format: FORMAT, savedAt: now, state } satisfies Envelope<T>))
  } catch {
    /* storage full or blocked: the round just won't survive a reload */
  }
}

export function loadSavedGame<T>(now = Date.now()): T | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const env = JSON.parse(raw) as Envelope<T>
    if (env.format !== FORMAT || typeof env.savedAt !== 'number' || now - env.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return env.state
  } catch {
    return null
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
