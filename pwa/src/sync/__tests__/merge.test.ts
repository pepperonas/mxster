import { describe, it, expect } from 'vitest'
import { mergeHistory, mergeAchievements, mergeSettings } from '../merge'
import type { HistoryEntry } from '@/types'
import type { PlayerAchievements } from '@/types/achievements'

const game = (id: number): HistoryEntry =>
  ({ id, timestamp: id, date: new Date(id).toISOString(), winner: { name: 'A', cards: 1, score: 0 }, players: [], gameMode: 'hardcore' }) as unknown as HistoryEntry

const player = (unlocked: boolean, progress: number, unlockedAt?: number, wins = 0): PlayerAchievements =>
  ({
    playerName: 'A',
    achievements: [{ id: 'x', name: 'X', description: '', icon: '', unlocked, unlockedAt, progress, target: 5 }],
    stats: { totalGames: 1, totalWins: wins, consecutiveWins: 0, totalPoints: 0, perfectStreakCurrent: 0, perfectStreakBest: 0 }
  }) as unknown as PlayerAchievements

describe('mergeHistory', () => {
  it('unites both sides by id, newest first, no duplicates', () => {
    const merged = mergeHistory([game(3), game(1)], [game(2), game(1)])
    expect(merged.map((g) => g.id)).toEqual([3, 2, 1])
  })
})

describe('mergeAchievements', () => {
  it('never loses an unlock and keeps the earliest time and the highest progress', () => {
    const merged = mergeAchievements({ A: player(false, 4, undefined, 2) }, { A: player(true, 2, 1000, 5) })
    const a = merged.A.achievements[0]
    expect(a.unlocked).toBe(true)
    expect(a.unlockedAt).toBe(1000)
    expect(a.progress).toBe(4)
    expect(merged.A.stats.totalWins).toBe(5)
  })

  it('keeps players that exist on only one side', () => {
    const merged = mergeAchievements({ A: player(false, 0) }, { B: { ...player(false, 0), playerName: 'B' } })
    expect(Object.keys(merged).sort()).toEqual(['A', 'B'])
  })
})

describe('mergeSettings', () => {
  it('lets the local edit win and unites saved players', () => {
    const merged = mergeSettings(
      { theme: 'light', savedPlayers: ['Anna'] },
      { theme: 'dark', savedPlayers: ['Tom', 'Anna'] }
    )
    expect(merged.theme).toBe('light')
    expect(merged.savedPlayers.sort()).toEqual(['Anna', 'Tom'])
  })
})
