/**
 * Achievements of an online round on a player's own device.
 *
 * The host's device runs the round and evaluates achievements for everyone —
 * into the host's account. A player with an account evaluates the same rules
 * when the final result arrives and keeps only what belongs to their own
 * seat, filed under their own name: the unlock cards show on their device
 * and the points count for their rank and the leaderboard.
 */
import type { HistoryEntry, Player, TurnRecord } from '@/types'
import type { AchievementEffect } from '@/game/achievementEngine'
import { endOfRoundAchievements, historyAchievements, peopleOf, roundCounters } from '@/game/achievementRules'
import { seatsOf } from './seats'

/** The person playing at `seat` (a team: its member at that seat). */
export function personAtSeat(players: Player[], seat: number | null): string | null {
  if (seat === null) return null
  for (const p of players) {
    if (p.isBot) continue
    const seats = seatsOf(p)
    const i = seats.indexOf(seat)
    if (i === -1) continue
    return p.members?.length ? (p.members[i] ?? null) : p.name
  }
  return null
}

export interface OwnRoundInput {
  /** The live round on this device (seats, bots). */
  live: Player[]
  seat: number | null
  /** The account holder's achievement name (ownPlayerName). */
  ownName: string
  /** The checked final result. */
  result: { winner: Pick<Player, 'name' | 'cards' | 'score'>; players: Player[]; gameMode: string; turns: TurnRecord[] }
  /** This account's rounds, the new one first. */
  games: HistoryEntry[]
  entry: HistoryEntry | null
  durationMinutes: number
  finishedAt: number
  genreOf: (songId: string) => string | undefined
}

export function ownRoundAchievements(input: OwnRoundInput): AchievementEffect[] {
  const me = personAtSeat(input.live, input.seat)
  if (!me) return []
  const { result } = input
  // Bots come from the live round: the checked result does not carry the flag
  const bots = new Set(input.live.filter((p) => p.isBot).map((p) => p.name))
  const players = result.players.map((p) => (bots.has(p.name) ? { ...p, isBot: true } : p))
  const winner = players.find((p) => p.name === result.winner.name) ?? ({ ...result.winner, timeline: [] } as Player)
  const team = players.find((p) => p.members?.includes(me))
  const points = (team ? 0 : players.find((p) => p.name === me)?.score) ?? 0
  const effects = [
    // Everyone of the round as on the host, so "full house" and the like count the same
    ...endOfRoundAchievements({
      mode: result.gameMode,
      people: peopleOf(players),
      players,
      winner,
      durationMinutes: input.durationMinutes,
      turns: result.turns,
      genreOf: input.genreOf,
      finishedAt: input.finishedAt
    }),
    ...historyAchievements(me, input.games),
    ...roundCounters(me, input.games, input.entry, points)
  ]
  return effects.filter((fx) => fx.player === me).map((fx) => ({ ...fx, player: input.ownName }))
}
