/**
 * When a round is over (pure). Who wins is decided afterwards by the leaders
 * (game/tiebreak.ts) — a shared lead goes into a tiebreak.
 *  - Eigene Zeitleiste: as soon as anyone has `goal` correct cards (with
 *    challenges, a card can also land on someone who is not on turn).
 *  - Gemeinsame Zeitleiste: as soon as `goal` cards lie on the shared timeline.
 *  - Hardcore: once everyone has played `goal` songs.
 */
import type { GameMode, Player } from '@/types'
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'

export const GOAL_OPTIONS = [5, 10, 15] as const
export const DEFAULT_GOAL = 10

/** Round length labels (getters: current language on every read). */
export const GOAL_LABEL: Record<number, string> = {
  get 5() {
    return msg(modesText).goalShort
  },
  get 10() {
    return msg(modesText).goalNormal
  },
  get 15() {
    return msg(modesText).goalLong
  }
}

/** The goal as a word ("zehn" / "ten"), digits for anything else. */
export function goalWord(goal: number): string {
  const t = msg(modesText)
  const words: Record<number, string> = { 5: t.goal5, 10: t.goal10, 15: t.goal15 }
  return words[goal] ?? String(goal)
}

export function isRoundOver(players: Player[], mode: GameMode | string | null, goal: number): boolean {
  if (players.length === 0) return false
  if (mode === 'hardcore') return players.every((p) => p.cards >= goal)
  if (mode === 'timeline_global') return players.reduce((sum, p) => sum + p.cards, 0) >= goal
  return players.some((p) => p.cards >= goal)
}
