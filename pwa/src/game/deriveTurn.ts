/**
 * What the game state says about the turn (pure): the phase, who is on turn
 * and which timeline they play on. Shared by the local flow (one device, or
 * the host) and the remote flow (a player mirroring the host's state).
 */
import type { GameMode, GlobalTimelineCard, Player, Song } from '@/types'
import type { PendingPlacement, Reveal, TurnPhase } from './turn'
import { timelineSongsFor } from './placement'

export interface TurnInput {
  gameMode: GameMode | null
  players: Player[]
  currentPlayer: number
  currentSong: Song | null
  globalTimeline: GlobalTimelineCard[]
  reveal: Reveal | null
  pending: PendingPlacement | null
  finished: boolean
}

export function derivePhase({ finished, reveal, pending, currentSong, gameMode }: TurnInput): TurnPhase {
  if (finished) return 'over'
  if (reveal) return 'revealed'
  if (pending) return 'challenge'
  if (!currentSong) return 'idle'
  return gameMode === 'hardcore' ? 'guessing' : 'placing'
}

export function deriveTurn(input: TurnInput) {
  const activePlayer: Player | undefined = input.players[input.currentPlayer]
  return {
    phase: derivePhase(input),
    activePlayer,
    activeTimeline: timelineSongsFor(input.gameMode, activePlayer, input.globalTimeline)
  }
}
