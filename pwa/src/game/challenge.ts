/**
 * Einspruch (pure) — the challenge rule of the timeline modes.
 *
 * After a card is placed and before it is revealed, another player (or team)
 * may object and put the card into a different gap of the same timeline.
 * Each challenge costs one of the player's challenges, whatever the outcome.
 *  - The placer was right: the placer gets the card as usual.
 *  - The placer was wrong and the challenger right: the challenger gets the
 *    card (into their own timeline, or credited on the shared one).
 *  - Both wrong: nobody gets it.
 * Bots never challenge, there is nothing to challenge on a first card (every
 * gap is right), and a tiebreak is played without challenges.
 */
import type { Player, Song } from '@/types'
import { evaluatePlacement } from './placement'

export const STARTING_CHALLENGES = 3

export interface ChallengeClaim {
  playerIndex: number
  gapIndex: number
}

export function challengesLeft(player: Player): number {
  return player.challenges ?? 0
}

/** Seats that may challenge the card the placer just put down. */
export function eligibleChallengers(
  players: Player[],
  placerIndex: number,
  timeline: Song[],
  options: { enabled: boolean; tiebreak: boolean }
): number[] {
  if (!options.enabled || options.tiebreak || timeline.length === 0) return []
  return players
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => i !== placerIndex && !p.isBot && challengesLeft(p) > 0)
    .map(({ i }) => i)
}

export type ChallengeOutcome = 'placer' | 'challenger' | 'nobody'

export interface ChallengeResolution {
  placerCorrect: boolean
  /** null when nobody challenged. */
  challengerCorrect: boolean | null
  outcome: ChallengeOutcome
}

export function resolveChallenge(
  timeline: Song[],
  song: Song,
  placerGap: number,
  claim: ChallengeClaim | null
): ChallengeResolution {
  const placerCorrect = evaluatePlacement(timeline, song, placerGap).isCorrect
  if (!claim) return { placerCorrect, challengerCorrect: null, outcome: placerCorrect ? 'placer' : 'nobody' }
  const challengerCorrect = evaluatePlacement(timeline, song, claim.gapIndex).isCorrect
  const outcome: ChallengeOutcome = placerCorrect ? 'placer' : challengerCorrect ? 'challenger' : 'nobody'
  return { placerCorrect, challengerCorrect, outcome }
}
