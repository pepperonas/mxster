/**
 * Achievement rules (pure), extracted from GameScreen.
 *
 * The functions return *effects* instead of calling the achievement context,
 * so the rules are testable and the caller applies them in the returned order.
 * The order is part of the contract: it matches the previous inline code
 * exactly (progress before/after unlock as it was).
 */
import { AchievementId } from '@/types/achievements'
import { GameMode, type HistoryEntry, type Player, type TurnRecord } from '@/types'
import type { AchievementEffect } from './achievementEngine'
import { isBotSeat } from './stats'

export type { AchievementEffect }

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

// ── Every mode ──────────────────────────────────────────────────────────────

export interface RoundInput {
  mode: GameMode | string
  /** The people of this round (no bots, no teams). */
  people: string[]
  players: Player[]
  winner: Player
  durationMinutes: number
  rankingsHistory: RankingSnapshot[]
  turns: TurnRecord[]
  genreOf: (songId: string) => string | undefined
}

/** A timeline turn won by `person`: own right card, or an objection whose gap was right. */
function wonBy(t: TurnRecord, person: string): boolean {
  if (t.team) return false
  return (t.p === person && t.ok) || (t.ch?.by === person && t.ch.ok === true)
}

/**
 * Was `name` strictly last at some point in the first five rounds? Standings
 * come from the turn log: cards in timeline modes, points in hardcore.
 */
export function wasLastEarly(turns: TurnRecord[], seats: string[], name: string, hardcore: boolean): boolean {
  if (seats.length < 2) return false
  const standing = new Map(seats.map((s) => [s, 0]))
  const limit = seats.length * 5
  for (let i = 0; i < turns.length && i < limit; i++) {
    const t = turns[i]
    const placer = t.team ?? t.p
    if (hardcore) standing.set(placer, (standing.get(placer) ?? 0) + (t.pts ?? 0))
    else if (t.ok) standing.set(placer, (standing.get(placer) ?? 0) + 1)
    else if (t.ch?.ok) standing.set(t.ch.by, (standing.get(t.ch.by) ?? 0) + 1)
    if (i < seats.length - 1) continue // everyone had a turn
    const mine = standing.get(name) ?? 0
    if (seats.every((s) => s === name || (standing.get(s) ?? 0) > mine)) return true
  }
  return false
}

/** Achievements of one finished round, for every mode. */
export function endOfRoundAchievements(input: RoundInput): AchievementEffect[] {
  const { mode, people, players, winner, durationMinutes, turns, genreOf } = input
  const keep = (fx: AchievementEffect[]) => fx.filter((e) => people.includes(e.player))

  if (mode === GameMode.HARDCORE) {
    return keep(
      endOfGameAchievements({ players, winner, gameDurationMinutes: durationMinutes, rankingsHistory: input.rankingsHistory })
    )
  }

  const fx: AchievementEffect[] = []
  const unlock = (player: string, id: AchievementId) => fx.push({ type: 'unlock', player, id })
  const progress = (player: string, id: AchievementId, value: number) => fx.push({ type: 'progress', player, id, value })
  const seats = players.map((p) => p.name)

  for (const person of people) {
    const right = turns.filter((t) => !t.first && wonBy(t, person))
    const tries = turns.filter((t) => !t.first && !t.team && t.p === person)

    const decades = new Set(right.map((t) => decadeOf(t.y)))
    progress(person, AchievementId.ZEITMASCHINE, decades.size)
    progress(person, AchievementId.TIME_TRAVELER, decades.size)

    const perDecade: Record<number, number> = {}
    for (const t of right) perDecade[decadeOf(t.y)] = (perDecade[decadeOf(t.y)] ?? 0) + 1
    progress(person, AchievementId.DECADE_MASTER, Math.max(0, ...Object.values(perDecade)))

    const genres = new Set(right.map((t) => genreOf(t.s)).filter((g): g is string => Boolean(g)))
    progress(person, AchievementId.GENRE_HOPPER, genres.size)

    // Every own card of the round right, at least five of them
    if (tries.length >= 5 && tries.every((t) => t.ok)) unlock(person, AchievementId.PERFECTIONIST)

    if (person === winner.name) {
      if (durationMinutes < 5) unlock(person, AchievementId.LIGHTNING_FAST)
      if (durationMinutes < 3) unlock(person, AchievementId.MASTER_OF_TIME)
      if (wasLastEarly(turns, seats, person, false)) unlock(person, AchievementId.COMEBACK_KING)
    }
  }
  return fx
}

// ── Across rounds ───────────────────────────────────────────────────────────

/**
 * Achievements from the stored rounds of one person (newest round included).
 * Rounds played and points are counted up by the caller instead: the history
 * keeps only the last 50 rounds.
 */
export function historyAchievements(person: string, games: HistoryEntry[]): AchievementEffect[] {
  const mine = games
    .filter((g) => g.players.some((p) => p.name === person && !p.members && !isBotSeat(p)))
    .sort((a, b) => a.timestamp - b.timestamp)
  const fx: AchievementEffect[] = []
  const progress = (id: AchievementId, value: number) => fx.push({ type: 'progress', player: person, id, value })
  const won = (g: HistoryEntry) => g.winner?.name === person

  let run = 0
  let best = 0
  for (const g of mine) {
    run = won(g) ? run + 1 : 0
    best = Math.max(best, run)
  }
  progress(AchievementId.UNBEATABLE, best)
  progress(AchievementId.LEGENDARY_STREAK, best)

  const maxScore = Math.max(0, ...mine.map((g) => g.players.find((p) => p.name === person)?.score ?? 0))
  if (maxScore >= 75) fx.push({ type: 'unlock', player: person, id: AchievementId.PUNKTEJAEGER })
  if (maxScore >= 100) fx.push({ type: 'unlock', player: person, id: AchievementId.HARDCORE_CHAMPION })

  const others = new Set<string>()
  for (const g of mine) {
    for (const p of g.players) {
      if (isBotSeat(p)) continue
      for (const name of p.members?.length ? p.members : [p.name]) if (name !== person) others.add(name)
    }
  }
  progress(AchievementId.SOCIAL_BUTTERFLY, others.size)

  let comebacks = 0
  const bots = { easy: 0, medium: 0, hard: 0 }
  for (const g of mine) {
    if (!won(g)) continue
    if (g.turns && wasLastEarly(g.turns, g.players.map((p) => p.name), person, g.gameMode === GameMode.HARDCORE)) comebacks++
    for (const p of g.players) if (p.bot && p.level) bots[p.level]++
  }
  progress(AchievementId.COMEBACK_PROFI, comebacks)
  progress(AchievementId.BOT_SLAYER_EASY, bots.easy)
  progress(AchievementId.BOT_SLAYER_MEDIUM, bots.medium)
  progress(AchievementId.BOT_SLAYER_HARD, bots.hard)

  return fx
}

/** Counters that grow with every round: rounds played, points. */
export function roundCounters(person: string, games: HistoryEntry[], points: number): AchievementEffect[] {
  const played = games.filter((g) => g.players.some((p) => p.name === person && !p.members && !isBotSeat(p))).length
  const fx: AchievementEffect[] = [
    { type: 'add', player: person, id: AchievementId.MARATHON_RUNNER, value: 1, atLeast: played },
    { type: 'add', player: person, id: AchievementId.CENTURION, value: 1, atLeast: played }
  ]
  if (points > 0) {
    fx.push({ type: 'add', player: person, id: AchievementId.MUSIC_EXPERT, value: points })
    fx.push({ type: 'add', player: person, id: AchievementId.GRAND_MASTER, value: points })
  }
  return fx
}

/**
 * Everything the stored rounds earn, for catching up: achievements were only
 * evaluated in hardcore until v0.12.3. Idempotent (progress only grows,
 * unlocking twice is a no-op). Hardcore rounds are left to the realtime and
 * end-of-round rules — the history does not keep their guess details.
 */
export function backfillAchievements(
  games: HistoryEntry[],
  genreOf: (songId: string) => string | undefined,
  hidden: string[] = []
): AchievementEffect[] {
  const fx: AchievementEffect[] = []
  const everyone = new Set<string>()
  for (const g of games) {
    const people = g.players.filter((p) => !p.members && !isBotSeat(p) && !hidden.includes(p.name)).map((p) => p.name)
    people.forEach((p) => everyone.add(p))
    if (g.gameMode === GameMode.HARDCORE || !g.turns?.length) continue
    const asPlayer = (p: HistoryEntry['players'][number]): Player => ({ name: p.name, cards: p.cards, score: p.score, timeline: [] })
    fx.push(
      ...endOfRoundAchievements({
        mode: g.gameMode,
        people,
        players: g.players.map(asPlayer),
        winner: { name: g.winner?.name ?? '', cards: g.winner?.cards ?? 0, score: g.winner?.score ?? 0, timeline: [] },
        durationMinutes: g.durationMs ? g.durationMs / 60000 : Infinity,
        rankingsHistory: [],
        turns: g.turns,
        genreOf
      })
    )
  }
  for (const person of everyone) {
    fx.push(...historyAchievements(person, games))
    const mine = games.filter((g) => g.players.some((p) => p.name === person && !p.members && !isBotSeat(p)))
    const points = mine.reduce((sum, g) => sum + (g.players.find((p) => p.name === person)?.score ?? 0), 0)
    for (const id of [AchievementId.MARATHON_RUNNER, AchievementId.CENTURION])
      fx.push({ type: 'progress', player: person, id, value: mine.length })
    for (const id of [AchievementId.MUSIC_EXPERT, AchievementId.GRAND_MASTER])
      fx.push({ type: 'progress', player: person, id, value: points })
  }
  return fx
}
