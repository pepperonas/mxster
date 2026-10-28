/**
 * Online: every step of a turn has a time limit (pure), so a player who is
 * connected but not paying attention cannot hold the round. When it runs out,
 * the game itself acts — never the host by choice:
 *
 * - draw a song (idle):            30 s, then it is drawn for them;
 * - place the card / guess:       as long as the song plays, then 30 s
 *                                       after it ended or was paused (capped at
 *                                       PLACE_CAP_MS from the draw), then the
 *                                       turn lapses without a card;
 * - after the reveal ("Weiter"):   20 s, then the round moves on.
 *
 * Objections have their own clock (objectionWindow.ts). Times are server ms.
 */
import type { TurnPhase } from './turn'

export interface StepClock {
  /** The step this clock belongs to (phase, player, song, turn count). */
  key: string
  at: number
  /** When the step began (server ms). */
  since?: number
}

export const STEP_LIMITS_MS: Partial<Record<TurnPhase, number>> = {
  idle: 30_000,
  placing: 30_000, // after the music stopped, see placingAt
  guessing: 30_000,
  revealed: 20_000
}

/** Placing/guessing never takes longer than this from the draw (pausing in a loop). */
export const PLACE_CAP_MS = 6 * 60_000
/** Time to place once the song has ended or was paused. */
export const AFTER_MUSIC_MS = 30_000

export interface MusicCue {
  songId: string | null
  playing: boolean
  at: number
}

/**
 * When placing/guessing runs out: never while the song plays; 30 s after it
 * stopped (or after the draw, if it never started); never later than the cap.
 */
export function placingAt(songId: string | null | undefined, cue: MusicCue | null, since: number): number {
  const cap = since + PLACE_CAP_MS
  const ours = cue && songId && cue.songId === songId
  if (ours && cue.playing) return cap
  const stopped = ours ? Math.max(cue.at, since) : since
  return Math.min(cap, stopped + AFTER_MUSIC_MS)
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
