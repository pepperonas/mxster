import { describe, it, expect } from 'vitest'
import type { HistoryEntry, Player, Song } from '@/types'
import { cleanNaming, judgeNaming, MAX_JOKERS, concealed } from '../bonus'
import { genreGroup, pickSong, songKey, songPool, themeActive } from '../songPool'
import { missedSongs, NEMESIS_MAX } from '../stats'
import { blindSnapshot } from '@/online/sanitize'
import { mayAct } from '@/online/rules'
import { songs } from '@/data/songs'

const song = { id: 'song_005', title: 'Wonderwall', artist: 'Oasis', year: 1995 } as Song

describe('bonus: naming title and artist', () => {
  it('both right earns a joker, forgiving typos and case', () => {
    expect(judgeNaming(song, { title: 'wonderwal', artist: 'OASIS' }, 0)).toMatchObject({ titleOk: true, artistOk: true, earned: true })
  })
  it('half right or a full joker pocket earns nothing', () => {
    expect(judgeNaming(song, { title: 'Wonderwall', artist: 'Blur' }, 0).earned).toBe(false)
    expect(judgeNaming(song, { title: 'Wonderwall', artist: 'Oasis' }, MAX_JOKERS).earned).toBe(false)
    expect(judgeNaming(song, { title: '', artist: '' }, 0)).toMatchObject({ titleOk: false, artistOk: false })
  })
  it('names from another device are cleaned', () => {
    expect(cleanNaming({ title: '  x '.repeat(100), artist: 3 })?.title.length).toBeLessThanOrEqual(120)
    expect(cleanNaming({ title: ' ', artist: '' })).toBeNull()
    expect(cleanNaming('nope')).toBeNull()
  })
  it('the card stays face down: title and artist hidden, the id kept for the layout', () => {
    expect(concealed(song, '?', '?')).toMatchObject({ id: song.id, title: '?', artist: '?' })
  })
  it('online, a bonus round sends neither year nor names before the reveal', () => {
    const game = { currentSong: song, reveal: null, bonus: true } as never
    expect(blindSnapshot(game).currentSong).toMatchObject({ id: song.id, title: '', artist: '', year: 0 })
    const plain = blindSnapshot({ currentSong: song, reveal: null, bonus: false } as never)
    expect(plain.currentSong).toMatchObject({ title: 'Wonderwall', year: 0 })
  })
  it('only the player on turn spends a joker, the host acts for bots', () => {
    const players = [{ name: 'A', seat: 0 }, { name: 'B', seat: 1 }, { name: 'Bot', isBot: true }] as Player[]
    const view = { phase: 'placing' as const, players, currentPlayer: 0, pending: null, reveal: null }
    expect(mayAct(view, 0, 'swap')).toBe(true)
    expect(mayAct(view, 1, 'swap')).toBe(false)
    expect(mayAct({ ...view, phase: 'idle', currentPlayer: 2 }, 0, 'draw', true)).toBe(true)
    expect(mayAct({ ...view, phase: 'idle', currentPlayer: 2 }, 1, 'draw', false)).toBe(false)
  })
})

describe('themed rounds', () => {
  it('genre groups', () => {
    expect(genreGroup('Metal')).toBe('rock')
    expect(genreGroup('R&B')).toBe('soul')
    expect(genreGroup('Hip-Hop')).toBe('hiphop')
    expect(genreGroup('Country')).toBe('other')
    expect(genreGroup(undefined)).toBe('other')
  })
  it('German songs, party classics and genres filter the pool', () => {
    const german = songPool(songs, [], false, { collection: 'german' })
    expect(german.length).toBeGreaterThan(20)
    expect(german.every((s) => s.german)).toBe(true)
    const party = songPool(songs, [], false, { collection: 'party' })
    expect(party.length).toBeGreaterThan(50)
    const rock80s = songPool(songs, [1980], false, { genres: ['rock'] })
    expect(rock80s.every((s) => genreGroup(s.genre) === 'rock' && s.year >= 1980 && s.year < 1990)).toBe(true)
  })
  it('nemesis rounds draw from the given songs, exotics included', () => {
    const ids = songs.filter((s) => s.exotic).slice(0, 3).map((s) => s.id)
    const pool = songPool(songs, [], false, { collection: 'nemesis', songIds: ids })
    expect(pool.map((s) => s.id).sort()).toEqual([...ids].sort())
  })
  it('a dried-up selection widens instead of stopping', () => {
    const ids = [songs[0].id]
    const draw = pickSong(songs, [], [songKey(songs[0])], [], () => 0, false, { collection: 'nemesis', songIds: ids })
    expect(draw.song).not.toBeNull()
    expect(draw.widened).toBe(true)
    expect(themeActive({ collection: 'all', genres: [] })).toBe(false)
  })
  it('the group\'s misses: newest first, once each, bots and first cards left out', () => {
    const game = (id: number, turns: HistoryEntry['turns']) => ({ id, timestamp: id, turns }) as HistoryEntry
    const history = [
      game(1, [
        { p: 'A', s: 'song_001', y: 1975, ok: false },
        { p: 'A', s: 'song_002', y: 1982, ok: true }
      ]),
      game(2, [
        { p: 'Bot', bot: true, s: 'song_003', y: 1990, ok: false },
        { p: 'B', s: 'song_004', y: 1990, ok: false, first: true },
        { p: 'B', s: 'song_005', y: 1995, ok: false },
        { p: 'A', s: 'song_001', y: 1975, ok: false }
      ])
    ]
    expect(missedSongs(history)).toEqual(['song_001', 'song_005'])
    expect(NEMESIS_MAX).toBeLessThanOrEqual(200)
  })
})
