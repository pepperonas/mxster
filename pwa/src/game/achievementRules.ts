/**
 * Achievement rules (pure).
 *
 * The functions return *effects* instead of calling the achievement context,
 * so the rules are testable; achievementEngine applies them.
 *
 * Everything about a round is read from its turn log, in the order the turns
 * were played. (The hardcore "timeline" of a player is sorted by year and
 * holds wrong guesses too — streaks and decades must never come from it.)
 * A "right" song: timeline modes — an own right placement or a won objection,
 * the free first card left out; hardcore — a guess within two years.
 * A win needs someone to beat: a round alone (the daily round) is no win.
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

/** Hardcore points thresholds, the moment they are crossed (descriptions: 75+ and 100+). */
export function realtimeScoreAchievements(player: string, oldScore: number, newScore: number): AchievementEffect[] {
  const out: AchievementEffect[] = []
  if (newScore >= 75 && oldScore < 75) out.push({ type: 'unlock', player, id: AchievementId.PUNKTEJAEGER })
  if (newScore >= 100 && oldScore < 100) out.push({ type: 'unlock', player, id: AchievementId.HARDCORE_CHAMPION })
  return out
}

// ── One round ───────────────────────────────────────────────────────────────

export interface RoundInput {
  mode: GameMode | string
  /** The people of this round: players and team members, never bots. */
  people: string[]
  players: Player[]
  winner: Player
  durationMinutes: number
  /** Kept for callers; standings now come from the turn log. */
  rankingsHistory?: RankingSnapshot[]
  turns: TurnRecord[]
  genreOf: (songId: string) => string | undefined
  /** When the round ended (ms), for the time-of-day achievements. */
  finishedAt?: number
  /** The daily round's day, when it was one. */
  daily?: string | null
  /** Catching up from the history (nothing differs any more; kept for callers). */
  fromHistory?: boolean
}

const TIMELINE_MODES: string[] = [GameMode.TIMELINE_GLOBAL, GameMode.TIMELINE_PERSONAL]
/** A round paused and resumed later says nothing about playing long. */
const LONG_ROUND_MIN = 60
const LONG_ROUND_MAX = 6 * 60

/** The people of a round: players and team members, never bots. */
export function peopleOf(players: Array<Pick<Player, 'name' | 'isBot' | 'members'>>): string[] {
  return players.flatMap((p) => (p.isBot ? [] : p.members?.length ? p.members : [p.name]))
}

/** Did `person` win (alone, or as a member of the winning team)? */
function wonRound(winner: Pick<Player, 'name' | 'members'>, person: string): boolean {
  return winner.name === person || Boolean(winner.members?.includes(person))
}

/** A right card of `person` in a timeline round: own placement or a won objection (teams too). */
function rightCard(t: TurnRecord, person: string): boolean {
  return !t.first && ((t.p === person && t.ok) || (t.ch?.by === person && t.ch.ok === true))
}

/** The songs `person` got right this round, in turn order. */
export function rightSongs(turns: TurnRecord[], mode: string, person: string): TurnRecord[] {
  if (TIMELINE_MODES.includes(mode)) return turns.filter((t) => rightCard(t, person))
  if (mode === GameMode.HARDCORE) return turns.filter((t) => t.p === person && t.ok)
  return []
}

/** The longest run of own turns (in play order) for which `hit` holds; the free first card left out. */
function longestRun(turns: TurnRecord[], person: string, hit: (t: TurnRecord) => boolean): number {
  let run = 0
  let best = 0
  for (const t of turns) {
    if (t.first || t.p !== person) continue
    run = hit(t) ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** What one round adds to the counters of one person. */
export function roundTally(turns: TurnRecord[], mode: string, person: string) {
  const right = TIMELINE_MODES.includes(mode) ? turns.filter((t) => rightCard(t, person)) : []
  const mine = mode === GameMode.HARDCORE ? turns.filter((t) => t.p === person) : []
  return {
    right: right.length,
    oldies: right.filter((t) => t.y < 1970).length,
    modern: right.filter((t) => t.y >= 2010).length,
    objections: turns.filter((t) => t.ch?.by === person && t.ch.ok === true).length,
    exact: mine.filter((t) => t.d === 0).length,
    titles: mine.filter((t) => t.ti).length,
    artists: mine.filter((t) => t.ar).length
  }
}

/**
 * Was `name` (a seat) strictly last at some point in the first five rounds?
 * Standings come from the turn log: cards in timeline modes, points in hardcore.
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
    else if (t.ch?.ok) {
      // an objection names the member; the card goes to the member's seat
      const seat = seats.find((s) => s === t.ch!.by) ?? t.ch.by
      standing.set(seat, (standing.get(seat) ?? 0) + 1)
    }
    if (i < seats.length - 1) continue // everyone had a turn
    const mine = standing.get(name) ?? 0
    if (seats.every((s) => s === name || (standing.get(s) ?? 0) > mine)) return true
  }
  return false
}

/** Achievements of one finished round, for every mode. */
export function endOfRoundAchievements(input: RoundInput): AchievementEffect[] {
  const { mode, people, players, winner, durationMinutes, turns, genreOf } = input
  const fx: AchievementEffect[] = []
  const unlock = (player: string, id: AchievementId) => fx.push({ type: 'unlock', player, id })
  const progress = (player: string, id: AchievementId, value: number) => fx.push({ type: 'progress', player, id, value })
  const timeline = TIMELINE_MODES.includes(mode)
  const hardcore = mode === GameMode.HARDCORE
  const seats = players.map((p) => p.name)
  // A win needs someone to beat (the daily round is played alone)
  const contested = players.length >= 2
  const hour = input.finishedAt !== undefined ? new Date(input.finishedAt).getHours() : null

  for (const person of people) {
    unlock(person, AchievementId.FIRST_ROUND)
    if (hour !== null && hour < 4) unlock(person, AchievementId.NIGHT_OWL)
    if (hour !== null && hour >= 5 && hour < 9) unlock(person, AchievementId.EARLY_BIRD)
    if (durationMinutes > LONG_ROUND_MIN && durationMinutes < LONG_ROUND_MAX) unlock(person, AchievementId.LONG_ROUND)
    if (people.length >= 6) unlock(person, AchievementId.FULL_HOUSE)

    const own = turns.filter((t) => !t.first && t.p === person)
    // Every own song of the round right, at least five
    if (own.length >= 5 && own.every((t) => t.ok)) unlock(person, AchievementId.PERFECTIONIST)

    const right = rightSongs(turns, mode, person)
    const decades = new Set(right.map((t) => decadeOf(t.y)))
    progress(person, AchievementId.ZEITMASCHINE, decades.size)
    progress(person, AchievementId.TIME_TRAVELER, decades.size)
    const perDecade: Record<number, number> = {}
    for (const t of right) perDecade[decadeOf(t.y)] = (perDecade[decadeOf(t.y)] ?? 0) + 1
    progress(person, AchievementId.DECADE_MASTER, Math.max(0, ...Object.values(perDecade)))
    progress(person, AchievementId.GENRE_HOPPER, new Set(right.map((t) => genreOf(t.s)).filter(Boolean)).size)

    if (timeline) {
      const run = longestRun(turns, person, (t) => t.ok)
      progress(person, AchievementId.HOT_STREAK, run)
      progress(person, AchievementId.UNSTOPPABLE, run)
      progress(person, AchievementId.ALL_OVER, decades.size)
      if (turns.some((t) => t.ch?.by === person && t.ch.ok === true)) unlock(person, AchievementId.OBJECTION_WON)
    }
    if (hardcore) {
      progress(person, AchievementId.PERFECT_STREAK, longestRun(turns, person, (t) => t.pts === 15))
      progress(person, AchievementId.NAME_DROPPER, longestRun(turns, person, (t) => Boolean(t.ar)))
      if (own.some((t) => t.pts === 15)) unlock(person, AchievementId.FULL_SCORE)
    }

    if (contested && wonRound(winner, person)) {
      unlock(person, AchievementId.FIRST_WIN)
      if (winner.members?.length) unlock(person, AchievementId.TEAM_SPIRIT)
      if (durationMinutes < 5) unlock(person, AchievementId.LIGHTNING_FAST)
      if (durationMinutes < 3) unlock(person, AchievementId.MASTER_OF_TIME)
      if (wasLastEarly(turns, seats, winner.name, hardcore)) unlock(person, AchievementId.COMEBACK_KING)
      // Every song of the round at full points (any goal), at least five
      if (hardcore && own.length >= 5 && own.every((t) => t.pts === 15)) unlock(person, AchievementId.FLAWLESS_VICTORY)
    }

    if (input.daily) {
      unlock(person, AchievementId.DAILY_FIRST)
      if (right.length >= 10) unlock(person, AchievementId.DAILY_PERFECT)
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
  const mine = games.filter((g) => playedIn(g, person)).sort((a, b) => a.timestamp - b.timestamp)
  const fx: AchievementEffect[] = []
  const progress = (id: AchievementId, value: number) => fx.push({ type: 'progress', player: person, id, value })
  const won = (g: HistoryEntry) => wonStored(g, person)

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
    if (g.turns && wasLastEarly(g.turns, g.players.map((p) => p.name), g.winner.name, g.gameMode === GameMode.HARDCORE)) comebacks++
    for (const p of g.players) if (p.bot && p.level) bots[p.level]++
  }
  progress(AchievementId.COMEBACK_PROFI, comebacks)
  progress(AchievementId.BOT_SLAYER_EASY, bots.easy)
  progress(AchievementId.BOT_SLAYER_MEDIUM, bots.medium)
  progress(AchievementId.BOT_SLAYER_HARD, bots.hard)

  return fx
}

/** Did `person` play this stored round (alone or in a team)? */
export function playedIn(g: HistoryEntry, person: string): boolean {
  return g.players.some((p) => !isBotSeat(p) && (p.name === person || Boolean(p.members?.includes(person))))
}

/** Did `person` win this stored round (alone or in the winning team)? */
export function wonStored(g: HistoryEntry, person: string): boolean {
  // A win needs someone to beat (the daily round is played alone)
  if (!g.winner || g.players.length < 2) return false
  if (g.winner.name === person) return true
  return Boolean(g.players.find((p) => p.name === g.winner.name)?.members?.includes(person))
}

const COUNTERS: Array<[keyof ReturnType<typeof roundTally>, AchievementId[]]> = [
  ['right', [AchievementId.COLLECTOR, AchievementId.ARCHIVIST]],
  ['oldies', [AchievementId.OLDIE_EXPERT]],
  ['modern', [AchievementId.ZEITGEIST]],
  ['objections', [AchievementId.STAR_LAWYER]],
  ['exact', [AchievementId.EXACT_YEAR]],
  ['titles', [AchievementId.TITLE_HERO]],
  ['artists', [AchievementId.ARTIST_EXPERT]]
]

/**
 * Counters that grow with every round: rounds played and won, points, right
 * cards and the like. Counted up (the history keeps only 50 rounds), never
 * below what the stored rounds already show.
 */
export function roundCounters(person: string, games: HistoryEntry[], round: HistoryEntry | null, points = 0): AchievementEffect[] {
  const mine = games.filter((g) => playedIn(g, person))
  const played = mine.length
  const wins = mine.filter((g) => wonStored(g, person)).length
  const add = (id: AchievementId, value: number, atLeast?: number) =>
    value > 0 || atLeast ? [{ type: 'add' as const, player: person, id, value, atLeast }] : []
  const won = round ? wonStored(round, person) : false
  const fx: AchievementEffect[] = [
    ...add(AchievementId.MARATHON_RUNNER, 1, played),
    ...add(AchievementId.CENTURION, 1, played),
    ...add(AchievementId.REGULAR, 1, played),
    ...(won ? [...add(AchievementId.WINNER_10, 1, wins), ...add(AchievementId.WINNER_25, 1, wins)] : [])
  ]
  if (points > 0) fx.push(...add(AchievementId.MUSIC_EXPERT, points), ...add(AchievementId.GRAND_MASTER, points))
  if (round?.turns?.length) {
    const tally = roundTally(round.turns, round.gameMode, person)
    for (const [key, ids] of COUNTERS) for (const id of ids) fx.push(...add(id, tally[key]))
  }
  const days = new Set(mine.map((g) => g.daily).filter(Boolean)).size
  if (days > 0) fx.push({ type: 'progress', player: person, id: AchievementId.DAILY_REGULAR, value: days })
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
  type Seat = HistoryEntry['players'][number]
  const asPlayer = (p: Seat): Player => ({
    name: p.name,
    cards: p.cards,
    score: p.score,
    timeline: [],
    ...(p.members ? { members: p.members } : {}),
    ...(isBotSeat(p) ? { isBot: true } : {})
  })
  for (const g of games) {
    const players = g.players.map(asPlayer)
    const people = peopleOf(players).filter((n) => !hidden.includes(n))
    people.forEach((p) => everyone.add(p))
    const winnerSeat = g.players.find((p) => p.name === g.winner?.name)
    fx.push(
      ...endOfRoundAchievements({
        mode: g.gameMode,
        people,
        players,
        winner: winnerSeat ? asPlayer(winnerSeat) : { name: g.winner?.name ?? '', cards: 0, score: 0, timeline: [] },
        durationMinutes: g.durationMs ? g.durationMs / 60000 : Infinity,
        rankingsHistory: [],
        turns: g.turns ?? [],
        genreOf,
        finishedAt: g.timestamp,
        daily: g.daily ?? null,
        fromHistory: true
      })
    )
  }
  for (const person of everyone) {
    fx.push(...historyAchievements(person, games))
    const mine = games.filter((g) => playedIn(g, person))
    const total = (f: (g: HistoryEntry) => number) => mine.reduce((sum, g) => sum + f(g), 0)
    const points = total((g) => g.players.find((p) => p.name === person)?.score ?? 0)
    const wins = mine.filter((g) => wonStored(g, person)).length
    const set = (ids: AchievementId[], value: number) => ids.forEach((id) => fx.push({ type: 'progress', player: person, id, value }))
    set([AchievementId.MARATHON_RUNNER, AchievementId.CENTURION, AchievementId.REGULAR], mine.length)
    set([AchievementId.MUSIC_EXPERT, AchievementId.GRAND_MASTER], points)
    set([AchievementId.WINNER_10, AchievementId.WINNER_25], wins)
    for (const [key, ids] of COUNTERS) set(ids, total((g) => roundTally(g.turns ?? [], g.gameMode, person)[key]))
    set([AchievementId.DAILY_REGULAR], new Set(mine.map((g) => g.daily).filter(Boolean)).size)
  }
  return fx
}
