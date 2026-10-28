/**
 * Which devices a player plays on (pure). A person has one seat; an online
 * team has one per member (`Player.seats`, aligned with `members`), and the
 * member whose turn it is acts for the team. Bots have none — the host's
 * device plays them.
 */
import type { Player } from '@/types'

export function seatsOf(p: Player | undefined): number[] {
  if (!p) return []
  if (p.seats && p.seats.length > 0) return p.seats
  return p.seat === undefined ? [] : [p.seat]
}

/** The seat that acts for this player now (a team: its member on turn). */
export function turnSeat(p: Player | undefined): number | undefined {
  if (!p) return undefined
  if (p.seats && p.seats.length > 0) return p.seats[(p.memberTurn ?? 0) % p.seats.length]
  return p.seat
}
