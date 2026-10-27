import type { Song } from '@/types'

/**
 * Album cover of a song, self-hosted next to the MP3s (`/audio/covers/<id>.jpg`)
 * and gated like them by nginx. Same-origin, so the session cookie travels.
 */
export function coverSrc(song: Pick<Song, 'id'>): string {
  return `/audio/covers/${song.id}.jpg`
}
