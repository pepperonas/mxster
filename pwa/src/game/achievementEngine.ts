/**
 * Applying achievement effects to the stored document (pure).
 *
 * All effects of one moment go through here in one step, against the latest
 * document: the old context wrote each change from a snapshot taken at render
 * time, so a burst of changes (end of a round) overwrote each other and new
 * people vanished again. Nothing is mutated; progress never goes down (the
 * history is cut at 50 rounds, and devices merge with max as well).
 */
import { ACHIEVEMENT_DEFINITIONS, AchievementId, type Achievement, type PlayerAchievements } from '@/types/achievements'
import type { AchievementDoc } from '@/sync/merge'

export type AchievementEffect =
  | { type: 'unlock'; player: string; id: AchievementId }
  /** Progress towards a target; the stored value only ever grows. */
  | { type: 'progress'; player: string; id: AchievementId; value: number }
  /** Counting up (rounds played, points): stored + value, at least `atLeast`. */
  | { type: 'add'; player: string; id: AchievementId; value: number; atLeast?: number }

export interface Unlocked {
  player: string
  id: AchievementId
  achievement: Achievement
}

export function initializePlayerAchievements(playerName: string): PlayerAchievements {
  return {
    playerName,
    achievements: Object.values(ACHIEVEMENT_DEFINITIONS).map((def) => ({
      ...def,
      unlocked: false,
      progress: def.target ? 0 : undefined
    })),
    stats: {
      totalGames: 0,
      totalWins: 0,
      consecutiveWins: 0,
      totalPoints: 0,
      perfectStreakCurrent: 0,
      perfectStreakBest: 0
    }
  }
}

/** Every current achievement present (documents from older versions lack some). */
function complete(p: PlayerAchievements): PlayerAchievements {
  const have = new Set(p.achievements.map((a) => a.id))
  const missing = Object.values(ACHIEVEMENT_DEFINITIONS).filter((d) => !have.has(d.id))
  if (missing.length === 0) return p
  return {
    ...p,
    achievements: [...p.achievements, ...missing.map((d) => ({ ...d, unlocked: false, progress: d.target ? 0 : undefined }))]
  }
}

export function applyAchievementEffects(
  doc: AchievementDoc,
  effects: AchievementEffect[],
  now: number
): { doc: AchievementDoc; unlocked: Unlocked[] } {
  if (effects.length === 0) return { doc, unlocked: [] }
  const out: AchievementDoc = { ...doc }
  const unlocked: Unlocked[] = []
  const touched = new Set<string>()

  const person = (name: string): PlayerAchievements => {
    if (!touched.has(name)) {
      touched.add(name)
      const base = out[name] ? complete(out[name]) : initializePlayerAchievements(name)
      out[name] = { ...base, achievements: base.achievements.map((a) => ({ ...a })) }
    }
    return out[name]
  }

  const unlock = (name: string, a: Achievement) => {
    if (a.unlocked) return
    a.unlocked = true
    a.unlockedAt = now
    unlocked.push({ player: name, id: a.id, achievement: { ...a } })
  }

  for (const fx of effects) {
    const a = person(fx.player).achievements.find((x) => x.id === fx.id)
    if (!a) continue
    if (fx.type === 'unlock') {
      unlock(fx.player, a)
      continue
    }
    if (a.target === undefined) continue
    const current = a.progress ?? 0
    const next = fx.type === 'add' ? Math.max(current + fx.value, fx.atLeast ?? 0) : Math.max(current, fx.value)
    a.progress = Math.min(next, a.target)
    if (a.progress >= a.target) unlock(fx.player, a)
  }

  return { doc: out, unlocked }
}
