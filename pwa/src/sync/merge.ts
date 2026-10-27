/**
 * Merge rules for the per-account documents after a write conflict (two
 * devices wrote in between). Nothing a player earned may be lost.
 */
import type { HistoryEntry } from '@/types'
import type { PlayerAchievements } from '@/types/achievements'

/** Union by game id, newest first. */
export function mergeHistory(local: HistoryEntry[], server: HistoryEntry[]): HistoryEntry[] {
  const byId = new Map<number, HistoryEntry>()
  for (const g of [...server, ...local]) byId.set(g.id, g)
  return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp)
}

export type AchievementDoc = Record<string, PlayerAchievements>

/** Per player and achievement: unlocked wins, earliest unlock time, highest progress and stats. */
export function mergeAchievements(local: AchievementDoc, server: AchievementDoc): AchievementDoc {
  const out: AchievementDoc = { ...server }
  for (const [name, mine] of Object.entries(local)) {
    const theirs = server[name]
    if (!theirs) {
      out[name] = mine
      continue
    }
    const theirById = new Map(theirs.achievements.map((a) => [a.id, a]))
    const achievements = mine.achievements.map((a) => {
      const t = theirById.get(a.id)
      theirById.delete(a.id)
      if (!t) return a
      const unlockedAt = [a.unlockedAt, t.unlockedAt].filter((x): x is number => typeof x === 'number')
      return {
        ...a,
        unlocked: a.unlocked || t.unlocked,
        unlockedAt: unlockedAt.length ? Math.min(...unlockedAt) : undefined,
        progress:
          a.progress === undefined && t.progress === undefined ? undefined : Math.max(a.progress ?? 0, t.progress ?? 0)
      }
    })
    const stats = { ...theirs.stats } as Record<string, number>
    for (const [k, v] of Object.entries(mine.stats as Record<string, number>)) {
      stats[k] = typeof v === 'number' ? Math.max(v, stats[k] ?? 0) : v
    }
    out[name] = {
      ...mine,
      achievements: [...achievements, ...theirById.values()],
      stats: stats as unknown as PlayerAchievements['stats']
    }
  }
  return out
}

/** Settings: the local edit wins field by field, saved players are united. */
export function mergeSettings<T extends { savedPlayers: string[]; recentSongs?: string[] }>(local: T, server: T): T {
  const merged = { ...server, ...local, savedPlayers: [...new Set([...server.savedPlayers, ...local.savedPlayers])] }
  // Recently played songs from both devices: server first, local (newer) last, no doubles
  if (local.recentSongs || server.recentSongs) {
    const keys = [...(server.recentSongs ?? []), ...(local.recentSongs ?? [])]
    merged.recentSongs = keys.filter((k, i) => keys.lastIndexOf(k) === i).slice(-150)
  }
  return merged
}
