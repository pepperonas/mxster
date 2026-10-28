import type { Song } from '@/types'

/**
 * Album cover of a song, self-hosted next to the MP3s (`/audio/covers/<id>.jpg`)
 * and gated like them by nginx. Same-origin, so the session cookie travels.
 */
export function coverSrc(song: Pick<Song, 'id'>): string {
  return `/audio/covers/${song.id}.jpg`
}

/** The songs of a stored round in play order (from the turn log; older rounds: from the timelines). */
export function roundSongIds(entry: { turns?: { s: string }[]; players: { timeline: { id: string }[] }[] }): string[] {
  const out: string[] = []
  const add = (id: string) => {
    if (id && !out.includes(id)) out.push(id)
  }
  for (const t of entry.turns ?? []) add(t.s)
  if (out.length === 0) for (const p of entry.players) for (const s of p.timeline) add(s.id)
  return out
}
