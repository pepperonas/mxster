/**
 * Which song comes next (pure).
 *
 * - The round can be limited to decades; an empty selection means all songs.
 * - Exotics (little-known tracks, `song.exotic`) are left out unless the
 *   round allows them.
 * - Songs played in recent rounds (`recent`, oldest first, kept per account)
 *   are avoided while fresh ones are left; after that the longest-unplayed
 *   songs come back first.
 * - A song never repeats within a round (`played`).
 * - If the chosen decades run dry mid-round (long game, tiebreak), the pool
 *   widens to all decades instead of stopping the game; `widened` tells the UI.
 *   Exotics are the very last resort, after every well-known song is used up.
 * - When even those are gone (a very long tiebreak), songs played earlier in
 *   the round come back — never one of the last few, so nothing repeats at
 *   once. A round can always go on.
 */
import type { Song } from '@/types'
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'

export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const

/** Genre groups a round can be limited to (song.genre is finer). */
export const GENRE_GROUPS = ['pop', 'rock', 'soul', 'hiphop', 'electronic', 'other'] as const
export type GenreGroup = (typeof GENRE_GROUPS)[number]

export function genreGroup(genre: string | undefined): GenreGroup {
  switch ((genre ?? '').toLowerCase()) {
    case 'pop':
      return 'pop'
    case 'rock':
    case 'metal':
      return 'rock'
    case 'soul':
    case 'r&b':
      return 'soul'
    case 'hip-hop':
      return 'hiphop'
    case 'electronic':
      return 'electronic'
    default:
      return 'other'
  }
}

/** A themed selection: all songs, crowd pleasers, German ones, or a given list. */
export const COLLECTIONS = ['all', 'party', 'german', 'nemesis'] as const
export type Collection = (typeof COLLECTIONS)[number]

/** What else limits a round beyond decades and exotics. */
export interface PoolTheme {
  genres?: readonly string[]
  collection?: Collection
  /** Only these songs (collection "nemesis": the group's misses). */
  songIds?: readonly string[] | null
}

export function themeActive(theme: PoolTheme | undefined): boolean {
  return Boolean(theme && ((theme.genres?.length ?? 0) > 0 || (theme.collection && theme.collection !== 'all')))
}

function inTheme(song: Song, theme: PoolTheme | undefined): boolean {
  if (!theme) return true
  if (theme.genres && theme.genres.length > 0 && !theme.genres.includes(genreGroup(song.genre))) return false
  switch (theme.collection) {
    case 'party':
      return Boolean(song.party)
    case 'german':
      return Boolean(song.german)
    case 'nemesis':
      return Boolean(theme.songIds?.includes(song.id))
    default:
      return true
  }
}

/** How many recently played songs an account remembers. */
export const RECENT_LIMIT = 150

export function songKey(song: Song): string {
  return song.spotifyId || song.id
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

export function decadeLabel(decade: number): string {
  return msg(modesText).decade(String(decade).slice(2))
}

/** The songs a round draws from: exotics only when allowed. */
export function catalogue(all: Song[], exotics: boolean): Song[] {
  return exotics ? all : all.filter((s) => !s.exotic)
}

/** Songs of the chosen decades (all songs when none is chosen) and theme. */
export function songPool(all: Song[], decades: readonly number[], exotics = true, theme?: PoolTheme): Song[] {
  // A themed selection names its songs on purpose: exotics in it count
  const base = theme?.collection === 'nemesis' ? all : catalogue(all, exotics)
  return base.filter((s) => (decades.length === 0 || decades.includes(decadeOf(s.year))) && inTheme(s, theme))
}

export function countByDecade(all: Song[], exotics = true): Record<number, number> {
  all = catalogue(all, exotics)
  const out: Record<number, number> = {}
  for (const s of all) out[decadeOf(s.year)] = (out[decadeOf(s.year)] ?? 0) + 1
  return out
}

export interface Draw {
  song: Song | null
  /** The chosen decades were used up; the song comes from outside them. */
  widened: boolean
  /** Every song was played this round; this one comes round a second time. */
  replayed?: boolean
}

/** A replayed song is never one of the last this many songs of the round. */
export const REPLAY_GAP = 20

export function pickSong(
  all: Song[],
  decades: readonly number[],
  played: readonly string[],
  recent: readonly string[],
  rand: () => number = Math.random,
  exotics = true,
  theme?: PoolTheme
): Draw {
  const unplayed = (list: Song[]) => list.filter((s) => !played.includes(songKey(s)))
  const inPool = unplayed(songPool(all, decades, exotics, theme))
  if (inPool.length > 0) return { song: preferFresh(inPool, recent, rand), widened: false }
  const anywhere = unplayed(catalogue(all, exotics))
  if (anywhere.length > 0) return { song: preferFresh(anywhere, recent, rand), widened: decades.length > 0 || themeActive(theme) }
  // Every well-known song is used up: exotics keep the round going
  const last = unplayed(all)
  if (last.length > 0) return { song: preferFresh(last, recent, rand), widened: true }
  // Everything was played this round: bring back the songs played longest ago
  const again = catalogue(all, exotics).length > 0 ? catalogue(all, exotics) : all
  if (again.length === 0) return { song: null, widened: false }
  const keepOut = new Set(played.slice(-Math.min(REPLAY_GAP, Math.floor(again.length / 2))))
  const back = again.filter((s) => !keepOut.has(songKey(s)))
  const pool = back.length > 0 ? back : again
  return { song: pool[Math.floor(rand() * pool.length)], widened: true, replayed: true }
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
