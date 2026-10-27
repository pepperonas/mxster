import { describe, it, expect } from 'vitest'
import type { HistoryEntry, Player, Song, TurnRecord } from '@/types'
import { decadeRates, decadeShares, groupStats, knownPlayers, renameInHistory, summarize, weeklyRounds } from '../stats'
import { guessRecord, placementRecord } from '../turnRecord'

const card = (year: number, id = `s${year}`) => ({ id, title: `T${year}`, artist: 'A', year })
const seat = (name: string, years: number[], extra: Partial<HistoryEntry['players'][number]> = {}) => ({
  name,
  cards: years.length,
  score: 0,
  timeline: years.map((y) => card(y)),
  ...extra
})
const turn = (p: string, y: number, ok: boolean, extra: Partial<TurnRecord> = {}): TurnRecord => ({ p, s: `s${y}`, y, ok, ...extra })

function game(id: number, winner: string, players: HistoryEntry['players'], turns?: TurnRecord[], mode = 'timeline_personal'): HistoryEntry {
  return {
    id,
    timestamp: id,
    date: new Date(id).toISOString(),
    winner: { name: winner, cards: 0, score: 0 },
    players,
    gameMode: mode as HistoryEntry['gameMode'],
    ...(turns ? { turns } : {})
  }
}

describe('summarize', () => {
  const history = [
    // Old round, no turn log
    game(1, 'Anna', [seat('Anna', [1985, 1991]), seat('Ben', [2001])]),
    // Logged round: first cards don't count, one wrong placement each
    game(
      2,
      'Ben',
      [seat('Anna', [1984]), seat('Ben', [1999, 2003])],
      [
        turn('Anna', 1984, true, { first: true }),
        turn('Ben', 1999, true, { first: true }),
        turn('Anna', 1972, false),
        turn('Ben', 2003, true),
        turn('Anna', 1988, true),
        turn('Ben', 1965, false)
      ]
    )
  ]

  it('counts rounds and wins for everyone, rates only from the log', () => {
    const [ben, anna] = summarize(history).sort((a, b) => a.name.localeCompare(b.name)).reverse()
    expect(anna).toMatchObject({ name: 'Anna', games: 2, wins: 1, loggedGames: 1, tries: 2, correct: 1, accuracy: 0.5 })
    expect(ben).toMatchObject({ name: 'Ben', games: 2, wins: 1, tries: 2, correct: 1 })
  })

  it('keeps the rate empty instead of 0 when no turn was logged', () => {
    const [only] = summarize([history[0]]).filter((s) => s.name === 'Anna')
    expect(only.accuracy).toBeNull()
    expect(decadeRates(only).every((d) => d.rate === null)).toBe(true)
  })

  it('splits hits by decade, card shares from all rounds', () => {
    const anna = summarize(history).find((s) => s.name === 'Anna')!
    const rates = Object.fromEntries(decadeRates(anna).map((d) => [d.decade, d.rate]))
    expect(rates[1970]).toBe(0)
    expect(rates[1980]).toBe(1)
    expect(rates[1990]).toBeNull()
    const shares = Object.fromEntries(decadeShares(anna).map((d) => [d.decade, d.cards]))
    expect(shares).toMatchObject({ 1980: 2, 1990: 1 })
  })

  it('credits a team result to each member and leaves bots out', () => {
    const h = [game(3, 'Rot', [seat('Rot', [1980], { members: ['Anna', 'Ben'] }), seat('Bot Alpha', [1990]), seat('Robo', [1991], { bot: true })])]
    const names = summarize(h).map((s) => s.name)
    expect(names.sort()).toEqual(['Anna', 'Ben'])
    expect(summarize(h).every((s) => s.wins === 1)).toBe(true)
  })

  it('averages the year distance in hardcore and counts exact years', () => {
    const h = [game(4, 'Anna', [seat('Anna', [])], [turn('Anna', 1980, true, { d: 0 }), turn('Anna', 1990, false, { d: 4 }), turn('Anna', 2000, false)], 'hardcore')]
    const anna = summarize(h)[0]
    expect(anna.yearOff).toBe(2)
    expect(anna.exactYears).toBe(1)
    expect(anna.guesses).toBe(2)
  })

  it('counts objections and only the won ones as won', () => {
    const h = [
      game(5, 'Anna', [seat('Anna', []), seat('Ben', [])], [
        turn('Anna', 1980, false, { ch: { by: 'Ben', ok: true } }),
        turn('Anna', 1981, true, { ch: { by: 'Ben', ok: false } })
      ])
    ]
    const ben = summarize(h).find((s) => s.name === 'Ben')!
    expect(ben).toMatchObject({ challenges: 2, challengesWon: 1 })
  })
})

describe('summarize: removed and merged people', () => {
  it('leaves hidden people out, also as team members and objectors', () => {
    const h = [
      game(1, 'Rot', [seat('Rot', [1980], { members: ['Anna', 'Tom'] }), seat('Ben', [])], [
        turn('Tom', 1981, true, { team: 'Rot' }),
        turn('Ben', 1982, false, { ch: { by: 'Tom', ok: true } })
      ])
    ]
    const names = summarize(h, ['Tom']).map((s) => s.name)
    expect(names.sort()).toEqual(['Anna', 'Ben'])
  })

  it('counts a person once per round even with two seats (merged spellings)', () => {
    const h = [game(1, 'Lisa', [seat('Lisa', [1980]), seat('Lisa', [1990, 2000])])]
    const [lisa] = summarize(h)
    expect(lisa).toMatchObject({ games: 1, wins: 1, cards: 3 })
  })
})

describe('groupStats', () => {
  it('finds hard and safe songs from at least two tries', () => {
    const turns = [
      turn('A', 1980, false, { s: 'hard' }),
      turn('B', 1980, false, { s: 'hard' }),
      turn('A', 1990, true, { s: 'safe' }),
      turn('B', 1990, true, { s: 'safe' }),
      turn('A', 2000, false, { s: 'once' }),
      turn('A', 2001, true, { s: 'first', first: true }),
      turn('Bot', 2002, false, { s: 'bot', bot: true })
    ]
    const g = groupStats([game(1, 'A', [seat('A', []), seat('B', [])], turns)])
    expect(g.hardest.map((s) => s.id)).toEqual(['hard'])
    expect(g.safest.map((s) => s.id)).toEqual(['safe'])
    expect(g.tries).toBe(5)
    expect(g.accuracy).toBeCloseTo(2 / 5)
  })

  it('counts modes, play time and songs of old rounds by their cards', () => {
    const h = [
      { ...game(1, 'A', [seat('A', [1980, 1990]), seat('B', [2000])]), durationMs: 60_000 },
      game(2, 'A', [seat('A', [])], [], 'hardcore')
    ]
    const g = groupStats(h)
    expect(g.modes).toMatchObject({ timeline_personal: 1, hardcore: 1, timeline_global: 0 })
    expect(g.songs).toBe(3)
    expect(g.playMs).toBe(60_000)
    expect(g.timedRounds).toBe(1)
    expect(g.accuracy).toBeNull()
  })
})

describe('weeklyRounds', () => {
  it('puts rounds into calendar weeks ending with this week', () => {
    const now = new Date('2026-10-28T12:00:00').getTime() // a Wednesday
    const h = [
      game(new Date('2026-10-26T20:00:00').getTime(), 'A', []), // Monday this week
      game(new Date('2026-10-25T20:00:00').getTime(), 'A', []), // Sunday last week
      game(new Date('2025-01-01T20:00:00').getTime(), 'A', []) // far outside
    ]
    const weeks = weeklyRounds(h, 4, now)
    expect(weeks).toHaveLength(4)
    expect(weeks.map((w) => w.rounds)).toEqual([0, 0, 1, 1])
  })
})

describe('player management', () => {
  const h = [game(1, 'Anna', [seat('anna', [1980]), seat('Rot', [], { members: ['Ben', 'Cleo'] }), seat('KI-1', [])])]

  it('lists people from rounds and quick picks, without bots and hidden ones', () => {
    expect(knownPlayers(h, ['Dora', 'Ben'], ['Cleo']).sort()).toEqual(['Ben', 'Dora', 'anna'])
  })

  it('also lists people who only have achievements, so they can be removed', () => {
    expect(knownPlayers(h, [], ['n'], ['m', 'n', 'Bot Alpha']).sort()).toEqual(['Ben', 'Cleo', 'anna', 'm'])
  })

  it('renames everywhere and leaves other rounds untouched', () => {
    const other = game(2, 'Dora', [seat('Dora', [])])
    const withTurns = { ...h[0], winner: { name: 'anna', cards: 1, score: 0 }, turns: [turn('anna', 1980, true, { ch: { by: 'anna', ok: true } }), turn('Ben', 1981, false, { team: 'Rot' })] }
    const [renamed, same] = renameInHistory([withTurns, other], 'anna', 'Anna')
    expect(same).toBe(other)
    expect(renamed.winner.name).toBe('Anna')
    expect(renamed.players[0].name).toBe('Anna')
    expect(renamed.turns?.[0]).toMatchObject({ p: 'Anna', ch: { by: 'Anna' } })
    expect(renamed.turns?.[1]).toMatchObject({ p: 'Ben', team: 'Rot' })
  })

  it('renames a team member', () => {
    const [r] = renameInHistory(h, 'Cleo', 'Clea')
    expect(r.players[1].members).toEqual(['Ben', 'Clea'])
  })
})

describe('turn records', () => {
  const song: Song = { id: 'song_1', title: 'T', artist: 'A', year: 1984 }
  const anna: Player = { name: 'Anna', timeline: [], cards: 0, score: 0 }

  it('names the team member at the controls', () => {
    const team: Player = { ...anna, name: 'Rot', members: ['Ben', 'Cleo'], memberTurn: 1 }
    expect(placementRecord(team, song, true, false, null)).toEqual({ p: 'Cleo', team: 'Rot', s: 'song_1', y: 1984, ok: true })
  })

  it('records an objection and a first card', () => {
    const r = placementRecord(anna, song, false, true, { by: { ...anna, name: 'Ben' }, ok: true })
    expect(r).toMatchObject({ first: true, ok: false, ch: { by: 'Ben', ok: true } })
  })

  it('a guess is right within two years; no year means no distance', () => {
    expect(guessRecord(anna, song, { titleMatch: true, artistMatch: false, yearDifference: -2 }, 7)).toMatchObject({
      ok: true,
      d: 2,
      ti: true,
      ar: false,
      pts: 7
    })
    const none = guessRecord(anna, song, { titleMatch: false, artistMatch: false, yearDifference: 9999 }, 0)
    expect(none.ok).toBe(false)
    expect('d' in none).toBe(false)
  })

  it('marks bots', () => {
    expect(placementRecord({ ...anna, isBot: true }, song, true, false, null).bot).toBe(true)
  })
})

describe('cards on the shared timeline', () => {
  // The seats' own timelines stay empty there; the cards come from the turn log
  const shared = (turns?: TurnRecord[]) =>
    game(1, 'Lisa', [seat('Lisa', [], { cards: 3 }), seat('Tom', [], { cards: 1 })], turns, 'timeline_global')

  it('a right placement goes to the placer, a won objection to the objector', () => {
    const [lisa, tom] = ['Lisa', 'Tom'].map((n) =>
      summarize([
        shared([
          turn('Lisa', 1965, true, { first: true }),
          turn('Tom', 1984, false, { ch: { by: 'Lisa', ok: true } }),
          turn('Lisa', 1992, true),
          turn('Tom', 2003, true),
          turn('Lisa', 1971, false, { ch: { by: 'Tom', ok: false } })
        ])
      ]).find((p) => p.name === n)!
    )
    expect(decadeShares(lisa).filter((d) => d.cards > 0).map((d) => [d.decade, d.cards])).toEqual([
      [1960, 1],
      [1980, 1],
      [1990, 1]
    ])
    expect(decadeShares(tom).filter((d) => d.cards > 0).map((d) => [d.decade, d.cards])).toEqual([[2000, 1]])
  })

  it('a team round credits the team name', () => {
    const g = game(1, 'Rot', [seat('Rot', [], { cards: 1, members: ['Ana', 'Ben'] })], [turn('Ana', 1999, true, { team: 'Rot' })], 'timeline_global')
    const ben = summarize([g]).find((p) => p.name === 'Ben')!
    expect(ben.byDecade[1990].cards).toBe(1)
  })

  it('rounds without a turn log stay empty instead of guessing', () => {
    const lisa = summarize([shared()]).find((p) => p.name === 'Lisa')!
    expect(decadeShares(lisa).every((d) => d.cards === 0)).toBe(true)
  })
})
