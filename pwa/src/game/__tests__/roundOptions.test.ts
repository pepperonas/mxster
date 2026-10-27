import { describe, it, expect, beforeEach } from 'vitest'
import type { Player, Song } from '@/types'
import { pickSong, rememberSong, songPool, decadeOf, RECENT_LIMIT, songKey } from '../songPool'
import { eligibleChallengers, resolveChallenge } from '../challenge'
import { activeMember, initialOf, maxTeams, splitIntoTeams, turnName } from '../teams'
import { isRoundOver } from '../roundEnd'
import { clearSavedGame, loadSavedGame, saveGame, MAX_AGE_MS } from '../savedGame'
import { mergeSettings } from '@/sync/merge'

const song = (year: number, id = `s${year}`): Song => ({ id, title: `Song ${year}`, artist: 'A', year })
const p = (name: string, extra: Partial<Player> = {}): Player => ({ name, timeline: [], cards: 0, score: 0, ...extra })
const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('song pool', () => {
  const all = [song(1965), song(1984), song(1987), song(1999), song(2021)]

  it('limits to the chosen decades, empty means all', () => {
    expect(songPool(all, []).length).toBe(5)
    expect(songPool(all, [1980]).map((s) => s.year)).toEqual([1984, 1987])
    expect(decadeOf(1999)).toBe(1990)
  })

  it('never repeats a song within the round', () => {
    const draw = pickSong(all, [1980], ['s1984'], [])
    expect(draw.song?.id).toBe('s1987')
    expect(draw.widened).toBe(false)
  })

  it('widens to all decades when the chosen ones are used up', () => {
    const draw = pickSong(all, [1980], ['s1984', 's1987'], [], () => 0)
    expect(draw.song).not.toBeNull()
    expect(draw.song!.year).not.toBe(1984)
    expect(draw.widened).toBe(true)
  })

  it('returns no song once everything was played', () => {
    expect(pickSong(all, [], all.map(songKey), [])).toEqual({ song: null, widened: false })
  })

  it('prefers songs not played in recent rounds', () => {
    const recent = ['s1965', 's1984', 's1987', 's1999']
    for (let i = 0; i < 5; i++) expect(pickSong(all, [], [], recent).song?.id).toBe('s2021')
  })

  it('when everything was played lately, takes one of the longest-unplayed', () => {
    const recent = ['s1999', 's1965', 's1984', 's1987', 's2021'] // oldest first
    const picks = new Set([0, 0.99].map((r) => pickSong(all, [], [], recent, seq(r)).song?.id))
    expect([...picks].every((id) => id === 's1999' || id === 's1965')).toBe(true)
  })

  it('remembers songs most-recent-last, without doubles, capped', () => {
    expect(rememberSong(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a'])
    const long = Array.from({ length: RECENT_LIMIT }, (_, i) => `k${i}`)
    const next = rememberSong(long, 'new')
    expect(next).toHaveLength(RECENT_LIMIT)
    expect(next[next.length - 1]).toBe('new')
    expect(next[0]).toBe('k1')
  })

  it('merges recent songs of two devices, newest last, no doubles', () => {
    const merged = mergeSettings(
      { savedPlayers: [], recentSongs: ['b', 'c'] },
      { savedPlayers: [], recentSongs: ['a', 'b'] }
    )
    expect(merged.recentSongs).toEqual(['a', 'b', 'c'])
  })
})

describe('Einspruch', () => {
  const timeline = [song(1970), song(1990)]

  it('only humans with objections left, never the placer, never on a first card or in a tiebreak', () => {
    const players = [p('A', { challenges: 3 }), p('B', { challenges: 0 }), p('Bot', { isBot: true, challenges: 3 }), p('C', { challenges: 1 })]
    expect(eligibleChallengers(players, 0, timeline, { enabled: true, tiebreak: false })).toEqual([3])
    expect(eligibleChallengers(players, 3, timeline, { enabled: true, tiebreak: false })).toEqual([0])
    expect(eligibleChallengers(players, 0, [], { enabled: true, tiebreak: false })).toEqual([])
    expect(eligibleChallengers(players, 0, timeline, { enabled: true, tiebreak: true })).toEqual([])
    expect(eligibleChallengers(players, 0, timeline, { enabled: false, tiebreak: false })).toEqual([])
  })

  it('placer right: placer keeps the card, whatever the challenger did', () => {
    expect(resolveChallenge(timeline, song(1980), 1, { playerIndex: 1, gapIndex: 0 })).toEqual({
      placerCorrect: true,
      challengerCorrect: false,
      outcome: 'placer'
    })
  })

  it('placer wrong, challenger right: the challenger takes the card', () => {
    expect(resolveChallenge(timeline, song(1980), 0, { playerIndex: 1, gapIndex: 1 }).outcome).toBe('challenger')
  })

  it('both wrong: nobody gets it; no objection and wrong: nobody', () => {
    expect(resolveChallenge(timeline, song(1980), 0, { playerIndex: 1, gapIndex: 2 }).outcome).toBe('nobody')
    expect(resolveChallenge(timeline, song(1980), 0, null)).toEqual({ placerCorrect: false, challengerCorrect: null, outcome: 'nobody' })
  })
})

describe('teams', () => {
  it('splits evenly and keeps everyone', () => {
    const teams = splitIntoTeams(['a', 'b', 'c', 'd', 'e'], 2, seq(0.3, 0.7, 0.1, 0.9))
    expect(teams.map((t) => t.length).sort()).toEqual([2, 3])
    expect(teams.flat().sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('never makes more teams than give everyone a partner', () => {
    expect(maxTeams(4)).toBe(2)
    expect(maxTeams(7)).toBe(3)
    expect(maxTeams(20)).toBe(4)
    expect(splitIntoTeams(['a', 'b', 'c', 'd'], 4)).toHaveLength(2)
  })

  it('members take turns at the controls', () => {
    const team = p('Team Magenta', { members: ['Anna', 'Ben'], memberTurn: 3 })
    expect(activeMember(team)).toBe('Ben')
    expect(turnName(team)).toBe('Ben')
    expect(turnName(p('Cem'))).toBe('Cem')
    expect(initialOf('Team Orange')).toBe('O')
    expect(initialOf('anna')).toBe('A')
  })
})

describe('round length', () => {
  it('Eigene Zeitleiste ends when anyone reaches the goal', () => {
    expect(isRoundOver([p('A', { cards: 4 }), p('B', { cards: 5 })], 'timeline_personal', 5)).toBe(true)
    expect(isRoundOver([p('A', { cards: 4 }), p('B', { cards: 4 })], 'timeline_personal', 5)).toBe(false)
  })

  it('Gemeinsame Zeitleiste ends when the shared timeline holds the goal', () => {
    expect(isRoundOver([p('A', { cards: 8 }), p('B', { cards: 7 })], 'timeline_global', 15)).toBe(true)
    expect(isRoundOver([p('A', { cards: 8 }), p('B', { cards: 6 })], 'timeline_global', 15)).toBe(false)
  })

  it('Hardcore ends once everyone played the goal', () => {
    expect(isRoundOver([p('A', { cards: 15 }), p('B', { cards: 14 })], 'hardcore', 15)).toBe(false)
    expect(isRoundOver([p('A', { cards: 15 }), p('B', { cards: 15 })], 'hardcore', 15)).toBe(true)
  })
})

describe('saved round', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips and can be cleared', () => {
    saveGame({ a: 1 })
    expect(loadSavedGame()).toEqual({ a: 1 })
    clearSavedGame()
    expect(loadSavedGame()).toBeNull()
  })

  it('drops rounds that are too old', () => {
    saveGame({ a: 1 }, 1_000)
    expect(loadSavedGame(1_000 + MAX_AGE_MS + 1)).toBeNull()
    expect(localStorage.getItem('mxster_running_game')).toBeNull()
  })

  it('ignores broken data', () => {
    localStorage.setItem('mxster_running_game', '{not json')
    expect(loadSavedGame()).toBeNull()
  })
})
