/**
 * Which song comes next (pure).
 *
 * - The round can be limited to decades; an empty selection means all songs.
 * - Songs played in recent rounds (`recent`, oldest first, kept per account)
 *   are avoided while fresh ones are left; after that the longest-unplayed
 *   songs come back first.
 * - A song never repeats within a round (`played`).
 * - If the chosen decades run dry mid-round (long game, tiebreak), the pool
 *   widens to all songs instead of stopping the game; `widened` tells the UI.
 */
import type { Song } from '@/types'

export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const

/** How many recently played songs an account remembers. */
export const RECENT_LIMIT = 150

export function songKey(song: Song): string {
  return song.spotifyId || song.id
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

export function decadeLabel(decade: number): string {
  return `${String(decade).slice(2)}er`
}

/** Songs of the chosen decades (all songs when none is chosen). */
export function songPool(all: Song[], decades: readonly number[]): Song[] {
  if (decades.length === 0) return all
  return all.filter((s) => decades.includes(decadeOf(s.year)))
}

export function countByDecade(all: Song[]): Record<number, number> {
  const out: Record<number, number> = {}
  for (const s of all) out[decadeOf(s.year)] = (out[decadeOf(s.year)] ?? 0) + 1
  return out
}

export interface Draw {
  song: Song | null
  /** The chosen decades were used up; the song comes from outside them. */
  widened: boolean
}

export function pickSong(
  all: Song[],
  decades: readonly number[],
  played: readonly string[],
  recent: readonly string[],
  rand: () => number = Math.random
): Draw {
  const unplayed = (list: Song[]) => list.filter((s) => !played.includes(songKey(s)))
  const inPool = unplayed(songPool(all, decades))
  if (inPool.length > 0) return { song: preferFresh(inPool, recent, rand), widened: false }
  const anywhere = unplayed(all)
  if (anywhere.length > 0) return { song: preferFresh(anywhere, recent, rand), widened: decades.length > 0 }
  return { song: null, widened: false }
}

function preferFresh(candidates: Song[], recent: readonly string[], rand: () => number): Song {
  const fresh = candidates.filter((s) => !recent.includes(songKey(s)))
  if (fresh.length > 0) return fresh[Math.floor(rand() * fresh.length)]
  // Everything was played lately: take one of the longest-unplayed third
  const byAge = [...candidates].sort((a, b) => recent.indexOf(songKey(a)) - recent.indexOf(songKey(b)))
  const oldest = byAge.slice(0, Math.max(1, Math.ceil(byAge.length / 3)))
  return oldest[Math.floor(rand() * oldest.length)]
}

/** Remember a played song: moved to the end, list capped at RECENT_LIMIT. */
export function rememberSong(recent: readonly string[], key: string): string[] {
  const next = recent.filter((k) => k !== key)
  next.push(key)
  return next.slice(-RECENT_LIMIT)
}
