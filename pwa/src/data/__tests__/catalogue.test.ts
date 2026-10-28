import { describe, it, expect, afterEach } from 'vitest'
import { allSongs, applyOverrides, setSongOverrides, songById } from '../catalogue'
import { songs } from '../songs'
import { restoreSong } from '@/online/sanitize'
import { pickSong } from '@/game/songPool'

afterEach(() => setSongOverrides({}))

describe('song corrections from the admin area', () => {
  it('fix a year and leave blocked songs out', () => {
    const list = songs.slice(0, 3)
    const out = applyOverrides(list, { [list[0].id]: { year: 1901 }, [list[1].id]: { blocked: true } })
    expect(out.map((s) => s.id)).toEqual([list[0].id, list[2].id])
    expect(out[0].year).toBe(1901)
    expect(list[0].year).not.toBe(1901) // the bundled list stays untouched
  })

  it('the game draws with them', () => {
    const [first, ...rest] = songs
    setSongOverrides(Object.fromEntries(rest.map((s) => [s.id, { blocked: true }])))
    expect(allSongs()).toHaveLength(1)
    setSongOverrides({ [first.id]: { year: 1902 }, ...Object.fromEntries(rest.map((s) => [s.id, { blocked: true }])) })
    const { song } = pickSong(allSongs(), [], [], [], () => 0, true)
    expect(song?.id).toBe(first.id)
    expect(song?.year).toBe(1902)
  })

  it('a host reload puts the corrected year back, even for a song taken out meanwhile', () => {
    const s = songs[5]
    setSongOverrides({ [s.id]: { year: 1903, blocked: true } })
    expect(songById(s.id)?.year).toBe(1903)
    const game = restoreSong({ currentSong: { ...s, year: 0 }, reveal: null } as never)
    expect(game.currentSong?.year).toBe(1903)
  })
})
