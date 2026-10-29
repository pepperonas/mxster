import { describe, it, expect } from 'vitest'
import { songs } from '@/data/songs'
import {
  indexSongs,
  searchSongs,
  sortHits,
  parseQuery,
  passes,
  suggestion,
  decadeSections,
  readState,
  writeState,
  effectiveSort,
  sortName,
  NO_FILTERS,
  type Hit
} from '../songLibraryModel'
import { songRates } from '@/game/stats'
import type { HistoryEntry } from '@/types'

const index = indexSongs(songs)
const titles = (raw: string) => sortHits(searchSongs(index, raw), 'relevance', 'asc', new Map(), 'de').map((h) => h.item.song)
const find = (pred: (s: (typeof songs)[number]) => boolean) => songs.find(pred)!

describe('searching the library', () => {
  it('an empty query keeps every song', () => {
    expect(searchSongs(index, '').length).toBe(songs.length)
    expect(searchSongs(index, '   ').length).toBe(songs.length)
  })

  it('finds by title, artist and album, case and accents ignored', () => {
    const s = find((x) => /bohemian/i.test(x.title))
    expect(titles('bohemian').map((x) => x.id)).toContain(s.id)
    expect(titles('QUEEN').some((x) => x.id === s.id)).toBe(true)
    const withAlbum = find((x) => Boolean(x.album && x.album.length > 6))
    expect(titles(withAlbum.album!).map((x) => x.id)).toContain(withAlbum.id)
  })

  it('forgives typos and spelled-out umlauts, like answers in the game', () => {
    const groen = songs.filter((x) => /Grönemeyer/.test(x.artist))
    expect(groen.length).toBeGreaterThan(0)
    for (const q of ['Grönemyer', 'groenemeyer', 'gronemeier']) expect(titles(q).map((x) => x.id)).toEqual(expect.arrayContaining(groen.map((x) => x.id)))
    // still typing, umlaut spelled out: only works by reading "ae" as "a"
    const aerzte = songs.filter((x) => /Ärzte/.test(x.artist))
    expect(aerzte.length).toBeGreaterThan(0)
    expect(titles('aerzt').map((x) => x.id)).toEqual(expect.arrayContaining(aerzte.map((x) => x.id)))
  })

  it('finds while typing (the start of a word) and across spaces and slashes', () => {
    const acdc = songs.filter((x) => /AC\/DC/.test(x.artist))
    expect(acdc.length).toBeGreaterThan(0)
    for (const q of ['ac dc', 'acdc', 'AC/DC']) expect(titles(q).map((x) => x.id)).toEqual(expect.arrayContaining(acdc.map((x) => x.id)))
    expect(titles('boh').some((x) => /bohemian/i.test(x.title))).toBe(true)
  })

  it('every word must match somewhere', () => {
    expect(titles('queen zzzzzzz')).toEqual([])
  })

  it('a year or a decade in the query filters by it', () => {
    expect(parseQuery('1984')).toMatchObject({ year: 1984, words: [] })
    expect(parseQuery('80er').decade).toBe(1980)
    expect(parseQuery('80s').decade).toBe(1980)
    expect(parseQuery('1990s').decade).toBe(1990)
    expect(parseQuery('00er').decade).toBe(2000)
    expect(titles('1984').every((x) => x.year === 1984)).toBe(true)
    expect(titles('1984').length).toBe(songs.filter((x) => x.year === 1984).length)
    const queen80 = titles('queen 80er')
    expect(queen80.length).toBeGreaterThan(0)
    expect(queen80.every((x) => x.year >= 1980 && x.year < 1990)).toBe(true)
  })

  it('ranks an exact word before a start, before a typo; title and artist before album', () => {
    const fake = (id: string, title: string, artist: string, album = '') => ({ id, title, artist, album, year: 2000, previewUrl: '' }) as never
    const idx = indexSongs([fake('song_1', 'Lovely', 'X'), fake('song_2', 'Love', 'X'), fake('song_3', 'Aaa', 'X', 'Love'), fake('song_4', 'Luve', 'Y')])
    const order = sortHits(searchSongs(idx, 'love'), 'relevance', 'asc', new Map(), 'de').map((h) => h.item.song.id)
    expect(order).toEqual(['song_2', 'song_3', 'song_1', 'song_4'])
  })

  it('nothing found: suggests the closest title or artist', () => {
    expect(suggestion(index, 'Qeeen')).toBe('Queen')
    expect(suggestion(index, 'xq')).toBeNull()
    expect(suggestion(index, 'zzzzzzzzzzzzz')).toBeNull()
  })
})

describe('sorting', () => {
  const all = searchSongs(index, '')
  const ids = (h: Hit[]) => h.map((x) => x.item.song)

  it('by year, both ways', () => {
    const up = ids(sortHits(all, 'year', 'asc', new Map(), 'de'))
    const down = ids(sortHits(all, 'year', 'desc', new Map(), 'de'))
    for (let i = 1; i < up.length; i++) expect(up[i].year).toBeGreaterThanOrEqual(up[i - 1].year)
    for (let i = 1; i < down.length; i++) expect(down[i].year).toBeLessThanOrEqual(down[i - 1].year)
  })

  it('by artist without the article: "The Beatles" under B', () => {
    expect(sortName('The Beatles')).toBe('Beatles')
    expect(sortName('Die Ärzte')).toBe('Ärzte')
    const list = ids(sortHits(all, 'artist', 'asc', new Map(), 'de')).map((s) => sortName(s.artist))
    for (let i = 1; i < list.length; i++) expect(list[i].localeCompare(list[i - 1], 'de', { sensitivity: 'base', numeric: true })).toBeGreaterThanOrEqual(0)
  })

  it('by title, and by number for "recently added"', () => {
    const list = ids(sortHits(all, 'title', 'desc', new Map(), 'de'))
    expect(list[0].title.localeCompare(list[list.length - 1].title, 'de', { sensitivity: 'base' })).toBeGreaterThan(0)
    const added = sortHits(all, 'added', 'desc', new Map(), 'de').map((h) => h.item.number)
    for (let i = 1; i < added.length; i++) expect(added[i]).toBeLessThan(added[i - 1])
  })

  it('songs without the value go last in both directions (no album, never tried)', () => {
    for (const dir of ['asc', 'desc'] as const) {
      const byAlbum = ids(sortHits(all, 'album', dir, new Map(), 'de'))
      const firstMissing = byAlbum.findIndex((s) => !s.album)
      if (firstMissing >= 0) expect(byAlbum.slice(firstMissing).every((s) => !s.album)).toBe(true)
    }
    const a = all[0].item.song.id
    const b = all[1].item.song.id
    const rates = new Map([
      [a, { tries: 4, right: 1 }],
      [b, { tries: 2, right: 2 }]
    ])
    for (const dir of ['asc', 'desc'] as const) {
      const order = ids(sortHits(all, 'rate', dir, rates, 'de')).map((s) => s.id)
      expect(order.slice(0, 2)).toEqual(dir === 'asc' ? [a, b] : [b, a])
    }
  })

  it('searching sorts by relevance unless a sort was chosen; otherwise by year', () => {
    expect(effectiveSort({ q: '', sort: null })).toBe('year')
    expect(effectiveSort({ q: 'queen', sort: null })).toBe('relevance')
    expect(effectiveSort({ q: 'queen', sort: 'title' })).toBe('title')
  })
})

describe('filters, sections and the address', () => {
  it('decades, genre groups, collections and exotics', () => {
    const s = find((x) => x.year >= 1980 && x.year < 1990)
    expect(passes(s, { ...NO_FILTERS, decades: [1980] })).toBe(true)
    expect(passes(s, { ...NO_FILTERS, decades: [1990] })).toBe(false)
    const ex = find((x) => Boolean(x.exotic))
    expect(passes(ex, NO_FILTERS)).toBe(true)
    expect(passes(ex, { ...NO_FILTERS, exotics: false })).toBe(false)
    const party = songs.filter((x) => passes(x, { ...NO_FILTERS, collection: 'party' }))
    expect(party.length).toBe(songs.filter((x) => x.party).length)
    const rock = songs.filter((x) => passes(x, { ...NO_FILTERS, genres: ['rock'] }))
    expect(rock.length).toBeGreaterThan(0)
    expect(rock.every((x) => ['rock', 'metal'].includes((x.genre ?? '').toLowerCase()))).toBe(true)
  })

  it('section heads follow the order: one per run of a decade', () => {
    const sorted = sortHits(searchSongs(index, ''), 'year', 'asc', new Map(), 'de')
    const sections = decadeSections(sorted)
    expect(sections.map((x) => x.decade)).toEqual([...new Set(sorted.map((h) => Math.floor(h.item.song.year / 10) * 10))])
    expect(sections.reduce((n, x) => n + x.hits.length, 0)).toBe(songs.length)
  })

  it('the page state survives a round trip through the address; nonsense is dropped', () => {
    const state = { q: 'queen', sort: 'artist' as const, dir: 'desc' as const, filters: { decades: [1970, 1980], genres: ['rock' as const], collection: 'party' as const, exotics: false } }
    expect(readState(writeState(state))).toEqual(state)
    expect(writeState({ q: '', sort: null, dir: 'asc', filters: NO_FILTERS }).toString()).toBe('')
    const odd = readState(new URLSearchParams('sort=evil&dec=1955,abc,1980&genre=jazz,pop&col=x'))
    expect(odd).toMatchObject({ sort: null, filters: { decades: [1980], genres: ['pop'], collection: 'all', exotics: true } })
  })
})

describe('songRates', () => {
  it('counts tries and right answers per song, first cards left out', () => {
    const game = {
      turns: [
        { s: 'song_001', ok: true, first: true },
        { s: 'song_002', ok: true },
        { s: 'song_002', ok: false },
        { s: 'song_003', ok: false }
      ]
    } as unknown as HistoryEntry
    const r = songRates([game, game])
    expect(r.get('song_001')).toBeUndefined()
    expect(r.get('song_002')).toEqual({ tries: 4, right: 2 })
    expect(r.get('song_003')).toEqual({ tries: 2, right: 0 })
  })
})
