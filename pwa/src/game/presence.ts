/**
 * Who is still at the table in an online round (pure).
 *
 * - A player who **left** on purpose is out for the rest of the round: never
 *   on turn again, never the winner; the seat stays for the results.
 * - A player whose device lost the connection is **away** once that lasted
 *   `AWAY_GRACE_MS`: their turns are skipped until they are back. A short
 *   network hiccup costs nothing.
 *
 * The host's device decides (it runs the game); `absent` travels in the
 * snapshot so every device shows the same picture.
 */
import type { Player } from '@/types'
import type { PendingPlacement, Reveal, TurnPhase } from './turn'

export const AWAY_GRACE_MS = 30_000

export interface SeatPresence {
  seat: number
  online: boolean
  left: boolean
}

/**
 * Player indices whose turns are skipped. `offlineSince` maps a seat to the
 * moment (local ms) its connection was seen to drop. `hostSeat` is never
 * absent — the host's device runs the round.
 */
export function absentPlayers(
  players: Player[],
  members: SeatPresence[],
  offlineSince: ReadonlyMap<number, number>,
  now: number,
  hostSeat: number | null,
  grace = AWAY_GRACE_MS
): number[] {
  const bySeat = new Map(members.map((m) => [m.seat, m]))
  const out: number[] = []
  players.forEach((p, i) => {
    if (p.left) return void out.push(i)
    if (p.seat === undefined || p.seat === hostSeat) return
    const m = bySeat.get(p.seat)
    // Not in the roster any more counts as gone
    if (!m || m.left) return void out.push(i)
    if (m.online) return
    const since = offlineSince.get(p.seat)
    if (since !== undefined && now - since >= grace) out.push(i)
  })
  return out
}

/**
 * Next index after `current` in `order` (wrapping) that is not absent. When
 * everyone else is absent the turn stays where it is.
 */
export function nextPresent(order: number[], current: number, absent: readonly number[]): number {
  if (order.length === 0) return current
  const start = order.findIndex((i) => i > current)
  const rotated = start < 0 ? order : [...order.slice(start), ...order.slice(0, start)]
  return rotated.find((i) => !absent.includes(i)) ?? (order.includes(current) ? current : rotated[0])
}

export interface StuckView {
  phase: TurnPhase
  currentPlayer: number
  pending: PendingPlacement | null
  reveal: Reveal | null
}

/** The step that frees a round waiting on an absent player, or null. */
export type Unstick = 'pass' | 'cancelChallenge' | 'reveal' | 'continue'

export function unstick({ phase, currentPlayer, pending, reveal }: StuckView, absent: readonly number[]): Unstick | null {
  const gone = (i: number | null | undefined) => i != null && absent.includes(i)
  switch (phase) {
    case 'idle':
    case 'placing':
    case 'guessing':
      return gone(currentPlayer) ? 'pass' : null
    case 'challenge':
      if (!pending) return null
      if (pending.choosing !== null) return gone(pending.choosing) ? 'cancelChallenge' : null
      return gone(pending.playerIndex) ? 'reveal' : null
    case 'revealed':
      return reveal && gone(reveal.playerIndex) ? 'continue' : null
    default:
      return null
  }
}

/** Indices still in the round (not left). */
export function stillIn(players: Player[]): number[] {
  return players.flatMap((p, i) => (p.left ? [] : [i]))
}
