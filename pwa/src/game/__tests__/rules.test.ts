import { describe, it, expect } from 'vitest'
import { evaluatePlacement, gapLabel, timelineSongsFor, correctGapIndices } from '../placement'
import { endOfRoundAchievements, realtimeScoreAchievements, type AchievementEffect } from '../achievementRules'
import { evaluateSkip } from '../skipRules'
import { AchievementId } from '@/types/achievements'
import type { Player, Song, TurnRecord } from '@/types'

const song = (year: number, extra: Partial<Song> = {}): Song => ({
  id: `s${year}-${extra.title ?? ''}`,
  title: extra.title ?? `Song ${year}`,
  artist: extra.artist ?? 'Artist',
  year,
  ...extra
})

const player = (name: string, extra: Partial<Player> = {}): Player => ({
  name,
  timeline: [],
  cards: 0,
  score: 0,
  ...extra
})

describe('evaluatePlacement', () => {
  const tl = [song(1970), song(1985), song(2001)]

  it('accepts the first card anywhere and flags it', () => {
    const r = evaluatePlacement([], song(1990), 0)
    expect(r).toMatchObject({ isCorrect: true, isFirstCard: true })
    expect(r.newTimeline.map((s) => s.year)).toEqual([1990])
  })

  it.each([
    [0, 1960, true],
    [0, 1975, false],
    [1, 1975, true],
    [2, 1975, false],
    [3, 2010, true],
    [3, 1999, false]
  ])('gap %i with %i → correct=%s', (gap, year, ok) => {
    expect(evaluatePlacement(tl, song(year), gap).isCorrect).toBe(ok)
  })

  it('allows equal years on either side (>=)', () => {
    expect(evaluatePlacement(tl, song(1985, { title: 'x' }), 1).isCorrect).toBe(true)
    expect(evaluatePlacement(tl, song(1985, { title: 'x' }), 2).isCorrect).toBe(true)
  })

  it('always returns the inserted timeline and never mutates the input', () => {
    const copy = [...tl]
    const r = evaluatePlacement(tl, song(1975), 0)
    expect(r.newTimeline.map((s) => s.year)).toEqual([1975, 1970, 1985, 2001])
    expect(tl).toEqual(copy)
  })

  it('clamps out-of-range gaps', () => {
    expect(evaluatePlacement(tl, song(2020), 99).newTimeline[3].year).toBe(2020)
    expect(evaluatePlacement(tl, song(1900), -3).newTimeline[0].year).toBe(1900)
  })

  it('lists every correct gap', () => {
    expect(correctGapIndices(tl, song(1985, { title: 'x' }))).toEqual([1, 2])
    expect(correctGapIndices(tl, song(1950))).toEqual([0])
  })
})

describe('gapLabel / timelineSongsFor', () => {
  const tl = [song(1970), song(1985)]
  it('names gaps for the UI and screen readers', () => {
    expect(gapLabel([], 0)).toBe('Erste Karte platzieren')
    expect(gapLabel(tl, 0)).toBe('Vor 1970')
    expect(gapLabel(tl, 1)).toBe('Zwischen 1970 und 1985')
    expect(gapLabel(tl, 2)).toBe('Nach 1985')
  })

  it('reads the shared timeline in global mode and the player timeline otherwise', () => {
    const p = player('A', { timeline: [song(1999)] })
    const global = [{ song: song(1980), playerId: 0 }]
    expect(timelineSongsFor('timeline_global', p, global).map((s) => s.year)).toEqual([1980])
    expect(timelineSongsFor('timeline_personal', p, global).map((s) => s.year)).toEqual([1999])
    expect(timelineSongsFor('hardcore', undefined, global)).toEqual([])
  })
})

describe('realtimeScoreAchievements', () => {
  it('unlocks only when a threshold is crossed in this turn', () => {
    expect(realtimeScoreAchievements('A', 70, 80)).toEqual([{ type: 'unlock', player: 'A', id: AchievementId.PUNKTEJAEGER }])
    expect(realtimeScoreAchievements('A', 75, 90)).toEqual([])
    expect(realtimeScoreAchievements('A', 70, 130).map((e) => e.id)).toEqual([
      AchievementId.PUNKTEJAEGER,
      AchievementId.HARDCORE_CHAMPION
    ])
    // 100+ as the description says
    expect(realtimeScoreAchievements('A', 99, 100).map((e) => e.id)).toEqual([AchievementId.HARDCORE_CHAMPION])
    expect(realtimeScoreAchievements('A', 80, 99)).toEqual([])
  })
})

describe('hardcore achievements from the turn log', () => {
  const unlocked = (fx: AchievementEffect[], name: string) =>
    fx.filter((e) => e.type === 'unlock' && e.player === name).map((e) => e.id)
  const progressOf = (fx: AchievementEffect[], name: string, id: AchievementId) =>
    fx.find((e) => e.type === 'progress' && e.player === name && e.id === id)
  const guess = (p: string, y: number, extra: Partial<TurnRecord> = {}): TurnRecord => ({ p, s: `s${y}`, y, ok: true, d: 0, ti: true, ar: true, pts: 15, ...extra })
  const hc = (turns: TurnRecord[], players = [player('A', { cards: turns.length }), player('B')], winner = players[0], minutes = 20) =>
    endOfRoundAchievements({ mode: 'hardcore', people: players.map((p) => p.name), players, winner, durationMinutes: minutes, turns, genreOf: (id) => `g${id}` })

  it('streaks follow the order of play, not the years', () => {
    // played: 1990 full, 1970 miss, 1980 full, 2000 full — sorted by year that would read 1970,1980,1990,2000 (one run of 3)
    const turns = [guess('A', 1990), guess('A', 1970, { pts: 5, d: 9, ok: false }), guess('A', 1980), guess('A', 2000)]
    expect(progressOf(hc(turns), 'A', AchievementId.PERFECT_STREAK)).toMatchObject({ value: 2 })
    const three = [guess('A', 1990), guess('A', 1970), guess('A', 1980)]
    expect(progressOf(hc(three), 'A', AchievementId.PERFECT_STREAK)).toMatchObject({ value: 3 })
  })

  it('name dropper counts artists in a row as played', () => {
    const turns = [1, 2, 3, 4, 5].map((i) => guess('A', 1980 + i, { ti: false, pts: 5 }))
    expect(progressOf(hc(turns), 'A', AchievementId.NAME_DROPPER)).toMatchObject({ value: 5 })
    turns[2] = { ...turns[2], ar: false }
    expect(progressOf(hc(turns), 'A', AchievementId.NAME_DROPPER)).toMatchObject({ value: 2 })
  })

  it('decades and genres count right guesses only', () => {
    const turns = [1955, 1965, 1975].map((y) => guess('A', y)).concat([1985, 1995].map((y) => guess('A', y, { ok: false, d: 7 })))
    const fx = hc(turns)
    expect(progressOf(fx, 'A', AchievementId.TIME_TRAVELER)).toMatchObject({ value: 3 })
    expect(progressOf(fx, 'A', AchievementId.GENRE_HOPPER)).toMatchObject({ value: 3 })
  })

  it('flawless at any goal, only for the winner, only if every song had 15 points', () => {
    const five = [1, 2, 3, 4, 5].map((i) => guess('A', 1980 + i))
    expect(unlocked(hc(five), 'A')).toContain(AchievementId.FLAWLESS_VICTORY)
    const fifteen = Array.from({ length: 15 }, (_, i) => guess('A', 1950 + i))
    expect(unlocked(hc(fifteen), 'A')).toContain(AchievementId.FLAWLESS_VICTORY)
    const oneShort = five.map((t, i) => (i === 3 ? { ...t, pts: 14 } : t))
    expect(unlocked(hc(oneShort), 'A')).not.toContain(AchievementId.FLAWLESS_VICTORY)
  })

  it('cards at the goal alone are no perfect round (everyone has them in hardcore)', () => {
    const missed = [1, 2, 3, 4, 5].map((i) => guess('A', 1980 + i, i === 2 ? { ok: false, d: 6, pts: 0 } : {}))
    expect(unlocked(hc(missed, [player('A', { cards: 10 }), player('B', { cards: 10 })]), 'A')).not.toContain(AchievementId.PERFECTIONIST)
    expect(unlocked(hc([1, 2, 3, 4, 5].map((i) => guess('A', 1980 + i))), 'A')).toContain(AchievementId.PERFECTIONIST)
  })

  it('fast and comeback wins need an opponent and go to the winner only', () => {
    const turns = [guess('A', 1980)]
    expect(unlocked(hc(turns, undefined, undefined, 2), 'A')).toEqual(expect.arrayContaining([AchievementId.LIGHTNING_FAST, AchievementId.MASTER_OF_TIME]))
    expect(unlocked(hc(turns, undefined, undefined, 2), 'B')).not.toContain(AchievementId.LIGHTNING_FAST)
    const alone = [player('A', { cards: 1 })]
    expect(unlocked(hc(turns, alone, alone[0], 2), 'A')).not.toContain(AchievementId.LIGHTNING_FAST)
    // B leads early, A wins: a comeback from the turn log (points)
    const comeback = [guess('A', 1980, { pts: 0, ok: false, d: 9 }), guess('B', 1981), guess('A', 1982), guess('B', 1983, { pts: 0 }), guess('A', 1984)]
    expect(unlocked(hc(comeback), 'A')).toContain(AchievementId.COMEBACK_KING)
  })
})

describe('evaluateSkip', () => {
  const never = () => 0.999
  const always = () => 0

  it('never penalises outside hardcore or before everyone skipped', () => {
    expect(evaluateSkip({}, 0, 2, false, always)).toMatchObject({ penaltyApplied: false, dangerZone: false })
    expect(evaluateSkip({}, 0, 2, true, always)).toMatchObject({ penaltyApplied: false, dangerZone: false })
  })

  it('enters the danger zone once all players skipped, without a penalty for the first round', () => {
    const r = evaluateSkip({ 0: 1 }, 1, 2, true, always)
    expect(r).toMatchObject({ penaltyApplied: false, dangerZone: true, skipCounts: { 0: 1, 1: 1 } })
    expect(r.nextPenaltyProbability).toBeCloseTo(0.33)
  })

  it('rolls 33 % per additional skip, capped at 95 %', () => {
    expect(evaluateSkip({ 0: 1, 1: 1 }, 0, 2, true, always).penaltyApplied).toBe(true)
    expect(evaluateSkip({ 0: 1, 1: 1 }, 0, 2, true, never).penaltyApplied).toBe(false)
    expect(evaluateSkip({ 0: 1, 1: 1 }, 0, 2, true, () => 0.32).penaltyApplied).toBe(true)
    expect(evaluateSkip({ 0: 1, 1: 1 }, 0, 2, true, () => 0.34).penaltyApplied).toBe(false)
    expect(evaluateSkip({ 0: 9, 1: 9 }, 0, 2, true, never).nextPenaltyProbability).toBe(0.95)
  })
})
