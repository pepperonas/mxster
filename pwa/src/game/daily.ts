/**
 * Today's round ("Tagesrunde", pure): every account plays the same songs on
 * the same day — a start card plus DAILY_SONGS to place on one's own timeline.
 * The songs come from the date alone (seeded shuffle of the well-known songs),
 * so no server is needed to agree on them; the server keeps one result per
 * account and day (api/daily.py).
 */
import type { Song } from '@/types'

export const DAILY_SONGS = 10
/** The start card plus the songs to place. */
export const DAILY_TOTAL = DAILY_SONGS + 1

/** The device's calendar day, YYYY-MM-DD. */
export function localDay(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** FNV-1a: a stable 32-bit number from the day. */
function seedOf(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: small, fast, good enough to shuffle a song list. */
function random(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Today's songs, in playing order. Well-known songs only, ordered by id first
 * so every device shuffles the same list; years spread out (no two songs from
 * the same year), which makes the round fairer.
 */
export function dailySongs(day: string, all: readonly Song[]): Song[] {
  const pool = all.filter((s) => !s.exotic).sort((a, b) => (a.id < b.id ? -1 : 1))
  const rand = random(seedOf(`mxtape-daily-${day}`))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const out: Song[] = []
  const years = new Set<number>()
  for (const s of pool) {
    if (years.has(s.year)) continue
    years.add(s.year)
    out.push(s)
    if (out.length === DAILY_TOTAL) break
  }
  return out
}

/** Correct placements, the start card not counted (0 … DAILY_SONGS). */
export function dailyScore(cards: number): number {
  return Math.max(0, Math.min(DAILY_SONGS, cards - 1))
}
