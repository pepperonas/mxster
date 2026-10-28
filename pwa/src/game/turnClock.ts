/**
 * Online: every step of a turn has a time limit (pure), so a player who is
 * connected but not paying attention cannot hold the round. When it runs out,
 * the game itself acts — never the host by choice:
 *
 * - draw a song (idle):            30 s, then it is drawn for them;
 * - place the card / guess:       120 s from the draw, then the turn lapses
 *                                       without a card;
 * - after the reveal ("Weiter"):   20 s, then the round moves on.
 *
 * Objections have their own clock (objectionWindow.ts). Times are server ms.
 */
import type { TurnPhase } from './turn'

export interface StepClock {
  /** The step this clock belongs to (phase, player, song, turn count). */
  key: string
  at: number
}

export const STEP_LIMITS_MS: Partial<Record<TurnPhase, number>> = {
  idle: 30_000,
  placing: 120_000,
  guessing: 120_000,
  revealed: 20_000
}

/** Show the countdown once this little time is left. */
export const SHOW_COUNTDOWN_MS = 30_000

export type ClockAction = 'draw' | 'pass' | 'continue'

export function actionFor(phase: TurnPhase): ClockAction | null {
  if (phase === 'idle') return 'draw'
  if (phase === 'placing' || phase === 'guessing') return 'pass'
  if (phase === 'revealed') return 'continue'
  return null
}

/** Identifies one step: a new turn, draw or reveal always gives a new key. */
export function stepKey(phase: TurnPhase, currentPlayer: number, songId: string | null | undefined, turns: number, drawn: number): string {
  return `${phase}|${currentPlayer}|${songId ?? ''}|${turns}|${drawn}`
}

/** 'start' a clock for a new step, 'act' when it ran out, else 'none'. */
export function clockStep(phase: TurnPhase, key: string, clock: StepClock | null, now: number): 'none' | 'start' | 'act' {
  if (STEP_LIMITS_MS[phase] == null) return 'none'
  if (!clock || clock.key !== key) return 'start'
  return now >= clock.at ? 'act' : 'none'
}

/** Seconds left on this step's clock, or null when there is none or it is not shown yet. */
export function visibleSecondsLeft(clock: StepClock | null, key: string, now: number): number | null {
  if (!clock || clock.key !== key) return null
  const ms = clock.at - now
  if (ms > SHOW_COUNTDOWN_MS) return null
  return Math.max(0, Math.ceil(ms / 1000))
}
