/**
 * Hardcore skip penalty (pure), extracted from GameScreen.
 *
 * Once every player has skipped the current song at least once, each further
 * skip risks a -3 point penalty with probability (additionalSkips × 33 %),
 * capped at 95 %. Outside hardcore mode skipping is free.
 */
export const SKIP_PENALTY_POINTS = 3
const STEP = 0.33
const CAP = 0.95

export interface SkipEvaluation {
  /** Skip counts including the skip being evaluated. */
  skipCounts: Record<number, number>
  penaltyApplied: boolean
  /** Everybody has skipped at least once — the next skip is risky. */
  dangerZone: boolean
  /** Probability that the *next* skip is penalised (only meaningful in the danger zone). */
  nextPenaltyProbability: number
}

export function evaluateSkip(
  previousCounts: Record<number, number>,
  playerIndex: number,
  playerCount: number,
  isHardcore: boolean,
  random: () => number = Math.random
): SkipEvaluation {
  const skipCounts = { ...previousCounts, [playerIndex]: (previousCounts[playerIndex] || 0) + 1 }
  const playersWhoSkipped = Object.keys(skipCounts).length
  const totalSkips = Object.values(skipCounts).reduce((sum, n) => sum + n, 0)
  const dangerZone = isHardcore && playersWhoSkipped >= playerCount
  const additionalSkips = totalSkips - playerCount

  let penaltyApplied = false
  if (dangerZone) {
    const probability = Math.min(additionalSkips * STEP, CAP)
    penaltyApplied = random() < probability
  }

  return {
    skipCounts,
    penaltyApplied,
    dangerZone,
    nextPenaltyProbability: dangerZone ? Math.min((additionalSkips + 1) * STEP, CAP) : 0
  }
}
