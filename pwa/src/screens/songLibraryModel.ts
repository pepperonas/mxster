/**
 * The song library as numbers (pure, tested): a search index, a forgiving
 * search, sorting and filters. The page (SongLibraryScreen) only renders.
 *
 * Search: the query is split into words, normalised like the answers in the
 * game (answerWords: case, accents, "The", "&", number words), and every word
 * must be found in the title, the artist or the album — whole, as the start of
 * a word, inside the text, or with a typo (a little more forgiving than when
 * answers are judged: a search box should find, not judge; spelled-out
 * umlauts "oe/ae/ue" are tried as "o/a/u" too).
 * "1984" keeps that year, "80er"/"80s"/"1980s" that decade. Results are
 * ranked: exact before start-of-word before inside before typo, title and
 * artist before album.
 */
import type { Song } from '@/types'
import { answerWords, levenshteinDistance } from '@/utils/textMatcher'
import { genreGroup, type GenreGroup } from '@/game/songPool'

export interface IndexedSong {
  song: Song
  /** Words per field: 0 title, 1 artist, 2 album. */
  words: [string[], string[], string[]]
  /** Words joined, per field (for "acdc" in "ac/dc", "aha" in "a-ha"). */
  joined: [string, string, string]
  number: number
}

export function indexSongs(songs: readonly Song[]): IndexedSong[] {
  return songs.map((song) => {
    const words = [answerWords(song.title), answerWords(song.artist), answerWords(song.album ?? '')] as IndexedSong['words']
    return {
      song,
      words,
      joined: words.map((w) => w.join('')) as IndexedSong['joined'],
      number: Number(/\d+/.exec(song.id)?.[0] ?? 0)
    }
  })
}

export interface Query {
  words: string[]
  year: number | null
  decade: number | null
}

/** "queen 80er" → words ["queen"], decade 1980. */
export function parseQuery(raw: string): Query {
  let year: number | null = null
  let decade: number | null = null
  const rest: string[] = []
  for (const part of raw.trim().split(/\s+/).filter(Boolean)) {
    const p = part.toLowerCase().replace(/[’']/g, '')
    let m: RegExpExecArray | null
    if ((m = /^(19[5-9]\d|20[0-2]\d)$/.exec(p))) year = Number(m[1])
    else if ((m = /^(19|20)?([0-9])0(er|s)$/.exec(p))) decade = (m[1] ? Number(m[1]) * 100 : Number(m[2]) >= 5 ? 1900 : 2000) + Number(m[2]) * 10
    else rest.push(part)
  }
  return { words: rest.length ? answerWords(rest.join(' ')) : [], year, decade }
}

/** Typos a search word may carry: none below 4 letters, then 1, 2, 3. */
export function searchTypos(length: number): number {
  return length < 4 ? 0 : length < 7 ? 1 : length < 11 ? 2 : 3
}

/** "groenemeyer" → "gronemeyer": the index holds umlauts without their dots. */
function foldUmlauts(word: string): string {
  return word.replace(/oe/g, 'o').replace(/ae/g, 'a').replace(/ue/g, 'u')
}

/** How well one query word fits one field (lower is better, null = not at all). */
function fieldFit(q: string, words: string[], joined: string): number | null {
  const plain = wordFit(q, words, joined)
  const folded = foldUmlauts(q)
  if (folded === q) return plain
  const alt = wordFit(folded, words, joined)
  return plain === null ? alt : alt === null ? plain : Math.min(plain, alt)
}

function wordFit(q: string, words: string[], joined: string): number | null {
  if (!q) return 0
  if (words.includes(q)) return 0
  if (words.some((w) => w.startsWith(q))) return 1
  if (q.length >= 2 && joined.includes(q)) return 2
  const typos = searchTypos(q.length)
  if (typos > 0) {
    for (const w of words) {
      if (levenshteinDistance(q, w) <= typos) return 3
      // still typing: compare with the start of the word
      if (w.length > q.length && levenshteinDistance(q, w.slice(0, q.length)) <= typos) return 3
    }
  }
  return null
}

/** Score of a song for a query (lower is better), or null when it does not match. */
export function matchScore(s: IndexedSong, q: Query): number | null {
  if (q.year !== null && s.song.year !== q.year) return null
  if (q.decade !== null && Math.floor(s.song.year / 10) * 10 !== q.decade) return null
  let score = 0
  for (const word of q.words) {
    let best: number | null = null
    for (let f = 0; f < 3; f++) {
      const fit = fieldFit(word, s.words[f], s.joined[f])
      if (fit === null) continue
      const weighted = fit + (f === 2 ? 0.5 : 0)
      if (best === null || weighted < best) best = weighted
    }
    if (best === null) return null
    score += best
  }
  return score
}

export interface Hit {
  item: IndexedSong
  score: number
}

export function searchSongs(index: readonly IndexedSong[], raw: string): Hit[] {
  const q = parseQuery(raw)
  const hits: Hit[] = []
  for (const item of index) {
    const score = matchScore(item, q)
    if (score !== null) hits.push({ item, score })
  }
  return hits
}

/** Nothing found: the closest title or artist, for "Did you mean …?" (or null). */
export function suggestion(index: readonly IndexedSong[], raw: string): string | null {
  const q = answerWords(raw).join('')
  if (q.length < 3) return null
  let best: { text: string; d: number } | null = null
  for (const { song, joined } of index)
    for (const [f, text] of [
      [0, song.title],
      [1, song.artist]
    ] as const) {
      const d = levenshteinDistance(q, joined[f])
      if (!best || d < best.d) best = { text, d }
    }
  return best && best.d <= Math.max(2, Math.round(q.length * 0.4)) ? best.text : null
}

export const SORT_KEYS = ['relevance', 'year', 'title', 'artist', 'album', 'added', 'rate'] as const
export type SortKey = (typeof SORT_KEYS)[number]
export type SortDir = 'asc' | 'desc'

export type Rates = ReadonlyMap<string, { tries: number; right: number }>

/** Artist without a leading article, for sorting ("The Beatles" under B). */
export function sortName(text: string): string {
  return text.replace(/^(the|die|der|das|les|la|le)\s+/i, '').trim()
}

/**
 * Sorted copy. Songs without the value (no album, never tried) always go last,
 * whatever the direction; ties fall back to year, then title.
 */
export function sortHits(hits: readonly Hit[], key: SortKey, dir: SortDir, rates: Rates, locale: string): Hit[] {
  const sign = dir === 'asc' ? 1 : -1
  const text = (a: string, b: string) => a.localeCompare(b, locale, { sensitivity: 'base', numeric: true })
  const rateOf = (h: Hit) => {
    const r = rates.get(h.item.song.id)
    return r && r.tries > 0 ? r.right / r.tries : null
  }
  const tie = (a: Hit, b: Hit) => a.item.song.year - b.item.song.year || text(a.item.song.title, b.item.song.title)
  return [...hits].sort((a, b) => {
    const A = a.item.song
    const B = b.item.song
    switch (key) {
      case 'relevance':
        return a.score - b.score || tie(a, b)
      case 'year':
        return sign * (A.year - B.year) || text(A.artist, B.artist) || text(A.title, B.title)
      case 'title':
        return sign * text(A.title, B.title) || tie(a, b)
      case 'artist':
        return sign * text(sortName(A.artist), sortName(B.artist)) || tie(a, b)
      case 'album': {
        if (!A.album !== !B.album) return A.album ? -1 : 1
        return sign * text(A.album ?? '', B.album ?? '') || tie(a, b)
      }
      case 'added':
        return sign * (a.item.number - b.item.number)
      case 'rate': {
        const ra = rateOf(a)
        const rb = rateOf(b)
        if ((ra === null) !== (rb === null)) return ra === null ? 1 : -1
        return sign * ((ra ?? 0) - (rb ?? 0)) || tie(a, b)
      }
    }
  })
}

export type Collection = 'all' | 'party' | 'german'

export interface Filters {
  decades: readonly number[]
  genres: readonly GenreGroup[]
  collection: Collection
  exotics: boolean
}

export const NO_FILTERS: Filters = { decades: [], genres: [], collection: 'all', exotics: true }

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

export function passes(song: Song, f: Filters): boolean {
  if (f.decades.length && !f.decades.includes(decadeOf(song.year))) return false
  if (f.genres.length && !f.genres.includes(genreGroup(song.genre))) return false
  if (f.collection === 'party' && !song.party) return false
  if (f.collection === 'german' && !song.german) return false
  if (!f.exotics && song.exotic) return false
  return true
}

/** Runs of the same decade, in the given order (for section heads when sorted by year). */
export function decadeSections<T extends { item: IndexedSong }>(hits: readonly T[]): Array<{ decade: number; hits: T[] }> {
  const out: Array<{ decade: number; hits: T[] }> = []
  for (const h of hits) {
    const d = decadeOf(h.item.song.year)
    const last = out[out.length - 1]
    if (last && last.decade === d) last.hits.push(h)
    else out.push({ decade: d, hits: [h] })
  }
  return out
}

// ── Page state in the address (survives reload and the way back) ──────────

export interface LibraryState {
  q: string
  sort: SortKey | null
  dir: SortDir
  filters: Filters
}

export function readState(params: URLSearchParams): LibraryState {
  const sort = params.get('sort')
  const decades = (params.get('dec') ?? '')
    .split(',')
    .map(Number)
    .filter((d) => d >= 1950 && d <= 2020 && d % 10 === 0)
  const genres = (params.get('genre') ?? '').split(',').filter((g): g is GenreGroup => ['pop', 'rock', 'soul', 'hiphop', 'electronic', 'other'].includes(g))
  const col = params.get('col')
  return {
    q: params.get('q') ?? '',
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : null,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
    filters: {
      decades,
      genres,
      collection: col === 'party' || col === 'german' ? col : 'all',
      exotics: params.get('exotics') !== '0'
    }
  }
}

export function writeState(s: LibraryState): URLSearchParams {
  const p = new URLSearchParams()
  if (s.q) p.set('q', s.q)
  if (s.sort) p.set('sort', s.sort)
  if (s.dir === 'desc') p.set('dir', 'desc')
  if (s.filters.decades.length) p.set('dec', s.filters.decades.join(','))
  if (s.filters.genres.length) p.set('genre', s.filters.genres.join(','))
  if (s.filters.collection !== 'all') p.set('col', s.filters.collection)
  if (!s.filters.exotics) p.set('exotics', '0')
  return p
}

/** The sort in effect: the chosen one, else relevance while searching, else year. */
export function effectiveSort(s: Pick<LibraryState, 'q' | 'sort'>): SortKey {
  return s.sort ?? (s.q.trim() ? 'relevance' : 'year')
}
