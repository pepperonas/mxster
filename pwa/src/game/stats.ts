/**
 * Statistics over the stored rounds (pure).
 *
 * Two kinds of source:
 *  - every round: who played, who won, the cards each player ended with;
 *  - rounds since v0.6.0 also carry a turn log (`turns`), which is the only
 *    source of hit rates — older rounds never stored a wrong card.
 * Numbers that need the turn log are `null` while there is none, so the UI can
 * say so instead of showing a made-up 0 %.
 *
 * People, not seats: a team's result counts for each member, bots are left out.
 */
import { GameMode, type HistoryEntry, type TurnRecord } from '@/types'
import { DECADES, decadeOf } from './songPool'

/** Bot names of rounds stored before players carried a bot flag. */
const LEGACY_BOT = /^(Bot (Alpha|Beta|Gamma|Delta)|KI-\d|Robo|Cyber|Neo)( \d+)?$/

type HistoryPlayer = HistoryEntry['players'][number]

export function isBotSeat(p: HistoryPlayer): boolean {
  return Boolean(p.bot) || (!p.members && LEGACY_BOT.test(p.name))
}

/** A bot name as the game hands them out (Bot Alpha, KI-1, …). */
export function isBotName(name: string): boolean {
  return LEGACY_BOT.test(name)
}

/** The people behind a seat (a team's members, otherwise the player). */
function people(p: HistoryPlayer): string[] {
  if (isBotSeat(p)) return []
  return p.members?.length ? p.members : [p.name]
}

/** Turns that say something about knowing the year: not a free first card, not a bot. */
/**
 * The years of the cards a seat won in a round. Own timeline and hardcore keep
 * them on the seat. On the shared timeline the seat's own timeline stays empty
 * (the cards lie on the common one, which is not stored), so they come from the
 * turn log: a right placement goes to the placer, a wrong one to an objector
 * whose gap was right. Rounds without a turn log give nothing here.
 */
export function cardYears(game: HistoryEntry, seat: HistoryPlayer): number[] {
  if (seat.timeline.length > 0 || game.gameMode !== GameMode.TIMELINE_GLOBAL || !game.turns) {
    return seat.timeline.map((song) => song.year)
  }
  const years: number[] = []
  for (const t of game.turns) {
    const placer = t.team ?? t.p
    // An objection names the member who raised it, not the team
    const objector = t.ch?.by
    const objectedBySeat = objector !== undefined && (objector === seat.name || (seat.members ?? []).includes(objector))
    if (t.ok ? placer === seat.name : t.ch?.ok === true && objectedBySeat) years.push(t.y)
  }
  return years
}

export function countsForRate(t: TurnRecord): boolean {
  return !t.first && !t.bot
}

export interface DecadeStat {
  /** Turns with a song of this decade (turn log only). */
  tries: number
  correct: number
  /** Right cards of this decade at the end of rounds (all rounds). */
  cards: number
}

export interface PlayerSummary {
  name: string
  games: number
  wins: number
  /** Rounds played since the turn log exists. */
  loggedGames: number
  tries: number
  correct: number
  /** 0–1, null without logged turns. */
  accuracy: number | null
  cards: number
  byDecade: Record<number, DecadeStat>
  /** Hardcore: mean distance to the year, exact years. */
  yearOff: number | null
  exactYears: number
  guesses: number
  /** Objections raised / won. */
  challenges: number
  challengesWon: number
  lastPlayed: number
  modes: Partial<Record<GameMode, number>>
}

function emptyDecades(): Record<number, DecadeStat> {
  return Object.fromEntries(DECADES.map((d) => [d, { tries: 0, correct: 0, cards: 0 }]))
}

function emptySummary(name: string): PlayerSummary {
  return {
    name,
    games: 0,
    wins: 0,
    loggedGames: 0,
    tries: 0,
    correct: 0,
    accuracy: null,
    cards: 0,
    byDecade: emptyDecades(),
    yearOff: null,
    exactYears: 0,
    guesses: 0,
    challenges: 0,
    challengesWon: 0,
    lastPlayed: 0,
    modes: {}
  }
}

/**
 * Per person, over all stored rounds. Sorted by wins, then games.
 * `hidden` people (removed in the player management) are left out everywhere,
 * also as team members and objectors. A person counts once per round, even
 * with two seats (after merging two spellings that played together).
 */
export function summarize(history: readonly HistoryEntry[], hidden: readonly string[] = []): PlayerSummary[] {
  const by = new Map<string, PlayerSummary & { offSum: number }>()
  const skip = new Set(hidden)
  const get = (name: string) => {
    if (skip.has(name)) return null
    let s = by.get(name)
    if (!s) by.set(name, (s = { ...emptySummary(name), offSum: 0 }))
    return s
  }

  for (const game of history) {
    const winnerSeat = game.players.find((p) => p.name === game.winner.name)
    const winners = new Set(winnerSeat ? people(winnerSeat) : [])
    const counted = new Set<string>()
    for (const seat of game.players) {
      for (const name of people(seat)) {
        const s = get(name)
        if (!s) continue
        s.cards += seat.cards
        // Card decades: a team's cards belong to all its members
        for (const year of cardYears(game, seat)) {
          const d = decadeOf(year)
          if (s.byDecade[d]) s.byDecade[d].cards++
        }
        if (counted.has(name)) continue
        counted.add(name)
        s.games++
        if (winners.has(name)) s.wins++
        s.lastPlayed = Math.max(s.lastPlayed, game.timestamp)
        s.modes[game.gameMode] = (s.modes[game.gameMode] ?? 0) + 1
        if (game.turns) s.loggedGames++
      }
    }
    for (const t of game.turns ?? []) {
      if (t.ch && !t.bot) {
        const c = get(t.ch.by)
        if (c) {
          c.challenges++
          if (t.ch.ok && !t.ok) c.challengesWon++
        }
      }
      if (!countsForRate(t)) continue
      const s = get(t.p)
      if (!s) continue
      s.tries++
      if (t.ok) s.correct++
      const d = s.byDecade[decadeOf(t.y)]
      if (d) {
        d.tries++
        if (t.ok) d.correct++
      }
      if (t.d !== undefined) {
        s.guesses++
        s.offSum += t.d
        if (t.d === 0) s.exactYears++
      }
    }
  }

  return [...by.values()]
    .map(({ offSum, ...s }) => ({
      ...s,
      accuracy: s.tries > 0 ? s.correct / s.tries : null,
      yearOff: s.guesses > 0 ? offSum / s.guesses : null
    }))
    .sort((a, b) => b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name))
}

/** Hit rate per decade (0–1, null without tries). */
export function decadeRates(s: PlayerSummary): Array<{ decade: number; rate: number | null; tries: number }> {
  return DECADES.map((decade) => {
    const d = s.byDecade[decade]
    return {
      decade,
      rate: d.tries > 0 ? d.correct / d.tries : null,
      tries: d.tries
    }
  })
}

/** Share of a player's right cards per decade (0–1; all rounds). */
export function decadeShares(s: PlayerSummary): Array<{ decade: number; share: number; cards: number }> {
  const total = DECADES.reduce((n, d) => n + s.byDecade[d].cards, 0)
  return DECADES.map((decade) => {
    const cards = s.byDecade[decade].cards
    return { decade, share: total > 0 ? cards / total : 0, cards }
  })
}

// ── The group ───────────────────────────────────────────────────────────────

export interface SongStat {
  id: string
  tries: number
  wrong: number
}

export interface GroupStats {
  rounds: number
  /** Rounds with a turn log. */
  loggedRounds: number
  /** Total play time of the rounds that recorded it, and how many did. */
  playMs: number
  timedRounds: number
  /** Songs played: logged turns, otherwise the cards of a round. */
  songs: number
  accuracy: number | null
  tries: number
  modes: Record<GameMode, number>
  hardest: SongStat[]
  safest: SongStat[]
}

const MODES: GameMode[] = ['timeline_personal' as GameMode, 'timeline_global' as GameMode, 'hardcore' as GameMode]

export function groupStats(history: readonly HistoryEntry[], { minTries = 2, top = 5 } = {}): GroupStats {
  const modes = Object.fromEntries(MODES.map((m) => [m, 0])) as Record<GameMode, number>
  const songs = new Map<string, SongStat>()
  let loggedRounds = 0
  let playMs = 0
  let timedRounds = 0
  let played = 0
  let tries = 0
  let correct = 0

  for (const game of history) {
    if (game.gameMode in modes) modes[game.gameMode]++
    if (game.durationMs) {
      playMs += game.durationMs
      timedRounds++
    }
    if (game.turns) {
      loggedRounds++
      played += game.turns.length
      for (const t of game.turns) {
        if (!countsForRate(t)) continue
        tries++
        if (t.ok) correct++
        const s = songs.get(t.s) ?? { id: t.s, tries: 0, wrong: 0 }
        s.tries++
        if (!t.ok) s.wrong++
        songs.set(t.s, s)
      }
    } else {
      played += game.players.reduce((n, p) => n + p.cards, 0)
    }
  }

  const known = [...songs.values()].filter((s) => s.tries >= minTries)
  const hardest = known
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrong / b.tries - a.wrong / a.tries || b.tries - a.tries)
    .slice(0, top)
  const safest = known
    .filter((s) => s.wrong === 0)
    .sort((a, b) => b.tries - a.tries)
    .slice(0, top)

  return {
    rounds: history.length,
    loggedRounds,
    playMs,
    timedRounds,
    songs: played,
    accuracy: tries > 0 ? correct / tries : null,
    tries,
    modes,
    hardest,
    safest
  }
}

/** Rounds per calendar week (Monday start), oldest first, ending with the current week. */
export function weeklyRounds(history: readonly HistoryEntry[], weeks = 12, now = Date.now()): Array<{ start: number; rounds: number }> {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const out: Array<{ start: number; rounds: number }> = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(monday)
    start.setDate(start.getDate() - i * 7)
    out.push({ start: start.getTime(), rounds: 0 })
  }
  for (const g of history) {
    for (let i = out.length - 1; i >= 0; i--) {
      if (g.timestamp >= out[i].start) {
        out[i].rounds++
        break
      }
    }
  }
  return out
}

// ── Player management ───────────────────────────────────────────────────────

/**
 * All people known to the account, minus hidden ones: from rounds, the quick
 * picks and `others` (names that only have achievements — someone typed into
 * the setup who never finished a round must still be manageable). Bots never.
 */
export function knownPlayers(
  history: readonly HistoryEntry[],
  saved: readonly string[],
  hidden: readonly string[] = [],
  others: readonly string[] = []
): string[] {
  const names = new Set<string>()
  for (const g of history) for (const seat of g.players) for (const n of people(seat)) names.add(n)
  for (const n of [...saved, ...others]) if (!isBotName(n)) names.add(n)
  for (const n of hidden) names.delete(n)
  return [...names]
}

/**
 * Rename a person in every stored round (also merges: renaming onto an
 * existing name makes both one person). Rounds that don't mention the name
 * are returned unchanged (same object).
 */
export function renameInHistory(history: readonly HistoryEntry[], from: string, to: string): HistoryEntry[] {
  const swap = (n: string) => (n === from ? to : n)
  return history.map((g) => {
    const mentions =
      g.winner.name === from ||
      g.players.some((p) => p.name === from || p.members?.includes(from)) ||
      (g.turns ?? []).some((t) => t.p === from || t.team === from || t.ch?.by === from)
    if (!mentions) return g
    return {
      ...g,
      winner: { ...g.winner, name: swap(g.winner.name) },
      players: g.players.map((p) => ({
        ...p,
        name: swap(p.name),
        ...(p.members ? { members: p.members.map(swap) } : {})
      })),
      ...(g.turns
        ? {
            turns: g.turns.map((t) => ({
              ...t,
              p: swap(t.p),
              ...(t.team ? { team: swap(t.team) } : {}),
              ...(t.ch ? { ch: { ...t.ch, by: swap(t.ch.by) } } : {})
            }))
          }
        : {})
    }
  })
}

/** "Eure Angstgegner" unlocks at this many missed songs. */
export const NEMESIS_MIN = 10
/** Never more in one round option (room options are capped in size). */
export const NEMESIS_MAX = 200

/**
 * Songs the group got wrong before (a wrong placement or a hardcore year off
 * by more than 2), newest misses first, each once. Bots don't count.
 */
export function missedSongs(history: readonly HistoryEntry[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const game of [...history].sort((a, b) => b.timestamp - a.timestamp)) {
    for (const turn of [...(game.turns ?? [])].reverse()) {
      if (turn.bot || !countsForRate(turn) || turn.ok || seen.has(turn.s)) continue
      seen.add(turn.s)
      out.push(turn.s)
    }
  }
  return out.slice(0, NEMESIS_MAX)
}
