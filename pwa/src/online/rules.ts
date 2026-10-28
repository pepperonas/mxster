/**
 * Who may do what in an online round (pure). The same rules decide on the
 * host's device whether an incoming intent is carried out, and on every device
 * which controls are live.
 *
 * - The player on turn draws, places, guesses, skips, and continues after the
 *   result.
 * - Only seats the game offers an objection to may object or pass ("Kein
 *   Einspruch"); only the objector picks the gap.
 * - Nobody turns a placed card over by hand online: the objection window
 *   (game/objectionWindow.ts) does, once everyone passed or time ran out.
 * - The host may draw and continue for a player who is away (not connected,
 *   or skipped as absent) — and only then — and for bots (they have no device).
 * - Only the player on turn spends a joker (bonus option).
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
  /** Player indices that are not connected or skipped as absent. */
  away?: number[]
}

export function indexOfSeat(players: Player[], seat: number): number {
  return players.findIndex((p) => p.seat === seat)
}

const seatAt = (players: Player[], index: number | null | undefined) => (index == null ? undefined : players[index]?.seat)

export function mayAct(view: TurnView, seat: number, action: Intent['action'], isHost = false): boolean {
  const { phase, players, currentPlayer, pending, reveal, away = [] } = view
  const forAway = (index: number | null | undefined) =>
    isHost && index != null && (away.includes(index) || Boolean(players[index]?.isBot))
  const onTurn = seatAt(players, currentPlayer) === seat
  const me = indexOfSeat(players, seat)
  switch (action) {
    case 'draw':
      return phase === 'idle' && (onTurn || forAway(currentPlayer))
    case 'place':
    case 'swap':
      return phase === 'placing' && onTurn
    case 'guess':
    case 'skip':
      return phase === 'guessing' && onTurn
    case 'challenge':
    case 'pass':
      return (
        phase === 'challenge' &&
        !!pending &&
        pending.choosing === null &&
        me >= 0 &&
        pending.challengers.includes(me) &&
        !(pending.passed ?? []).includes(me)
      )
    case 'claim':
    case 'cancelChallenge':
      return phase === 'challenge' && !!pending && pending.choosing !== null && pending.choosing === me
    case 'reveal':
      return false
    case 'continue':
      return phase === 'revealed' && !!reveal && (seatAt(players, reveal.playerIndex) === seat || forAway(reveal.playerIndex))
  }
}
