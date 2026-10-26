/**
 * Tiebreak ("Stechen") — a round never ends in a draw.
 *
 * When the normal end condition is met but several players share the lead,
 * only those players keep playing, one song each per round, in seat order.
 * After every complete round the leaders among them are counted again: one
 * leader wins, several leaders play another round (the others drop out).
 *
 * The measure is the one the mode is decided by: points in hardcore, correct
 * cards in the timeline modes.
 */
import type { GameMode, Player } from '@/types'

export interface Tiebreak {
  /** Seat indices still in the tiebreak. */
  contenders: number[]
  /** Contenders who already had their song in the current tiebreak round. */
  played: number[]
  /** 1 for the first tiebreak round. */
  round: number
}

export function standing(player: Player, mode: GameMode | null): number {
  return mode === 'hardcore' ? player.score : player.cards
}

/** Seat indices (ascending) of the players with the best standing among `among`. */
export function leadersAmong(players: Player[], among: number[], mode: GameMode | null): number[] {
  if (among.length === 0) return []
  const best = Math.max(...among.map((i) => standing(players[i], mode)))
  return among.filter((i) => standing(players[i], mode) === best).sort((a, b) => a - b)
}

export function leaders(players: Player[], mode: GameMode | null): number[] {
  return leadersAmong(
    players,
    players.map((_, i) => i),
    mode
  )
}

export function startTiebreak(contenders: number[]): Tiebreak {
  return { contenders: [...contenders].sort((a, b) => a - b), played: [], round: 1 }
}

/** Next seat after `current` that is still in the tiebreak (wrapping). */
export function nextContender(tiebreak: Tiebreak, current: number): number {
  const after = tiebreak.contenders.find((i) => i > current)
  return after ?? tiebreak.contenders[0]
}

export type TiebreakStep =
  | { kind: 'continue'; tiebreak: Tiebreak }
  | { kind: 'winner'; index: number }

/** Book the finished turn of `playerIndex`; decide once the round is complete. */
export function afterTiebreakTurn(
  tiebreak: Tiebreak,
  playerIndex: number,
  players: Player[],
  mode: GameMode | null
): TiebreakStep {
  const played = tiebreak.played.includes(playerIndex) ? tiebreak.played : [...tiebreak.played, playerIndex]
  if (!tiebreak.contenders.every((i) => played.includes(i))) {
    return { kind: 'continue', tiebreak: { ...tiebreak, played } }
  }
  const top = leadersAmong(players, tiebreak.contenders, mode)
  if (top.length === 1) return { kind: 'winner', index: top[0] }
  return { kind: 'continue', tiebreak: { contenders: top, played: [], round: tiebreak.round + 1 } }
}

/**
 * Places for the final ranking: equal standing shares a place ("1, 2, 2, 4").
 * The winner always comes first, even if the measure alone could not separate
 * them (a tiebreak is never needed then, but the guard keeps the list honest).
 */
export function rankPlayers(
  players: Player[],
  mode: GameMode | null,
  winnerName: string
): { player: Player; place: number }[] {
  const sorted = [...players].sort((a, b) => {
    if (a.name === winnerName) return -1
    if (b.name === winnerName) return 1
    return standing(b, mode) - standing(a, mode)
  })
  return sorted.map((player, i) => {
    let place = i + 1
    // Share the place with the one before when equal — never with the winner.
    for (let j = i - 1; j >= 1; j--) {
      if (standing(sorted[j], mode) === standing(player, mode)) place = j + 1
      else break
    }
    return { player, place }
  })
}
