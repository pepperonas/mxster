/**
 * Pure helpers for the admin statistics: the catalogue's spread over the years
 * and the server's totals turned into chart rows.
 */
import type { Song } from '@/types'

export interface ServerStats {
  today: string
  accounts: {
    approved: number
    pending: number
    rejected: number
    blocked: number
    google: number
    email: number
    active7: number
    active30: number
    signupsPerWeek: { week: string; count: number }[]
  }
  activity: { perDay: { day: string; count: number }[]; since: string | null }
  rounds: {
    total: number
    perDay: { day: string; count: number }[]
    hours: number[]
    weekdays: number[]
    modes: Record<string, number>
    avgPeople: number
    avgMinutes: number
    withBots: number
    teams: number
    daily: number
    /** song id → [tries, right] (first cards left out). */
    songs: Record<string, [number, number]>
    first: string | null
  }
  dailyPerDay: { day: string; count: number }[]
  achievements: Record<string, number>
  social: { friendships: number; openRooms: number; openReports: number }
}

/** What every player sees (GET /api/stats/all): the game's totals, no accounts, no times of day. */
export interface GroupStatsData {
  today: string
  rounds: Omit<ServerStats['rounds'], 'hours' | 'weekdays'>
  dailyPerDay: ServerStats['dailyPerDay']
  achievements: ServerStats['achievements']
}

/** Songs per year, every year from the first to the last (empty years included). */
export function songsPerYear(songs: Pick<Song, 'year'>[]): { year: number; count: number }[] {
  if (songs.length === 0) return []
  const counts = new Map<number, number>()
  for (const s of songs) counts.set(s.year, (counts.get(s.year) ?? 0) + 1)
  const years = [...counts.keys()]
  const from = Math.min(...years)
  const to = Math.max(...years)
  const out: { year: number; count: number }[] = []
  for (let y = from; y <= to; y++) out.push({ year: y, count: counts.get(y) ?? 0 })
  return out
}

/** Songs per decade, oldest first. */
export function songsPerDecade(songs: Pick<Song, 'year'>[]): { decade: number; count: number }[] {
  const counts = new Map<number, number>()
  for (const s of songs) {
    const d = Math.floor(s.year / 10) * 10
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([decade, count]) => ({ decade, count }))
}

/** Tick keys: the first year of every decade in the range. */
/** Axis labels: every decade, plus the first year when it is not crammed against the next decade. */
export const TICK_GAP = 8
export function decadeTicks(years: number[]): string[] {
  const decades = years.map((y, i) => ({ y, i })).filter(({ y }) => y % 10 === 0)
  const first = years.length > 0 && years[0] % 10 !== 0 && (decades[0]?.i ?? Infinity) >= TICK_GAP ? [years[0]] : []
  return [...first, ...decades.map(({ y }) => y)].map(String)
}

export interface SongPlay {
  id: string
  tries: number
  right: number
  rate: number
}

/** Songs with at least `min` tries, as rows with their hit rate. */
export function songPlays(songs: Record<string, [number, number]>, min = 1): SongPlay[] {
  return Object.entries(songs)
    .filter(([, [tries]]) => tries >= min)
    .map(([id, [tries, right]]) => ({ id, tries, right, rate: tries > 0 ? right / tries : 0 }))
}

/** Most drawn first; ties by id for a stable order. */
export function mostPlayed(plays: SongPlay[], n: number): SongPlay[] {
  return [...plays].sort((a, b) => b.tries - a.tries || a.id.localeCompare(b.id)).slice(0, n)
}

/** Lowest (or highest) hit rate among songs with at least 3 tries; more tries first on a tie. */
export function byRate(plays: SongPlay[], n: number, hardest: boolean): SongPlay[] {
  return plays
    .filter((p) => p.tries >= 3)
    .sort((a, b) => (hardest ? a.rate - b.rate : b.rate - a.rate) || b.tries - a.tries || a.id.localeCompare(b.id))
    .slice(0, n)
}

/** Index of the largest value (the first one on a tie), or -1 when all are zero. */
export function peak(values: number[]): number {
  let best = -1
  values.forEach((v, i) => {
    if (v > 0 && (best === -1 || v > values[best])) best = i
  })
  return best
}
