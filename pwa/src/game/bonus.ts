/**
 * Bonus round option (timeline modes): the card stays face down — title and
 * artist hidden — until it is revealed. Whoever places it may name title and
 * artist; both right earns a joker. A joker swaps a song you would rather not
 * place (draw another one). Pure rules; the flow lives in useTurnFlow.
 */
import type { Player, Song } from '@/types'
import { answerMatches } from './answerMatch'

export const MAX_JOKERS = 3
/** Typed names are cut to this length (they cross devices online). */
export const NAME_MAX = 120

export interface Naming {
  title: string
  artist: string
}

export interface NamingResult extends Naming {
  titleOk: boolean
  artistOk: boolean
  /** Both right and room for another joker. */
  earned: boolean
}

export function cleanNaming(v: unknown): Naming | null {
  if (!v || typeof v !== 'object') return null
  const n = v as Record<string, unknown>
  const title = typeof n.title === 'string' ? n.title.trim().slice(0, NAME_MAX) : ''
  const artist = typeof n.artist === 'string' ? n.artist.trim().slice(0, NAME_MAX) : ''
  return title || artist ? { title, artist } : null
}

export function judgeNaming(song: Song, naming: Naming, jokers: number): NamingResult {
  const titleOk = Boolean(naming.title) && answerMatches(naming.title, song.title, 'title')
  const artistOk = Boolean(naming.artist) && answerMatches(naming.artist, song.artist, 'artist')
  return { ...naming, titleOk, artistOk, earned: titleOk && artistOk && jokers < MAX_JOKERS }
}

export function jokersOf(player: Player | undefined): number {
  return player?.jokers ?? 0
}

/** The song as the table sees it before the reveal: title and artist hidden. */
export function concealed(song: Song, title: string, artist: string): Song {
  return { ...song, title, artist }
}
