/**
 * Teams (pure). A team plays like one player — one timeline, one score, one
 * set of challenges — and its members take turns at the controls in order.
 */
import type { Player } from '@/types'
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'

export const MIN_TEAM_PEOPLE = 4

/**
 * Team names and their accent, in the order teams are created. The name is a
 * getter (current language); a team keeps the name it was created with.
 */
export const TEAMS = [
  {
    get name() {
      return msg(modesText).teamMagenta
    },
    tone: 'primary'
  },
  {
    get name() {
      return msg(modesText).teamOrange
    },
    tone: 'tertiary'
  },
  {
    get name() {
      return msg(modesText).teamViolet
    },
    tone: 'secondary'
  },
  {
    get name() {
      return msg(modesText).teamGreen
    },
    tone: 'success'
  }
] as const

export type TeamTone = (typeof TEAMS)[number]['tone']

export function isTeam(player: Player | undefined): boolean {
  return Boolean(player?.members && player.members.length > 0)
}

/** The member at the controls (undefined for a plain player). */
export function activeMember(player: Player | undefined): string | undefined {
  if (!player?.members?.length) return undefined
  return player.members[(player.memberTurn ?? 0) % player.members.length]
}

/** Who is addressed on a turn: the member at the controls, or the player. */
export function turnName(player: Player): string {
  return activeMember(player) ?? player.name
}

/**
 * Split people into `count` teams, as evenly as possible, in a random order
 * (`rand` for tests). Returns the member lists.
 */
export function splitIntoTeams(people: string[], count: number, rand: () => number = Math.random): string[][] {
  const n = Math.max(2, Math.min(count, TEAMS.length, Math.floor(people.length / 2)))
  const shuffled = [...people]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const teams: string[][] = Array.from({ length: n }, () => [])
  shuffled.forEach((name, i) => teams[i % n].push(name))
  return teams
}

/** Most teams that still give everyone a partner. */
export function maxTeams(peopleCount: number): number {
  return Math.max(2, Math.min(TEAMS.length, Math.floor(peopleCount / 2)))
}

/** Letter for avatars: a team shows its colour word's initial, not the "T". */
export function initialOf(name: string): string {
  return (name.replace(/^Team\s+/i, '').trim()[0] ?? '?').toUpperCase()
}
