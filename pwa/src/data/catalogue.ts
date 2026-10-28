/**
 * The song list the game plays with: the bundled list plus the corrections
 * made in the admin area (a fixed year, a song taken out). Corrections load
 * after sign-in (`useSongOverrides`) and apply to every round at once,
 * without a new build.
 */
import type { Song } from '@/types'
import { songs as bundled } from './songs'

export interface SongOverride {
  year?: number
  blocked?: boolean
}

let overrides: Record<string, SongOverride> = {}
let cache: Song[] | null = null
let byId: Map<string, Song> | null = null

/** Pure: the bundled list with the corrections laid over it. */
export function applyOverrides(list: Song[], o: Record<string, SongOverride>): Song[] {
  const out: Song[] = []
  for (const song of list) {
    const fix = o[song.id]
    if (fix?.blocked) continue
    out.push(fix?.year ? { ...song, year: fix.year } : song)
  }
  return out
}

export function setSongOverrides(next: Record<string, SongOverride>): void {
  overrides = next
  cache = null
  byId = null
}

/** Every song the game may draw (blocked ones left out). */
export function allSongs(): Song[] {
  cache ??= applyOverrides(bundled, overrides)
  return cache
}

/** One song with its corrected year — also a blocked one (a running round may hold it). */
export function songById(id: string): Song | undefined {
  if (!byId) {
    byId = new Map(bundled.map((s) => [s.id, overrides[s.id]?.year ? { ...s, year: overrides[s.id].year! } : s]))
  }
  return byId.get(id)
}

export function currentOverrides(): Record<string, SongOverride> {
  return overrides
}
