/**
 * "Gemeinsam im Raum": which device plays the music (pure).
 *
 * A connected screen (TV mode) plays everything — it is the loudspeaker of the
 * room. Otherwise the device of whoever is on turn, so the song comes out of
 * the phone in their hand. The host takes over when that seat cannot play:
 * not connected, skipped as absent, left the round, or no seat at all (bots).
 */
import type { Player } from '@/types'
import { turnSeat } from './seats'

export interface MusicMember {
  seat: number
  online: boolean
  left?: boolean
  host?: boolean
  display?: boolean
}

export function musicSeat(
  players: Player[],
  currentPlayer: number,
  absent: readonly number[],
  members: MusicMember[],
  hostSeat: number
): number {
  const screen = members.find((m) => m.display && m.online && !m.left)
  if (screen) return screen.seat
  const p = players[currentPlayer]
  const seat = turnSeat(p)
  if (!p || seat === undefined || p.left || absent.includes(currentPlayer)) return hostSeat
  const m = members.find((x) => x.seat === seat)
  if (!m || !m.online || m.left) return hostSeat
  return seat
}
