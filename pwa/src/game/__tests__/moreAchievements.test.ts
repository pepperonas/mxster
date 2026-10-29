/**
 * The 26 achievements of v0.12.6 (50 in total): every one is reachable with
 * the data the game stores, and none is handed out for nothing.
 */
import { describe, it, expect } from 'vitest'
import { applyAchievementEffects, type AchievementEffect } from '../achievementEngine'
import { backfillAchievements, endOfRoundAchievements, peopleOf, roundCounters, roundTally, type RoundInput } from '../achievementRules'
import { ACHIEVEMENT_DEFINITIONS, AchievementId, achievementDescription, achievementName } from '@/types/achievements'
import { GameMode, type HistoryEntry, type Player, type TurnRecord } from '@/types'
import { setCurrentLang } from '@/i18n'
import { ICON_NAMES } from '@/components/ui/Icon'

const player = (name: string, extra: Partial<Player> = {}): Player => ({ name, timeline: [], cards: 0, score: 0, ...extra })
const turn = (p: string, y: number, ok: boolean, extra: Partial<TurnRecord> = {}): TurnRecord => ({ p, s: `s${y}${p}`, y, ok, ...extra })
const apply = (fx: AchievementEffect[]) => applyAchievementEffects({}, fx, 1).doc
const has = (doc: ReturnType<typeof apply>, name: string, id: AchievementId) => Boolean(doc[name]?.achievements.find((a) => a.id === id)?.unlocked)
const prog = (doc: ReturnType<typeof apply>, name: string, id: AchievementId) => doc[name]?.achievements.find((a) => a.id === id)?.progress

const round = (extra: Partial<RoundInput>): RoundInput => ({
  mode: GameMode.TIMELINE_GLOBAL,
  people: ['Anna', 'Ben'],
  players: [player('Anna'), player('Ben')],
  winner: player('Anna'),
  durationMinutes: 20,
  rankingsHistory: [],
  turns: [],
  genreOf: () => undefined,
  finishedAt: new Date(2026, 9, 28, 20, 0).getTime(),
  ...extra
})

describe('the set', () => {
  it('has 50 achievements, each with a name, a description and an icon, in both languages', () => {
    const ids = Object.values(AchievementId)
    expect(ids).toHaveLength(50)
    expect(Object.keys(ACHIEVEMENT_DEFINITIONS)).toHaveLength(50)
    for (const lang of ['de', 'en'] as const) {
      setCurrentLang(lang)
      const names = ids.map(achievementName)
      for (const [i, id] of ids.entries()) {
        expect(names[i], id).not.toBe(id)
        expect(achievementDescription(id), id).not.toBe('')
      }
      // no two achievements share a name
      expect(new Set(names).size).toBe(50)
    }
    setCurrentLang('de')
    for (const def of Object.values(ACHIEVEMENT_DEFINITIONS)) expect(ICON_NAMES, def.id).toContain(def.icon)
  })
})

describe('every round', () => {
  it('first round and first win; the loser gets the round only', () => {
    const doc = apply(endOfRoundAchievements(round({})))
    expect(has(doc, 'Anna', AchievementId.FIRST_ROUND)).toBe(true)
    expect(has(doc, 'Anna', AchievementId.FIRST_WIN)).toBe(true)
    expect(has(doc, 'Ben', AchievementId.FIRST_ROUND)).toBe(true)
    expect(has(doc, 'Ben', AchievementId.FIRST_WIN)).toBe(false)
  })

  it('night owl, early bird — and nothing in the evening', () => {
    const at = (h: number) => apply(endOfRoundAchievements(round({ finishedAt: new Date(2026, 9, 28, h, 30).getTime() })))
    expect(has(at(2), 'Anna', AchievementId.NIGHT_OWL)).toBe(true)
    expect(has(at(4), 'Anna', AchievementId.NIGHT_OWL)).toBe(false)
    expect(has(at(6), 'Anna', AchievementId.EARLY_BIRD)).toBe(true)
    expect(has(at(9), 'Anna', AchievementId.EARLY_BIRD)).toBe(false)
    expect(has(at(20), 'Anna', AchievementId.NIGHT_OWL) || has(at(20), 'Anna', AchievementId.EARLY_BIRD)).toBe(false)
  })

  it('a long round, but not when the length is unknown', () => {
    expect(has(apply(endOfRoundAchievements(round({ durationMinutes: 61 }))), 'Anna', AchievementId.LONG_ROUND)).toBe(true)
    expect(has(apply(endOfRoundAchievements(round({ durationMinutes: Infinity }))), 'Anna', AchievementId.LONG_ROUND)).toBe(false)
  })

  it('a full house from six people, bots not counted', () => {
    const six = ['A', 'B', 'C', 'D', 'E', 'F']
    expect(has(apply(endOfRoundAchievements(round({ people: six }))), 'A', AchievementId.FULL_HOUSE)).toBe(true)
    const players = [...six.slice(0, 5).map((n) => player(n)), player('Bot Alpha', { isBot: true })]
    expect(peopleOf(players)).toHaveLength(5)
    expect(has(apply(endOfRoundAchievements(round({ people: peopleOf(players) }))), 'A', AchievementId.FULL_HOUSE)).toBe(false)
  })

  it('team spirit for every member of the winning team, not for the other team', () => {
    const red = player('Rot', { members: ['Anna', 'Ben'] })
    const blue = player('Blau', { members: ['Cleo', 'Dan'] })
    const people = peopleOf([red, blue])
    expect(people).toEqual(['Anna', 'Ben', 'Cleo', 'Dan'])
    const doc = apply(endOfRoundAchievements(round({ people, players: [red, blue], winner: red })))
    expect(has(doc, 'Ben', AchievementId.TEAM_SPIRIT)).toBe(true)
    expect(has(doc, 'Ben', AchievementId.FIRST_WIN)).toBe(true)
    expect(has(doc, 'Cleo', AchievementId.TEAM_SPIRIT)).toBe(false)
    expect(doc['Rot']).toBeUndefined()
  })
})

describe('timeline rounds', () => {
  const run = (n: number, broken = false) => [
    turn('Anna', 1960, true, { first: true }),
    ...Array.from({ length: n }, (_, i) => turn('Anna', 1970 + i, !(broken && i === 3)))
  ]

  it('a run of right cards; the free first card does not count, a miss breaks it', () => {
    expect(prog(apply(endOfRoundAchievements(round({ turns: run(5) }))), 'Anna', AchievementId.HOT_STREAK)).toBe(5)
    expect(prog(apply(endOfRoundAchievements(round({ turns: run(4) }))), 'Anna', AchievementId.HOT_STREAK)).toBe(4)
    const broken = apply(endOfRoundAchievements(round({ turns: run(8, true) })))
    expect(prog(broken, 'Anna', AchievementId.HOT_STREAK)).toBe(4)
    expect(has(apply(endOfRoundAchievements(round({ turns: run(10) }))), 'Anna', AchievementId.UNSTOPPABLE)).toBe(true)
  })

  it('an objection won, not one lost', () => {
    const won = [turn('Ben', 1980, false, { ch: { by: 'Anna', ok: true } })]
    const lost = [turn('Ben', 1980, true, { ch: { by: 'Anna', ok: false } })]
    expect(has(apply(endOfRoundAchievements(round({ turns: won }))), 'Anna', AchievementId.OBJECTION_WON)).toBe(true)
    expect(has(apply(endOfRoundAchievements(round({ turns: lost }))), 'Anna', AchievementId.OBJECTION_WON)).toBe(false)
  })

  it('decades of one round, objections included', () => {
    const turns = [1955, 1965, 1975, 1985, 1995].map((y) => turn('Anna', y, true))
    turns.push(turn('Ben', 2015, false, { ch: { by: 'Anna', ok: true } }))
    expect(has(apply(endOfRoundAchievements(round({ turns }))), 'Anna', AchievementId.ALL_OVER)).toBe(true)
  })

  it('a perfect round needs five own cards, all right', () => {
    expect(has(apply(endOfRoundAchievements(round({ turns: run(5) }))), 'Anna', AchievementId.PERFECTIONIST)).toBe(true)
    expect(has(apply(endOfRoundAchievements(round({ turns: run(4) }))), 'Anna', AchievementId.PERFECTIONIST)).toBe(false)
    expect(has(apply(endOfRoundAchievements(round({ turns: run(6, true) }))), 'Anna', AchievementId.PERFECTIONIST)).toBe(false)
  })
})

describe('hardcore rounds', () => {
  it('fifteen points on one song, and a perfect round from the turn log', () => {
    const turns = [1980, 1981, 1982, 1983, 1984].map((y, i) => turn('Anna', y, true, { d: 0, ti: true, ar: true, pts: i === 0 ? 15 : 9 }))
    const doc = apply(endOfRoundAchievements(round({ mode: GameMode.HARDCORE, turns, players: [player('Anna', { cards: 5 })] })))
    expect(has(doc, 'Anna', AchievementId.FULL_SCORE)).toBe(true)
    expect(has(doc, 'Anna', AchievementId.PERFECTIONIST)).toBe(true)
    expect(has(doc, 'Ben', AchievementId.FULL_SCORE)).toBe(false)
  })
})

describe('daily round', () => {
  const ten = [turn('Anna', 1960, true, { first: true }), ...Array.from({ length: 10 }, (_, i) => turn('Anna', 1961 + i, true))]
  // cards = start card + streak
  const solo = (turns: TurnRecord[], cards: number) => round({ people: ['Anna'], players: [player('Anna', { cards })], daily: '2026-10-28', turns })

  it('played, and a streak of ten', () => {
    const perfect = apply(endOfRoundAchievements(solo(ten, 11)))
    expect(has(perfect, 'Anna', AchievementId.DAILY_FIRST)).toBe(true)
    expect(has(perfect, 'Anna', AchievementId.DAILY_PERFECT)).toBe(true)
    const nine = apply(endOfRoundAchievements(solo(ten.slice(0, 10), 10)))
    expect(has(nine, 'Anna', AchievementId.DAILY_FIRST)).toBe(true)
    expect(has(nine, 'Anna', AchievementId.DAILY_PERFECT)).toBe(false)
  })

  it('a run continued on another device counts its whole streak (the log there holds only the last songs)', () => {
    const resumed = apply(endOfRoundAchievements(solo(ten.slice(8), 11)))
    expect(has(resumed, 'Anna', AchievementId.DAILY_PERFECT)).toBe(true)
  })

  it('nothing daily in a normal round', () => {
    expect(has(apply(endOfRoundAchievements(round({ turns: ten }))), 'Anna', AchievementId.DAILY_FIRST)).toBe(false)
  })
})

const game = (id: number, winner: string, players: HistoryEntry['players'], extra: Partial<HistoryEntry> = {}): HistoryEntry =>
  ({ id, timestamp: id, date: '', winner: { name: winner, cards: 0, score: 0 }, players, gameMode: GameMode.TIMELINE_GLOBAL, ...extra }) as HistoryEntry
const seat = (name: string, extra: Partial<HistoryEntry['players'][number]> = {}) => ({ name, cards: 0, score: 0, timeline: [], ...extra })

describe('counters across rounds', () => {
  it('counts right cards, oldies, modern songs and objections from one round', () => {
    const turns = [
      turn('Anna', 1965, true, { first: true }),
      turn('Anna', 1962, true),
      turn('Anna', 2015, true),
      turn('Anna', 1990, false),
      turn('Ben', 2012, false, { ch: { by: 'Anna', ok: true } })
    ]
    expect(roundTally(turns, GameMode.TIMELINE_GLOBAL, 'Anna')).toMatchObject({ right: 3, oldies: 1, modern: 2, objections: 1 })
    // hardcore counts guesses instead
    const hc = [turn('Anna', 1980, true, { d: 0, ti: true, ar: false }), turn('Anna', 1981, false, { d: 4, ti: false, ar: true })]
    expect(roundTally(hc, GameMode.HARDCORE, 'Anna')).toMatchObject({ right: 0, exact: 1, titles: 1, artists: 1 })
  })

  it('adds up round by round and unlocks at the target', () => {
    let doc = {}
    const turns = [turn('Anna', 1960, true, { first: true }), ...Array.from({ length: 10 }, (_, i) => turn('Anna', 2010 + i, true))]
    const games: HistoryEntry[] = []
    for (let i = 1; i <= 10; i++) {
      const g = game(i, 'Anna', [seat('Anna'), seat('Ben')], { turns })
      games.unshift(g)
      doc = applyAchievementEffects(doc, roundCounters('Anna', games, g), i).doc
    }
    const d = doc as ReturnType<typeof apply>
    expect(prog(d, 'Anna', AchievementId.COLLECTOR)).toBe(100)
    expect(has(d, 'Anna', AchievementId.COLLECTOR)).toBe(true)
    expect(has(d, 'Anna', AchievementId.ZEITGEIST)).toBe(true)
    expect(has(d, 'Anna', AchievementId.REGULAR)).toBe(true)
    expect(has(d, 'Anna', AchievementId.WINNER_10)).toBe(true)
    expect(prog(d, 'Anna', AchievementId.WINNER_25)).toBe(10)
    expect(prog(d, 'Anna', AchievementId.ARCHIVIST)).toBe(100)
  })

  it('counts a team win for its members', () => {
    const g = game(1, 'Rot', [seat('Rot', { members: ['Anna', 'Ben'] }), seat('Blau', { members: ['Cleo', 'Dan'] })])
    const won = apply(roundCounters('Ben', [g], g))
    expect(prog(won, 'Ben', AchievementId.WINNER_10)).toBe(1)
    expect(prog(apply(roundCounters('Cleo', [g], g)), 'Cleo', AchievementId.WINNER_10)).toBe(0)
  })

  it('daily routine counts days, not rounds', () => {
    const days = ['2026-10-01', '2026-10-01', '2026-10-02'].map((d, i) => game(i + 1, 'Anna', [seat('Anna')], { daily: d }))
    expect(prog(apply(roundCounters('Anna', days, days[0])), 'Anna', AchievementId.DAILY_REGULAR)).toBe(2)
  })
})

describe('catching up from the history', () => {
  it('credits the new achievements for stored rounds, also hardcore ones, without inventing hardcore details', () => {
    const tl = game(1, 'Anna', [seat('Anna'), seat('Ben')], {
      turns: [turn('Anna', 1960, true, { first: true }), ...[1961, 1962, 1963, 1964, 1965].map((y) => turn('Anna', y, true))],
      timestamp: new Date(2026, 9, 1, 2, 0).getTime()
    })
    const hc = game(2, 'Ben', [seat('Anna', { cards: 10 }), seat('Ben', { cards: 10 })], { gameMode: GameMode.HARDCORE, timestamp: new Date(2026, 9, 2, 20, 0).getTime() })
    const doc = apply(backfillAchievements([hc, tl], () => undefined))
    expect(has(doc, 'Anna', AchievementId.FIRST_ROUND)).toBe(true)
    expect(has(doc, 'Anna', AchievementId.NIGHT_OWL)).toBe(true)
    expect(has(doc, 'Anna', AchievementId.HOT_STREAK)).toBe(true)
    expect(has(doc, 'Ben', AchievementId.FIRST_WIN)).toBe(true)
    // ten cards in hardcore is everyone's lot, not a perfect round
    expect(has(doc, 'Ben', AchievementId.PERFECTIONIST)).toBe(false)
    expect(prog(doc, 'Anna', AchievementId.COLLECTOR)).toBe(5)
  })
})

describe('a round alone is no win', () => {
  it('stored daily rounds count as rounds, never as wins or win streaks', async () => {
    const { historyAchievements } = await import('../achievementRules')
    const dailies = [1, 2, 3, 4, 5].map((i) => game(i, 'Anna', [seat('Anna', { cards: 11 })], { daily: `2026-10-0${i}` }))
    const doc = apply([...historyAchievements('Anna', dailies), ...roundCounters('Anna', dailies, dailies[0])])
    expect(prog(doc, 'Anna', AchievementId.UNBEATABLE)).toBe(0)
    expect(prog(doc, 'Anna', AchievementId.WINNER_10)).toBe(0)
    expect(prog(doc, 'Anna', AchievementId.REGULAR)).toBe(5)
    expect(has(apply(endOfRoundAchievements(round({ people: ['Anna'], players: [player('Anna')], durationMinutes: 2, daily: '2026-10-01' }))), 'Anna', AchievementId.FIRST_WIN)).toBe(false)
  })
})

describe('flawless needs a real round', () => {
  it('not from a handful of songs', () => {
    const three = [1, 2, 3].map((i) => turn('Anna', 1980 + i, true, { d: 0, ti: true, ar: true, pts: 15 }))
    const doc = apply(endOfRoundAchievements(round({ mode: GameMode.HARDCORE, turns: three })))
    expect(has(doc, 'Anna', AchievementId.FLAWLESS_VICTORY)).toBe(false)
    expect(has(doc, 'Anna', AchievementId.FULL_SCORE)).toBe(true)
  })
})
