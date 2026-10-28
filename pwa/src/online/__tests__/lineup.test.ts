import { describe, it, expect } from 'vitest'
import { buildLineup, teamsPossible } from '../lineup'
import { indexOfSeat, mayAct } from '../rules'
import { seatsOf, turnSeat } from '../seats'
import { musicSeat } from '../musicSeat'
import type { Member } from '../protocol'

const member = (seat: number, name: string, extra: Partial<Member> = {}): Member => ({
  seat,
  name,
  guest: false,
  host: seat === 0,
  picture: '',
  online: true,
  left: false,
  userId: seat,
  ...extra
})

describe('online line-up', () => {
  it('screens never play, bots come after the people', () => {
    const players = buildLineup([member(0, 'Martin'), member(1, 'TV', { display: true }), member(2, 'Lisa')], { bots: 2 })
    expect(players.map((p) => p.name)).toEqual(['Martin', 'Lisa', expect.any(String), expect.any(String)])
    expect(players.slice(2).every((p) => p.isBot && p.seat === undefined)).toBe(true)
  })

  it('teams carry one seat per member, the member on turn acts', () => {
    const ms = [member(0, 'A'), member(1, 'B'), member(2, 'C'), member(3, 'D')]
    expect(teamsPossible(ms)).toBe(2)
    const teams = buildLineup(ms, { teams: 2, bots: 3 }, () => 0.3)
    expect(teams).toHaveLength(2)
    expect(teams.every((t) => !t.isBot)).toBe(true)
    const t0 = teams[0]
    expect(t0.seats).toHaveLength(t0.members!.length)
    expect(turnSeat(t0)).toBe(t0.seats![0])
    expect(turnSeat({ ...t0, memberTurn: 1 })).toBe(t0.seats![1])
    // Every member's device belongs to the team; only the one on turn places
    for (const s of seatsOf(t0)) expect(indexOfSeat(teams, s)).toBe(0)
    const view = { phase: 'placing' as const, players: teams, currentPlayer: 0, pending: null, reveal: null }
    expect(mayAct(view, t0.seats![0], 'place')).toBe(true)
    expect(mayAct(view, t0.seats![1], 'place')).toBe(false)
  })

  it('too few people for teams: plain seats', () => {
    expect(buildLineup([member(0, 'A'), member(1, 'B'), member(2, 'C')], { teams: 2 })).toHaveLength(3)
  })

  it('a connected screen plays the music', () => {
    const players = buildLineup([member(0, 'A'), member(1, 'B')])
    const members = [member(0, 'A'), member(1, 'B'), member(5, 'TV', { display: true })]
    expect(musicSeat(players, 1, [], members, 0)).toBe(5)
    expect(musicSeat(players, 1, [], [...members.slice(0, 2), member(5, 'TV', { display: true, online: false })], 0)).toBe(1)
  })

  it('a bot turn: music at the host', () => {
    const players = buildLineup([member(0, 'A')], { bots: 1 })
    expect(musicSeat(players, 1, [], [member(0, 'A'), member(1, 'B')], 0)).toBe(0)
  })
})
