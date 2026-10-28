import { describe, it, expect } from 'vitest'
import { applyAchievementEffects, type AchievementEffect } from '../achievementEngine'
import { endOfRoundAchievements, historyAchievements, roundCounters, wasLastEarly } from '../achievementRules'
import { AchievementId } from '@/types/achievements'
import { GameMode, type HistoryEntry, type Player, type TurnRecord } from '@/types'

const find = (doc: ReturnType<typeof applyAchievementEffects>['doc'], name: string, id: AchievementId) =>
  doc[name].achievements.find((a) => a.id === id)!

describe('applyAchievementEffects', () => {
  it('applies a whole burst for several people, new ones included', () => {
    const fx: AchievementEffect[] = [
      { type: 'progress', player: 'Anna', id: AchievementId.ZEITMASCHINE, value: 2 },
      { type: 'progress', player: 'Tom', id: AchievementId.ZEITMASCHINE, value: 1 },
      { type: 'unlock', player: 'Anna', id: AchievementId.LIGHTNING_FAST },
      { type: 'progress', player: 'Anna', id: AchievementId.GENRE_HOPPER, value: 3 }
    ]
    const { doc } = applyAchievementEffects({}, fx, 1)
    expect(Object.keys(doc).sort()).toEqual(['Anna', 'Tom'])
    expect(find(doc, 'Anna', AchievementId.ZEITMASCHINE).progress).toBe(2)
    expect(find(doc, 'Anna', AchievementId.GENRE_HOPPER).progress).toBe(3)
    expect(find(doc, 'Anna', AchievementId.LIGHTNING_FAST).unlocked).toBe(true)
    expect(find(doc, 'Tom', AchievementId.ZEITMASCHINE).progress).toBe(1)
  })

  it('unlocks at the target, once, and reports it', () => {
    const fx: AchievementEffect[] = [{ type: 'progress', player: 'Anna', id: AchievementId.ZEITMASCHINE, value: 3 }]
    const first = applyAchievementEffects({}, fx, 5)
    expect(first.unlocked.map((u) => u.id)).toEqual([AchievementId.ZEITMASCHINE])
    expect(find(first.doc, 'Anna', AchievementId.ZEITMASCHINE).unlockedAt).toBe(5)
    const again = applyAchievementEffects(first.doc, fx, 9)
    expect(again.unlocked).toEqual([])
    expect(find(again.doc, 'Anna', AchievementId.ZEITMASCHINE).unlockedAt).toBe(5)
  })

  it('never lowers progress and does not touch the input', () => {
    const { doc } = applyAchievementEffects({}, [{ type: 'progress', player: 'A', id: AchievementId.SOCIAL_BUTTERFLY, value: 4 }], 1)
    const frozen = JSON.stringify(doc)
    const after = applyAchievementEffects(doc, [{ type: 'progress', player: 'A', id: AchievementId.SOCIAL_BUTTERFLY, value: 2 }], 2).doc
    expect(find(after, 'A', AchievementId.SOCIAL_BUTTERFLY).progress).toBe(4)
    expect(JSON.stringify(doc)).toBe(frozen)
  })

  it('counts rounds up beyond what the history holds', () => {
    let doc = {}
    for (let i = 0; i < 60; i++)
      doc = applyAchievementEffects(doc, [{ type: 'add', player: 'A', id: AchievementId.MARATHON_RUNNER, value: 1, atLeast: Math.min(i + 1, 50) }], i).doc
    expect(find(doc as never, 'A', AchievementId.MARATHON_RUNNER).unlocked).toBe(true)
    // a first count after an update starts from the stored rounds
    const fresh = applyAchievementEffects({}, [{ type: 'add', player: 'B', id: AchievementId.CENTURION, value: 1, atLeast: 30 }], 1).doc
    expect(find(fresh, 'B', AchievementId.CENTURION).progress).toBe(30)
  })
})

const player = (name: string, extra: Partial<Player> = {}): Player => ({ name, timeline: [], cards: 0, score: 0, ...extra })
const turn = (p: string, y: number, ok: boolean, extra: Partial<TurnRecord> = {}): TurnRecord => ({ p, s: `s${y}${p}`, y, ok, ...extra })
const genres: Record<string, string> = {}
const genreOf = (id: string) => genres[id]

describe('endOfRoundAchievements in timeline modes', () => {
  const turns = [
    turn('Anna', 1965, true, { first: true }),
    turn('Tom', 1990, true, { first: true }),
    turn('Anna', 1975, true),
    turn('Tom', 1999, false),
    turn('Anna', 1985, true),
    turn('Tom', 2005, true),
    turn('Anna', 1995, true),
    turn('Tom', 2010, false, { ch: { by: 'Anna', ok: true } }),
    turn('Anna', 2001, true),
    turn('Tom', 1980, true),
    turn('Anna', 1972, true)
  ]
  genres['s1975Anna'] = 'Rock'
  genres['s1985Anna'] = 'Pop'
  genres['s1995Anna'] = 'Hip-Hop'
  genres['s2010Tom'] = 'Electronic'

  const run = (mode: GameMode, durationMinutes = 20) =>
    endOfRoundAchievements({
      mode,
      people: ['Anna', 'Tom'],
      players: [player('Anna'), player('Tom')],
      winner: player('Anna'),
      durationMinutes,
      rankingsHistory: [],
      turns,
      genreOf
    })

  it('credits decades, genres and a perfect round (the old code did nothing here)', () => {
    for (const mode of [GameMode.TIMELINE_GLOBAL, GameMode.TIMELINE_PERSONAL]) {
      const { doc, unlocked } = applyAchievementEffects({}, run(mode), 1)
      // Anna: 70s, 80s, 90s, 2000s, 2010s (objection won) — the free first card does not count
      expect(find(doc, 'Anna', AchievementId.TIME_TRAVELER).unlocked).toBe(true)
      expect(find(doc, 'Anna', AchievementId.GENRE_HOPPER).unlocked).toBe(true)
      expect(find(doc, 'Anna', AchievementId.PERFECTIONIST).unlocked).toBe(true)
      expect(find(doc, 'Tom', AchievementId.ZEITMASCHINE).progress).toBe(2)
      expect(find(doc, 'Tom', AchievementId.PERFECTIONIST).unlocked).toBe(false)
      expect(unlocked.some((u) => u.player === 'Tom' && u.id === AchievementId.TIME_TRAVELER)).toBe(false)
    }
  })

  it('gives the fast-round achievements to the winner only', () => {
    const { doc } = applyAchievementEffects({}, run(GameMode.TIMELINE_GLOBAL, 2), 1)
    expect(find(doc, 'Anna', AchievementId.MASTER_OF_TIME).unlocked).toBe(true)
    expect(find(doc, 'Tom', AchievementId.LIGHTNING_FAST).unlocked).toBe(false)
  })

  it('leaves out bots and teams', () => {
    const fx = endOfRoundAchievements({
      mode: GameMode.HARDCORE,
      people: ['Anna'],
      players: [player('Anna', { score: 80 }), player('Bot Alpha', { isBot: true, score: 90 })],
      winner: player('Bot Alpha'),
      durationMinutes: 1,
      rankingsHistory: [],
      turns: [],
      genreOf
    })
    expect(fx.every((e) => e.player === 'Anna')).toBe(true)
  })
})

describe('wasLastEarly', () => {
  it('sees the winner trailing after everyone had a turn', () => {
    const t = [turn('A', 1970, false), turn('B', 1980, true), turn('A', 1990, true), turn('B', 2000, false)]
    expect(wasLastEarly(t, ['A', 'B'], 'A', false)).toBe(true)
    expect(wasLastEarly(t, ['A', 'B'], 'B', false)).toBe(false)
  })
})

const game = (id: number, winner: string, players: HistoryEntry['players'], mode = GameMode.TIMELINE_GLOBAL): HistoryEntry =>
  ({ id, timestamp: id, date: '', winner: { name: winner, cards: 0, score: 0 }, players, gameMode: mode }) as HistoryEntry
const seat = (name: string, extra: Partial<HistoryEntry['players'][number]> = {}) => ({ name, cards: 0, score: 0, timeline: [], ...extra })

describe('historyAchievements', () => {
  it('takes the winner from the round, not from points (timeline rounds have none)', () => {
    const games = [1, 2, 3, 4, 5].map((i) => game(i, 'Tom', [seat('Anna'), seat('Tom')]))
    const { doc } = applyAchievementEffects({}, historyAchievements('Tom', games), 1)
    expect(find(doc, 'Tom', AchievementId.UNBEATABLE).unlocked).toBe(true)
    const anna = applyAchievementEffects({}, historyAchievements('Anna', games), 1).doc
    expect(find(anna, 'Anna', AchievementId.UNBEATABLE).progress).toBe(0)
  })

  it('counts won rounds against bots by their strength', () => {
    const games = [1, 2, 3].map((i) => game(i, 'Anna', [seat('Anna'), seat('Bot Alpha', { bot: true, level: 'hard' })]))
    const { doc } = applyAchievementEffects({}, historyAchievements('Anna', games), 1)
    expect(find(doc, 'Anna', AchievementId.BOT_SLAYER_HARD).unlocked).toBe(true)
    expect(find(doc, 'Anna', AchievementId.BOT_SLAYER_EASY).progress).toBe(0)
  })

  it('counts other people, not bots, as company', () => {
    const games = [game(1, 'Anna', [seat('Anna'), seat('B'), seat('C'), seat('Bot Beta', { bot: true })]), game(2, 'B', [seat('Anna'), seat('D'), seat('E'), seat('F')])]
    const { doc } = applyAchievementEffects({}, historyAchievements('Anna', games), 1)
    expect(find(doc, 'Anna', AchievementId.SOCIAL_BUTTERFLY).unlocked).toBe(true)
    expect(find(doc, 'Anna', AchievementId.SOCIAL_BUTTERFLY).progress).toBe(5)
  })
})

describe('roundCounters', () => {
  it('counts a round and its points', () => {
    const fx = roundCounters('Anna', [game(1, 'Anna', [seat('Anna')])], 40)
    const { doc } = applyAchievementEffects({}, fx, 1)
    expect(find(doc, 'Anna', AchievementId.MARATHON_RUNNER).progress).toBe(1)
    expect(find(doc, 'Anna', AchievementId.MUSIC_EXPERT).progress).toBe(40)
  })
})

describe('backfillAchievements', () => {
  it('catches stored timeline rounds up, skips bots and hidden people', async () => {
    const { backfillAchievements } = await import('../achievementRules')
    const turns = [turn('Anna', 1965, true), turn('Anna', 1975, true), turn('Anna', 1985, true)]
    const g = { ...game(1, 'Anna', [seat('Anna'), seat('Gone'), seat('Bot Alpha', { bot: true })]), turns }
    const { doc } = applyAchievementEffects({}, backfillAchievements([g], () => undefined, ['Gone']), 1)
    expect(Object.keys(doc)).toEqual(['Anna'])
    expect(find(doc, 'Anna', AchievementId.ZEITMASCHINE).unlocked).toBe(true)
    expect(find(doc, 'Anna', AchievementId.MARATHON_RUNNER).progress).toBe(1)
    // twice changes nothing
    const again = applyAchievementEffects(doc, backfillAchievements([g], () => undefined, ['Gone']), 2)
    expect(again.unlocked).toEqual([])
  })
})
