/**
 * Achievement rules (pure), extracted from GameScreen.
 *
 * The functions return *effects* instead of calling the achievement context,
 * so the rules are testable and the caller applies them in the returned order.
 * The order is part of the contract: it matches the previous inline code
 * exactly (progress before/after unlock as it was).
 */
import { AchievementId } from '@/types/achievements'
import type { Player } from '@/types'

export type AchievementEffect =
  | { type: 'unlock'; player: string; id: AchievementId }
  | { type: 'progress'; player: string; id: AchievementId; value: number }

export interface RankingSnapshot {
  turn: number
  rankings: string[]
}

const decadeOf = (year: number) => Math.floor(year / 10) * 10

/** Score thresholds crossed by a single hardcore turn (unlocked in-game). */
export function realtimeScoreAchievements(player: string, oldScore: number, newScore: number): AchievementEffect[] {
  const out: AchievementEffect[] = []
  if (newScore >= 75 && oldScore < 75) out.push({ type: 'unlock', player, id: AchievementId.PUNKTEJAEGER })
  if (newScore >= 125 && oldScore < 125) out.push({ type: 'unlock', player, id: AchievementId.HARDCORE_CHAMPION })
  return out
}

function longestStreak(player: Player, hit: (song: Player['timeline'][number]) => boolean): number {
  let current = 0
  let max = 0
  for (const song of player.timeline) {
    if (hit(song)) {
      current++
      max = Math.max(max, current)
    } else {
      current = 0
    }
  }
  return max
}

export interface EndOfGameInput {
  players: Player[]
  winner: Player
  gameDurationMinutes: number
  rankingsHistory: RankingSnapshot[]
}

/** End-of-game achievements (hardcore mode). History-based checks stay with the context. */
export function endOfGameAchievements({
  players,
  winner,
  gameDurationMinutes,
  rankingsHistory
}: EndOfGameInput): AchievementEffect[] {
  const fx: AchievementEffect[] = []
  const unlock = (player: string, id: AchievementId) => fx.push({ type: 'unlock', player, id })
  const progress = (player: string, id: AchievementId, value: number) => fx.push({ type: 'progress', player, id, value })

  for (const player of players) {
    const isWinner = player.name === winner.name

    const decades = new Set(player.timeline.map((s) => decadeOf(s.year)))
    if (decades.size >= 5) unlock(player.name, AchievementId.TIME_TRAVELER)
    progress(player.name, AchievementId.TIME_TRAVELER, decades.size)

    const decadeCounts: Record<number, number> = {}
    for (const s of player.timeline) decadeCounts[decadeOf(s.year)] = (decadeCounts[decadeOf(s.year)] || 0) + 1
    const maxDecadeCount = Math.max(...Object.values(decadeCounts), 0)
    if (maxDecadeCount >= 10) unlock(player.name, AchievementId.DECADE_MASTER)
    progress(player.name, AchievementId.DECADE_MASTER, maxDecadeCount)

    if (player.cards === 10) unlock(player.name, AchievementId.PERFECTIONIST)

    if (isWinner && gameDurationMinutes < 5) unlock(player.name, AchievementId.LIGHTNING_FAST)

    if (isWinner && players.length > 1 && rankingsHistory.length > 0) {
      const wasLast = rankingsHistory
        .filter((snap) => snap.turn <= 5)
        .some((snap) => snap.rankings[snap.rankings.length - 1] === player.name)
      if (wasLast) unlock(player.name, AchievementId.COMEBACK_KING)
    }
  }

  for (const player of players) {
    const maxStreak = longestStreak(player, (song) => {
      const d = song.guessDetails
      return song.points === 15 || Boolean(d && d.titleCorrect && d.artistCorrect && d.yearPoints === 5)
    })
    progress(player.name, AchievementId.PERFECT_STREAK, maxStreak)
    if (maxStreak >= 3) unlock(player.name, AchievementId.PERFECT_STREAK)
  }

  for (const player of players) {
    const isWinner = player.name === winner.name

    const decades = new Set(player.timeline.map((s) => decadeOf(s.year)))
    progress(player.name, AchievementId.ZEITMASCHINE, decades.size)
    if (decades.size >= 3) unlock(player.name, AchievementId.ZEITMASCHINE)

    const genres = new Set(player.timeline.map((s) => s.genre).filter((g) => g !== undefined && g !== null))
    progress(player.name, AchievementId.GENRE_HOPPER, genres.size)
    if (genres.size >= 4) unlock(player.name, AchievementId.GENRE_HOPPER)

    const artistStreak = longestStreak(player, (song) => Boolean(song.guessDetails?.artistCorrect))
    progress(player.name, AchievementId.NAME_DROPPER, artistStreak)
    if (artistStreak >= 5) unlock(player.name, AchievementId.NAME_DROPPER)

    progress(player.name, AchievementId.PUNKTEJAEGER, player.score)

    if (isWinner && player.score === 150) unlock(player.name, AchievementId.FLAWLESS_VICTORY)
    if (isWinner && gameDurationMinutes < 3) unlock(player.name, AchievementId.MASTER_OF_TIME)
  }

  return fx
}
