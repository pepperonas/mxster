/**
 * Who may do what in an online round (pure). The same rules decide on the
 * host's device whether an incoming intent is carried out, and on every device
 * which controls are live.
 *
 * - The player on turn draws, places, guesses, skips; the placer reveals
 *   ("no objection") and continues after the result.
 * - Only seats the game offers an objection to may object; only the objector
 *   picks the gap.
 * - The host may additionally draw, reveal and continue for anyone: when a
 *   phone runs out of battery, the round must not get stuck.
 */
import type { Player } from '@/types'
import type { PendingPlacement, Reveal, TurnPhase } from '@/game/turn'
import type { Intent } from './protocol'

export interface TurnView {
  phase: TurnPhase
  players: Player[]
  currentPlayer: number
  pending: PendingPlacement | null
  reveal: Reveal | null
}

export function indexOfSeat(players: Player[], seat: number): number {
  return players.findIndex((p) => p.seat === seat)
}

const seatAt = (players: Player[], index: number | null | undefined) => (index == null ? undefined : players[index]?.seat)

export function mayAct(view: TurnView, seat: number, action: Intent['action'], isHost = false): boolean {
  const { phase, players, currentPlayer, pending, reveal } = view
  const onTurn = seatAt(players, currentPlayer) === seat
  const me = indexOfSeat(players, seat)
  switch (action) {
    case 'draw':
      return phase === 'idle' && (onTurn || isHost)
    case 'place':
      return phase === 'placing' && onTurn
    case 'guess':
    case 'skip':
      return phase === 'guessing' && onTurn
    case 'challenge':
      return phase === 'challenge' && !!pending && pending.choosing === null && me >= 0 && pending.challengers.includes(me)
    case 'claim':
    case 'cancelChallenge':
      return phase === 'challenge' && !!pending && pending.choosing !== null && pending.choosing === me
    case 'reveal':
      return phase === 'challenge' && !!pending && pending.choosing === null && (seatAt(players, pending.playerIndex) === seat || isHost)
    case 'continue':
      return phase === 'revealed' && !!reveal && (seatAt(players, reveal.playerIndex) === seat || isHost)
  }
}
