import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ownRoundAchievements, personAtSeat } from '../ownAchievements'
import { AchievementId } from '@/types/achievements'
import { GameMode, type Player, type TurnRecord } from '@/types'

const pl = (name: string, extra: Partial<Player> = {}) => ({ name, timeline: [], cards: 0, score: 0, ...extra }) as Player
const turn = (p: string, ok: boolean, first = false): TurnRecord => ({ p, s: `s-${p}-${Math.random()}`, y: 1985, ok, first }) as TurnRecord

const live = [pl('Anna', { seat: 0 }), pl('Ben', { seat: 1 }), pl('Bot', { isBot: true }), pl('Team Rot', { members: ['Cleo', 'Dan'], seats: [2, 3] })]

const input = (seat: number | null, winner = 'Ben') => {
  const players = [pl('Anna', { cards: 3 }), pl('Ben', { cards: 5 }), pl('Bot', { cards: 2 }), pl('Team Rot', { members: ['Cleo', 'Dan'], cards: 1 })]
  return {
    live,
    seat,
    ownName: 'Benjamin',
    result: { winner: players.find((p) => p.name === winner)!, players, gameMode: GameMode.TIMELINE_PERSONAL, turns: [turn('Ben', true, true), turn('Ben', true), turn('Anna', false)] },
    games: [],
    entry: null,
    durationMinutes: 12,
    finishedAt: new Date(2026, 9, 28, 20, 0).getTime(),
    genreOf: () => undefined
  }
}

describe('achievements of an online round on a player’s own device', () => {
  it('finds the person at a seat: a player, a team member, never a bot', () => {
    expect(personAtSeat(live, 1)).toBe('Ben')
    expect(personAtSeat(live, 3)).toBe('Dan')
    expect(personAtSeat(live, 7)).toBeNull()
    expect(personAtSeat(live, null)).toBeNull()
  })

  it('keeps only what belongs to the own seat, filed under the account’s name', () => {
    const fx = ownRoundAchievements(input(1))
    expect(fx.length).toBeGreaterThan(0)
    expect(new Set(fx.map((f) => f.player))).toEqual(new Set(['Benjamin']))
    const unlocked = fx.filter((f) => f.type === 'unlock').map((f) => f.id)
    expect(unlocked).toContain(AchievementId.FIRST_ROUND)
    expect(unlocked).toContain(AchievementId.FIRST_WIN)
  })

  it('someone else’s win is not mine', () => {
    const fx = ownRoundAchievements(input(0))
    expect(fx.filter((f) => f.type === 'unlock').map((f) => f.id)).not.toContain(AchievementId.FIRST_WIN)
    expect(fx.filter((f) => f.type === 'unlock').map((f) => f.id)).toContain(AchievementId.FIRST_ROUND)
  })

  it('a team member is credited too; no seat, nothing', () => {
    expect(ownRoundAchievements(input(3)).some((f) => f.player === 'Benjamin' && f.type === 'unlock' && f.id === AchievementId.FIRST_ROUND)).toBe(true)
    expect(ownRoundAchievements(input(null))).toEqual([])
  })

  it('the room saves the result and then evaluates it, once, into the account', () => {
    const src = readFileSync(join(process.cwd(), 'src/screens/RoomScreen.tsx'), 'utf8')
    const hook = src.slice(src.indexOf('function useSaveOnlineResult'), src.indexOf('function RoomProblem'))
    expect(hook).toContain('if (saved.current === key || wasSaved(key)) return')
    expect(hook.indexOf('saveGame(')).toBeLessThan(hook.indexOf('applyEffects('))
    expect(hook).toContain('ownRoundAchievements({')
    expect(hook).toContain("if (!account || room.role !== 'player' || !result) return")
  })
})
