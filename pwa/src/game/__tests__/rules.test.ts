import { describe, it, expect } from 'vitest'
import { evaluatePlacement, gapLabel, timelineSongsFor, correctGapIndices } from '../placement'
import { endOfGameAchievements, realtimeScoreAchievements, type AchievementEffect } from '../achievementRules'
import { evaluateSkip } from '../skipRules'
import { AchievementId } from '@/types/achievements'
import type { Player, Song } from '@/types'

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
    expect(realtimeScoreAchievements('A', 124, 125).map((e) => e.id)).toEqual([AchievementId.HARDCORE_CHAMPION])
  })
})

describe('endOfGameAchievements', () => {
  const unlocked = (fx: AchievementEffect[], name: string) =>
    fx.filter((e) => e.type === 'unlock' && e.player === name).map((e) => e.id)
  const progressOf = (fx: AchievementEffect[], name: string, id: AchievementId) =>
    fx.find((e) => e.type === 'progress' && e.player === name && e.id === id)

  const perfect = (year: number) => song(year, { points: 15 })

  it('awards the timeline-shape achievements', () => {
    const decades = [1950, 1960, 1970, 1980, 1990].map((y) => song(y, { genre: `g${y}` }))
    const A = player('A', { timeline: decades, cards: 10, score: 40 })
    const fx = endOfGameAchievements({ players: [A], winner: A, gameDurationMinutes: 10, rankingsHistory: [] })
    expect(unlocked(fx, 'A')).toEqual(
      expect.arrayContaining([
        AchievementId.TIME_TRAVELER,
        AchievementId.ZEITMASCHINE,
        AchievementId.GENRE_HOPPER
      ])
    )
    expect(unlocked(fx, 'A')).not.toContain(AchievementId.DECADE_MASTER)
    // in hardcore everyone ends with the goal's number of cards: that alone is no perfect round
    expect(unlocked(fx, 'A')).not.toContain(AchievementId.PERFECTIONIST)
    expect(progressOf(fx, 'A', AchievementId.TIME_TRAVELER)).toMatchObject({ value: 5 })
    expect(progressOf(fx, 'A', AchievementId.PUNKTEJAEGER)).toMatchObject({ value: 40 })
  })

  it('awards DECADE_MASTER for ten songs from one decade', () => {
    const A = player('A', { timeline: Array.from({ length: 10 }, (_, i) => song(1980 + i)) })
    const fx = endOfGameAchievements({ players: [A], winner: A, gameDurationMinutes: 10, rankingsHistory: [] })
    expect(unlocked(fx, 'A')).toContain(AchievementId.DECADE_MASTER)
  })

  it('awards speed and flawless only to the winner', () => {
    const A = player('A', { score: 150 })
    const B = player('B', { score: 150 })
    const fx = endOfGameAchievements({ players: [A, B], winner: A, gameDurationMinutes: 2.5, rankingsHistory: [] })
    expect(unlocked(fx, 'A')).toEqual(
      expect.arrayContaining([AchievementId.LIGHTNING_FAST, AchievementId.MASTER_OF_TIME, AchievementId.FLAWLESS_VICTORY])
    )
    expect(unlocked(fx, 'B')).toEqual([])
  })

  it('awards LIGHTNING_FAST but not MASTER_OF_TIME between 3 and 5 minutes', () => {
    const A = player('A')
    const fx = endOfGameAchievements({ players: [A, player('B')], winner: A, gameDurationMinutes: 4, rankingsHistory: [] })
    expect(unlocked(fx, 'A')).toContain(AchievementId.LIGHTNING_FAST)
    expect(unlocked(fx, 'A')).not.toContain(AchievementId.MASTER_OF_TIME)
  })

  it('awards COMEBACK_KING only for being last within the first five turns', () => {
    const A = player('A')
    const B = player('B')
    const early = [{ turn: 2, rankings: ['B', 'A'] }]
    const late = [{ turn: 6, rankings: ['B', 'A'] }]
    expect(unlocked(endOfGameAchievements({ players: [A, B], winner: A, gameDurationMinutes: 9, rankingsHistory: early }), 'A')).toContain(
      AchievementId.COMEBACK_KING
    )
    expect(unlocked(endOfGameAchievements({ players: [A, B], winner: A, gameDurationMinutes: 9, rankingsHistory: late }), 'A')).not.toContain(
      AchievementId.COMEBACK_KING
    )
    expect(unlocked(endOfGameAchievements({ players: [A], winner: A, gameDurationMinutes: 9, rankingsHistory: early }), 'A')).not.toContain(
      AchievementId.COMEBACK_KING
    )
  })

  it('counts perfect and artist streaks consecutively', () => {
    const streak = [perfect(1970), perfect(1971), song(1972), perfect(1973), perfect(1974), perfect(1975)]
    const artist = Array.from({ length: 5 }, (_, i) =>
      song(1990 + i, { guessDetails: { titleCorrect: false, artistCorrect: true, yearPoints: 0 } })
    )
    const A = player('A', { timeline: streak })
    const B = player('B', { timeline: artist })
    const fx = endOfGameAchievements({ players: [A, B], winner: A, gameDurationMinutes: 9, rankingsHistory: [] })
    expect(progressOf(fx, 'A', AchievementId.PERFECT_STREAK)).toMatchObject({ value: 3 })
    expect(unlocked(fx, 'A')).toContain(AchievementId.PERFECT_STREAK)
    expect(unlocked(fx, 'B')).toContain(AchievementId.NAME_DROPPER)
    expect(progressOf(fx, 'B', AchievementId.NAME_DROPPER)).toMatchObject({ value: 5 })
  })

  it('treats full guessDetails as a perfect guess without points', () => {
    const d = { titleCorrect: true, artistCorrect: true, yearPoints: 5 as const }
    const A = player('A', { timeline: [song(1, { guessDetails: d }), song(2, { guessDetails: d }), song(3, { guessDetails: d })] })
    const fx = endOfGameAchievements({ players: [A], winner: A, gameDurationMinutes: 9, rankingsHistory: [] })
    expect(unlocked(fx, 'A')).toContain(AchievementId.PERFECT_STREAK)
  })

  it('keeps the original effect order per player', () => {
    const A = player('A')
    const fx = endOfGameAchievements({ players: [A], winner: A, gameDurationMinutes: 9, rankingsHistory: [] })
    expect(fx.map((e) => `${e.type}:${e.id}`)).toEqual([
      `progress:${AchievementId.TIME_TRAVELER}`,
      `progress:${AchievementId.DECADE_MASTER}`,
      `progress:${AchievementId.PERFECT_STREAK}`,
      `progress:${AchievementId.ZEITMASCHINE}`,
      `progress:${AchievementId.GENRE_HOPPER}`,
      `progress:${AchievementId.NAME_DROPPER}`,
      `progress:${AchievementId.PUNKTEJAEGER}`
    ])
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
