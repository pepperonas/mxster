/**
 * Who plays an online round (pure): the room's seats (screens left out),
 * plus bots the host adds — or the people split into teams. Bots and teams
 * do not mix (same rule as on one device).
 */
import type { Player } from '@/types'
import { createBotPlayers } from '@/services/botPlayer'
import { MIN_TEAM_PEOPLE, TEAMS, maxTeams, splitIntoTeams } from '@/game/teams'
import type { Member } from './protocol'

export const MAX_ONLINE_BOTS = 3

export interface LineupOptions {
  bots?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  /** Number of teams (0 or 1: no teams). */
  teams?: number
}

export function playingMembers(members: Member[]): Member[] {
  return members.filter((m) => !m.display && !m.left)
}

export function teamsPossible(members: Member[]): number {
  const n = playingMembers(members).length
  return n >= MIN_TEAM_PEOPLE ? maxTeams(n) : 0
}

export function buildLineup(members: Member[], opts: LineupOptions = {}, rand: () => number = Math.random): Player[] {
  const people = playingMembers(members)
  const teams = Math.min(opts.teams ?? 0, teamsPossible(members))
  if (teams >= 2) {
    const bySeat = new Map(people.map((m) => [m.name, m.seat]))
    return splitIntoTeams(
      people.map((m) => m.name),
      teams,
      rand
    ).map((names, i) => ({
      name: TEAMS[i].name,
      members: names,
      seats: names.map((n) => bySeat.get(n)!),
      memberTurn: 0,
      timeline: [],
      cards: 0,
      score: 0
    }))
  }
  const humans: Player[] = people.map((m) => ({
    name: m.name,
    seat: m.seat,
    guest: m.guest || undefined,
    timeline: [],
    cards: 0,
    score: 0
  }))
  const bots = Math.max(0, Math.min(MAX_ONLINE_BOTS, opts.bots ?? 0))
  return bots > 0 ? [...humans, ...createBotPlayers(bots, opts.difficulty ?? 'medium', humans)] : humans
}
