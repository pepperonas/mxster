/**
 * When a round is over (pure). Who wins is decided afterwards by the leaders
 * (game/tiebreak.ts) — a shared lead goes into a tiebreak.
 *  - Eigene Zeitleiste: as soon as anyone has `goal` correct cards (with
 *    challenges, a card can also land on someone who is not on turn).
 *  - Gemeinsame Zeitleiste: as soon as `goal` cards lie on the shared timeline.
 *  - Hardcore: once everyone has played `goal` songs.
 */
import type { GameMode, Player } from '@/types'

export const GOAL_OPTIONS = [5, 10, 15] as const
export const DEFAULT_GOAL = 10

export const GOAL_LABEL: Record<number, string> = { 5: 'Kurz', 10: 'Normal', 15: 'Lang' }
const GOAL_WORD: Record<number, string> = { 5: 'fünf', 10: 'zehn', 15: 'fünfzehn' }

export function goalWord(goal: number): string {
  return GOAL_WORD[goal] ?? String(goal)
}

export function isRoundOver(players: Player[], mode: GameMode | string | null, goal: number): boolean {
  if (players.length === 0) return false
  if (mode === 'hardcore') return players.every((p) => p.cards >= goal)
  if (mode === 'timeline_global') return players.reduce((sum, p) => sum + p.cards, 0) >= goal
  return players.some((p) => p.cards >= goal)
}
