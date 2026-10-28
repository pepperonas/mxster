/**
 * "Gemeinsam im Raum": which device plays the music (pure).
 *
 * The device of whoever is on turn, so the song comes out of the phone in
 * their hand. The host takes over when that seat cannot play: not connected,
 * skipped as absent, left the round, or no seat at all.
 */
import type { Player } from '@/types'

export interface MusicMember {
  seat: number
  online: boolean
  left?: boolean
  host?: boolean
}

export function musicSeat(
  players: Player[],
  currentPlayer: number,
  absent: readonly number[],
  members: MusicMember[],
  hostSeat: number
): number {
  const p = players[currentPlayer]
  if (!p || p.seat === undefined || p.left || absent.includes(currentPlayer)) return hostSeat
  const m = members.find((x) => x.seat === p.seat)
  if (!m || !m.online || m.left) return hostSeat
  return p.seat
}
