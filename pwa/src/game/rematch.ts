/**
 * Again with the same people: whoever came last starts. On a shared last
 * place the first of them in seat order; the winner never (after a tiebreak
 * the winner can share the standing with everyone else).
 */
import type { GameMode, Player } from '@/types'
import { standing } from './tiebreak'

/** Index into `players` (the players of the next round, leavers already out). */
export function rematchStarter(players: Player[], mode: GameMode | null, winnerName?: string): number {
  const candidates = players.map((p, i) => ({ p, i })).filter(({ p }) => p.name !== winnerName)
  if (candidates.length === 0) return 0
  const lowest = Math.min(...candidates.map(({ p }) => standing(p, mode)))
  return candidates.find(({ p }) => standing(p, mode) === lowest)!.i
}
