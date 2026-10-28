/**
 * Achievement points: every achievement is worth 50–250 points (steps of 50)
 * by how hard it is, so people can be compared by more than a count.
 *
 *   50  a first step anyone takes in an evening
 *  100  a good round or some regular play
 *  150  needs skill or weeks of play
 *  200  a really strong round, or months of play
 *  250  the hardest: flawless, legendary, years
 *
 * The total places a person on a rank named like a record's certification,
 * from Demo to Legende. Pure module, no React.
 */
import { AchievementId, type Achievement } from '@/types/achievements'
import type { IconName } from '@/components/ui/Icon'

export type AchievementPoints = 50 | 100 | 150 | 200 | 250

export const ACHIEVEMENT_POINTS: Record<AchievementId, AchievementPoints> = {
  // 50 — first steps
  [AchievementId.FIRST_ROUND]: 50,
  [AchievementId.FIRST_WIN]: 50,
  [AchievementId.DAILY_FIRST]: 50,
  [AchievementId.NIGHT_OWL]: 50,
  [AchievementId.EARLY_BIRD]: 50,
  [AchievementId.OBJECTION_WON]: 50,
  [AchievementId.BOT_SLAYER_EASY]: 50,
  [AchievementId.ZEITMASCHINE]: 50,
  [AchievementId.SOCIAL_BUTTERFLY]: 50,
  // 100 — a good round, some regular play
  [AchievementId.REGULAR]: 100,
  [AchievementId.HOT_STREAK]: 100,
  [AchievementId.GENRE_HOPPER]: 100,
  [AchievementId.LONG_ROUND]: 100,
  [AchievementId.FULL_HOUSE]: 100,
  [AchievementId.TEAM_SPIRIT]: 100,
  [AchievementId.BOT_SLAYER_MEDIUM]: 100,
  [AchievementId.FULL_SCORE]: 100,
  [AchievementId.LIGHTNING_FAST]: 100,
  [AchievementId.PUNKTEJAEGER]: 100,
  [AchievementId.MUSIC_EXPERT]: 100,
  [AchievementId.COLLECTOR]: 100,
  // 150 — skill or weeks of play
  [AchievementId.TIME_TRAVELER]: 150,
  [AchievementId.WINNER_10]: 150,
  [AchievementId.UNBEATABLE]: 150,
  [AchievementId.DECADE_MASTER]: 150,
  [AchievementId.COMEBACK_KING]: 150,
  [AchievementId.NAME_DROPPER]: 150,
  [AchievementId.BOT_SLAYER_HARD]: 150,
  [AchievementId.STAR_LAWYER]: 150,
  [AchievementId.OLDIE_EXPERT]: 150,
  [AchievementId.ZEITGEIST]: 150,
  [AchievementId.EXACT_YEAR]: 150,
  [AchievementId.TITLE_HERO]: 150,
  [AchievementId.DAILY_REGULAR]: 150,
  [AchievementId.MARATHON_RUNNER]: 150,
  // 200 — a really strong round, or months of play
  [AchievementId.PERFECTIONIST]: 200,
  [AchievementId.PERFECT_STREAK]: 200,
  [AchievementId.HARDCORE_CHAMPION]: 200,
  [AchievementId.ALL_OVER]: 200,
  [AchievementId.UNSTOPPABLE]: 200,
  [AchievementId.WINNER_25]: 200,
  [AchievementId.ARTIST_EXPERT]: 200,
  [AchievementId.MASTER_OF_TIME]: 200,
  [AchievementId.COMEBACK_PROFI]: 200,
  [AchievementId.DAILY_PERFECT]: 200,
  [AchievementId.CENTURION]: 200,
  // 250 — the hardest
  [AchievementId.FLAWLESS_VICTORY]: 250,
  [AchievementId.LEGENDARY_STREAK]: 250,
  [AchievementId.GRAND_MASTER]: 250,
  [AchievementId.ARCHIVIST]: 250
}

export function pointsFor(id: AchievementId): number {
  return ACHIEVEMENT_POINTS[id] ?? 0
}

/** Everything there is to earn. */
export const MAX_POINTS = Object.values(ACHIEVEMENT_POINTS).reduce((a, b) => a + b, 0)

/** Points of a person's unlocked achievements (each counted once). */
export function totalPoints(list: readonly Pick<Achievement, 'id' | 'unlocked'>[]): number {
  const seen = new Set<string>()
  let sum = 0
  for (const a of list) {
    if (!a.unlocked || seen.has(a.id)) continue
    seen.add(a.id)
    sum += pointsFor(a.id)
  }
  return sum
}

/** Points a person earned from `since` on (e.g. this round). */
export function pointsSince(list: readonly Achievement[], since: number): number {
  return totalPoints(list.filter((a) => a.unlocked && typeof a.unlockedAt === 'number' && a.unlockedAt >= since))
}

export type RankId = 'demo' | 'single' | 'album' | 'gold' | 'platinum' | 'diamond' | 'legend'

export interface Rank {
  id: RankId
  min: number
  icon: IconName
}

/** Ranks like a record's certification. The last needs most of all points. */
export const RANKS: Rank[] = [
  { id: 'demo', min: 0, icon: 'mic' },
  { id: 'single', min: 250, icon: 'note' },
  { id: 'album', min: 750, icon: 'album' },
  { id: 'gold', min: 1500, icon: 'medal' },
  { id: 'platinum', min: 2750, icon: 'premium' },
  { id: 'diamond', min: 4250, icon: 'diamond' },
  { id: 'legend', min: 6000, icon: 'sparkle' }
]

export interface RankStanding {
  rank: Rank
  next: Rank | null
  /** Points still missing for the next rank (0 at the top). */
  toNext: number
  /** 0…1 of the way from this rank to the next (1 at the top). */
  progress: number
}

export function rankFor(points: number): RankStanding {
  const p = Math.max(0, points)
  let i = 0
  while (i + 1 < RANKS.length && p >= RANKS[i + 1].min) i++
  const rank = RANKS[i]
  const next = RANKS[i + 1] ?? null
  if (!next) return { rank, next, toNext: 0, progress: 1 }
  return { rank, next, toNext: next.min - p, progress: (p - rank.min) / (next.min - rank.min) }
}

export interface BoardEntry {
  key: string
  name: string
  points: number
  unlocked: number
  picture?: string
  me?: boolean
  friend?: boolean
}

/** Highest points first; on a tie more achievements, then by name. Places are shared on a full tie. */
export function rankBoard(entries: BoardEntry[]): (BoardEntry & { place: number })[] {
  const sorted = [...entries].sort((a, b) => b.points - a.points || b.unlocked - a.unlocked || a.name.localeCompare(b.name))
  let place = 0
  return sorted.map((e, i) => {
    const prev = sorted[i - 1]
    if (!prev || prev.points !== e.points || prev.unlocked !== e.unlocked) place = i + 1
    return { ...e, place }
  })
}
