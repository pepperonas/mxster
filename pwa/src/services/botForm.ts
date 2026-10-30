/**
 * A bot's strength for one round (pure).
 *
 * Every difficulty has a base skill (easy 0, medium 0.5, hard 1). At the start
 * of each round a bot rolls its form: usually a small wobble around its base,
 * now and then a really good or a really bad day. That way an easy bot can, in
 * very rare rounds, beat a hard one — and a medium one a little more often —
 * while the difficulty still means what it says on almost every evening.
 *
 * The skill drives the strategies through `lerpSkill` (accuracy tables per
 * difficulty, interpolated), so a medium bot on a great day plays like a hard
 * one and a hard bot on a bad day like a medium one. The numbers are tuned by
 * simulation (botSim.ts, pinned in botForm.test.ts) to these upset rates in a
 * race to ten and in hardcore: easy beats hard ≈ 1 in 100 rounds, medium beats
 * hard ≈ 1 in 20, easy beats medium ≈ 1 in 10. Without the form an easy bot
 * never beat a hard one (0 in 20 000) and a medium one almost never (0.06 %).
 */
import type { BotDifficulty } from './botStrategies/types'

export const BASE_SKILL: Record<BotDifficulty, number> = { easy: 0, medium: 0.5, hard: 1 }

/** Form spread: a small wobble always, a big swing now and then. */
export const FORM = {
  calmSigma: 0.08,
  wildChance: 0.15,
  wildSigma: 0.5
}

/** Lowest and highest skill a round can bring. */
export const SKILL_MIN = -0.2
export const SKILL_MAX = 1.1

/** Normal-distributed number (Box–Muller) from a uniform source. */
function gauss(rand: () => number): number {
  const u = Math.max(rand(), 1e-12)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** The form for one round: mostly close to 0, rarely far from it. */
export function rollForm(rand: () => number = Math.random): number {
  const wild = rand() < FORM.wildChance
  return gauss(rand) * (wild ? FORM.wildSigma : FORM.calmSigma)
}

export function botSkill(difficulty: BotDifficulty, form = 0): number {
  return Math.min(SKILL_MAX, Math.max(SKILL_MIN, BASE_SKILL[difficulty] + form))
}

/**
 * A value at this skill from one per difficulty: linear between the levels,
 * carried on past easy and hard with the nearest slope, then clamped.
 */
export function lerpSkill(skill: number, at: Record<BotDifficulty, number>, min = 0, max = 1): number {
  const { easy, medium, hard } = at
  const v = skill <= 0.5 ? easy + (medium - easy) * (skill / 0.5) : medium + (hard - medium) * ((skill - 0.5) / 0.5)
  return Math.min(max, Math.max(min, v))
}

/** mulberry32: a small seeded generator, so a round's forms come from one seed. */
export function seeded(seed: number): () => number {
  let a = Math.floor(seed * 0xffffffff) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
