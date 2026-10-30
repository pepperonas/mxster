/**
 * Bots have a form per round: the difficulty holds on almost every evening,
 * but an easy bot beats a hard one in very rare rounds and a medium one a
 * little more often. Rates measured by simulation with a fixed seed.
 */
import { describe, it, expect } from 'vitest'
import { BASE_SKILL, FORM, botSkill, lerpSkill, rollForm, seeded, SKILL_MAX, SKILL_MIN } from '../botForm'
import { raceWinRate, hardcoreWinRate } from '../botSim'
import { PLACE_ACCURACY, placeAccuracy } from '../botStrategies/timelineBotStrategy'
import { gameReducer, initialState } from '@/contexts/GameContext'
import type { Player } from '@/types'

const N = 20000

describe('upsets: rare, but possible', () => {
  it('race to ten: easy beats hard about once in a hundred rounds, medium about once in twenty', () => {
    const eh = raceWinRate('easy', 'hard', N, 7)
    const mh = raceWinRate('medium', 'hard', N, 7)
    const em = raceWinRate('easy', 'medium', N, 7)
    expect(eh).toBeGreaterThan(0.004)
    expect(eh).toBeLessThan(0.02)
    expect(mh).toBeGreaterThan(0.025)
    expect(mh).toBeLessThan(0.08)
    expect(mh).toBeGreaterThan(eh) // medium surprises more often than easy
    expect(em).toBeLessThan(0.2) // easy still loses to medium most of the time
  }, 60000)

  it('hardcore: the same picture over ten songs', () => {
    const eh = hardcoreWinRate('easy', 'hard', N, 11)
    const mh = hardcoreWinRate('medium', 'hard', N, 11)
    expect(eh).toBeGreaterThan(0.004)
    expect(eh).toBeLessThan(0.02)
    expect(mh).toBeGreaterThan(0.025)
    expect(mh).toBeLessThan(0.09)
  }, 60000)

  it('the form is what makes it possible: without it easy never beats hard', () => {
    const saved = { ...FORM }
    try {
      FORM.wildChance = 0
      FORM.calmSigma = 0.0001
      expect(raceWinRate('easy', 'hard', 5000, 3)).toBe(0)
    } finally {
      Object.assign(FORM, saved)
    }
  }, 60000)
})

describe('form and skill', () => {
  it('most rounds stay close to the difficulty; some swing far', () => {
    const rand = seeded(42)
    const forms = Array.from({ length: 20000 }, () => rollForm(rand))
    const close = forms.filter((f) => Math.abs(f) < 0.2).length / forms.length
    const far = forms.filter((f) => Math.abs(f) > 0.5).length / forms.length
    expect(close).toBeGreaterThan(0.85)
    expect(far).toBeGreaterThan(0.01)
    expect(far).toBeLessThan(0.08)
  })

  it('at its base skill every difficulty keeps the accuracy it always had', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) expect(placeAccuracy(BASE_SKILL[d])).toBeCloseTo(PLACE_ACCURACY[d], 10)
  })

  it('skill is clamped and interpolates between the levels', () => {
    expect(botSkill('hard', 5)).toBe(SKILL_MAX)
    expect(botSkill('easy', -5)).toBe(SKILL_MIN)
    expect(lerpSkill(0.25, { easy: 0, medium: 1, hard: 2 })).toBeCloseTo(0.5)
    expect(lerpSkill(0.75, { easy: 0, medium: 1, hard: 2 }, 0, 3)).toBeCloseTo(1.5)
    // a medium bot on a great day plays like a hard one
    expect(placeAccuracy(botSkill('medium', 0.5))).toBeCloseTo(PLACE_ACCURACY.hard, 10)
  })

  it('the same seed gives the same forms', () => {
    const a = seeded(0.123)
    const b = seeded(0.123)
    expect([rollForm(a), rollForm(a)]).toEqual([rollForm(b), rollForm(b)])
  })
})

describe('forms are rolled when a round starts', () => {
  const players: Player[] = [
    { name: 'Anna', timeline: [], cards: 0, score: 0 },
    { name: 'Bot A', timeline: [], cards: 0, score: 0, isBot: true, botDifficulty: 'easy' },
    { name: 'Bot B', timeline: [], cards: 0, score: 0, isBot: true, botDifficulty: 'hard' }
  ]
  it('every bot gets its own form, people none; a rematch rolls again', () => {
    const s = gameReducer({ ...initialState, players, gameMode: 'timeline-personal' } as never, { type: 'START_GAME', payload: { seed: 0.31 } })
    expect(s.players[0].botForm).toBeUndefined()
    expect(typeof s.players[1].botForm).toBe('number')
    expect(s.players[1].botForm).not.toBe(s.players[2].botForm)
    const next = gameReducer(s, { type: 'REMATCH', payload: { seed: 0.77 } })
    expect(next.players[1].botForm).not.toBe(s.players[1].botForm)
    expect(next.players[1].botDifficulty).toBe('easy')
  })
})
