import { describe, it, expect } from 'vitest'
import { mergeAchievements, mergeHistory, mergeSettings } from '../merge'
import { applyAchievementEffects } from '@/game/achievementEngine'
import { AchievementId } from '@/types/achievements'
import type { HistoryEntry } from '@/types'

const game = (id: number) => ({ id, timestamp: id, players: [] }) as unknown as HistoryEntry

describe('mergeHistory', () => {
  it('lets the local copy of a round win (a rename on this device)', () => {
    const server = [{ ...game(1), winner: { name: 'Old', cards: 0, score: 0 } }] as HistoryEntry[]
    const local = [{ ...game(1), winner: { name: 'New', cards: 0, score: 0 } }] as HistoryEntry[]
    expect(mergeHistory(local, server)[0].winner.name).toBe('New')
  })

  it('handles an empty side', () => {
    expect(mergeHistory([], [game(2), game(1)]).map((g) => g.id)).toEqual([2, 1])
    expect(mergeHistory([game(1)], []).map((g) => g.id)).toEqual([1])
  })
})

describe('mergeSettings', () => {
  const base = { savedPlayers: [] as string[], theme: 'dark' }

  it('keeps a person hidden on one device hidden, and out of the quick picks', () => {
    const merged = mergeSettings(
      { ...base, savedPlayers: ['Anna', 'Ben'], hiddenPlayers: [] },
      { ...base, savedPlayers: ['Ben', 'Cleo'], hiddenPlayers: ['Ben'] }
    )
    expect(merged.hiddenPlayers).toEqual(['Ben'])
    expect(merged.savedPlayers.sort()).toEqual(['Anna', 'Cleo'])
  })

  it('unites recent songs, newest last, no doubles, at most 150', () => {
    const server = Array.from({ length: 150 }, (_, i) => `s${i}`)
    const merged = mergeSettings({ ...base, recentSongs: ['s0', 'new'] }, { ...base, recentSongs: server })
    expect(merged.recentSongs).toHaveLength(150)
    expect(merged.recentSongs!.slice(-2)).toEqual(['s0', 'new'])
    expect(new Set(merged.recentSongs).size).toBe(150)
  })

  it('lets the local choice win field by field', () => {
    expect(mergeSettings({ ...base, theme: 'light' }, { ...base, theme: 'dark' }).theme).toBe('light')
  })
})

describe('mergeAchievements with the engine', () => {
  it('two devices each counting a round end up with both (max, not sum — documented)', () => {
    const start = applyAchievementEffects({}, [{ type: 'progress', player: 'A', id: AchievementId.MARATHON_RUNNER, value: 3 }], 1).doc
    const deviceA = applyAchievementEffects(start, [{ type: 'add', player: 'A', id: AchievementId.MARATHON_RUNNER, value: 1 }], 2).doc
    const deviceB = applyAchievementEffects(start, [{ type: 'add', player: 'A', id: AchievementId.GENRE_HOPPER, value: 2 }], 3).doc
    const merged = mergeAchievements(deviceA, deviceB)
    const a = merged.A.achievements
    expect(a.find((x) => x.id === AchievementId.MARATHON_RUNNER)!.progress).toBe(4)
    expect(a.find((x) => x.id === AchievementId.GENRE_HOPPER)!.progress).toBe(2)
  })

  it('keeps an unlock that only one device saw, with its time', () => {
    const local = applyAchievementEffects({}, [{ type: 'unlock', player: 'A', id: AchievementId.LIGHTNING_FAST }], 50).doc
    const server = applyAchievementEffects({}, [{ type: 'progress', player: 'A', id: AchievementId.ZEITMASCHINE, value: 1 }], 10).doc
    const merged = mergeAchievements(local, server).A.achievements
    const fast = merged.find((x) => x.id === AchievementId.LIGHTNING_FAST)!
    expect(fast.unlocked).toBe(true)
    expect(fast.unlockedAt).toBe(50)
    expect(merged.find((x) => x.id === AchievementId.ZEITMASCHINE)!.progress).toBe(1)
  })
})
