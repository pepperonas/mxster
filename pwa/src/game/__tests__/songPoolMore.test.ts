import { describe, it, expect } from 'vitest'
import { REPLAY_GAP, countByDecade, decadeOf, pickSong, rememberSong, songKey, songPool } from '../songPool'
import type { Song } from '@/types'

const song = (n: number, year: number, extra: Partial<Song> = {}): Song => ({ id: `song_${n}`, title: `T${n}`, artist: 'A', year, ...extra })
const all = [song(1, 1965), song(2, 1972), song(3, 1988, { exotic: true }), song(4, 1999, { genre: 'Rock' }), song(5, 2004)]
const first = () => 0

describe('songPool and decades', () => {
  it('puts years into their decade', () => {
    expect([1950, 1959, 1960, 2019, 2020].map(decadeOf)).toEqual([1950, 1950, 1960, 2010, 2020])
  })

  it('counts songs per decade, exotics only when wanted', () => {
    expect(countByDecade(all, false)).toEqual({ 1960: 1, 1970: 1, 1990: 1, 2000: 1 })
    expect(countByDecade(all, true)[1980]).toBe(1)
  })

  it('keeps exotics in a nemesis list even when exotics are off', () => {
    const pool = songPool(all, [], false, { collection: 'nemesis', songIds: ['song_3'] })
    expect(pool.map((s) => s.id)).toEqual(['song_3'])
  })

  it('uses the stable key: old Spotify id, else the song id', () => {
    expect(songKey(song(9, 2000, { spotifyId: 'abc' }))).toBe('abc')
    expect(songKey(song(9, 2000))).toBe('song_9')
  })
})

describe('pickSong', () => {
  it('never repeats a song of the round while others are left', () => {
    const played: string[] = []
    for (let i = 0; i < 4; i++) {
      const { song: s } = pickSong(all, [], played, [], Math.random, false)
      expect(played).not.toContain(songKey(s!))
      played.push(songKey(s!))
    }
  })

  it('prefers songs not heard lately, across rounds', () => {
    const recent = ['song_1', 'song_2', 'song_4']
    expect(pickSong(all, [], [], recent, first, false).song!.id).toBe('song_5')
  })

  it('widens to all decades when the chosen ones are used up, and says so', () => {
    const r = pickSong(all, [1960], ['song_1'], [], first, false)
    expect(r.widened).toBe(true)
    expect(r.song!.id).not.toBe('song_1')
  })

  it('falls back to exotics only when every known song is used', () => {
    const r = pickSong(all, [], ['song_1', 'song_2', 'song_4', 'song_5'], [], first, false)
    expect(r.song!.id).toBe('song_3')
    expect(r.widened).toBe(true)
  })

  it('brings songs back when everything was played, never one of the last few', () => {
    const many = Array.from({ length: 60 }, (_, i) => song(i, 1960 + (i % 60)))
    const played = many.map(songKey)
    for (let i = 0; i < 30; i++) {
      const r = pickSong(many, [], played, [], Math.random, true)
      expect(r.replayed).toBe(true)
      expect(played.slice(-REPLAY_GAP)).not.toContain(songKey(r.song!))
    }
  })

  it('returns nothing for an empty catalogue instead of crashing', () => {
    expect(pickSong([], [], [], [])).toEqual({ song: null, widened: false })
  })
})

describe('rememberSong', () => {
  it('moves a song to the end without doubles', () => {
    expect(rememberSong(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a'])
  })

  it('keeps only the newest 150', () => {
    const long = Array.from({ length: 150 }, (_, i) => `s${i}`)
    const next = rememberSong(long, 'new')
    expect(next).toHaveLength(150)
    expect(next[0]).toBe('s1')
    expect(next.slice(-1)[0]).toBe('new')
  })
})
