/**
 * What crosses devices is checked (pure).
 *
 * - `blindSnapshot`: before the reveal, the song on the platter goes out
 *   without its year, album and fact — someone reading the socket must not
 *   see the answer. (The bundled song list still holds every year; this only
 *   keeps the answer out of the live traffic.)
 * - `sanitizeResult`: a player's device stores the host's final result in its
 *   own history. The host is just another device, so shape and bounds are
 *   checked and everything unexpected is dropped or cut.
 */
import type { GameMode, Player, Song, TurnRecord } from '@/types'
import { songs } from '@/data/songs'
import type { Snapshot } from './protocol'

const MODES: GameMode[] = ['timeline_personal', 'timeline_global', 'hardcore'] as GameMode[]
const MAX_PLAYERS = 10
const MAX_CARDS = 60
const MAX_TURNS = 400

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : 0)

/**
 * The host's device takes a stored snapshot back (reload, another device):
 * the song on the platter was stored blind, so put the real one back from the
 * bundled song list — judging a placement against year 0 would be wrong.
 */
export function restoreSong(game: Snapshot['game']): Snapshot['game'] {
  const song = game.currentSong
  if (!song || game.reveal) return game
  const real = songs.find((s) => s.id === song.id)
  return real ? { ...game, currentSong: real } : game
}

export function blindSnapshot(game: Snapshot['game']): Snapshot['game'] {
  const song = game.currentSong
  if (!song || game.reveal) return game
  const { year: _y, album: _a, fact: _f, ...rest } = song
  return { ...game, currentSong: { ...rest, year: 0 } as Song }
}

function card(v: unknown): Song | null {
  if (!v || typeof v !== 'object') return null
  const s = v as Record<string, unknown>
  const id = str(s.id, 40)
  if (!id) return null
  return { id, title: str(s.title, 200), artist: str(s.artist, 200), year: num(s.year, 1900, 2100), ...(s.genre ? { genre: str(s.genre, 40) } : {}) }
}

function player(v: unknown): Player | null {
  if (!v || typeof v !== 'object') return null
  const p = v as Record<string, unknown>
  const name = str(p.name, 40).trim()
  if (!name) return null
  const timeline = Array.isArray(p.timeline) ? p.timeline.slice(0, MAX_CARDS).map(card).filter((c): c is Song => c !== null) : []
  return {
    name,
    timeline,
    cards: num(p.cards, 0, MAX_CARDS),
    score: num(p.score, -1000, 10000),
    ...(p.guest ? { guest: true } : {}),
    ...(p.left ? { left: true } : {}),
    ...(Array.isArray(p.members) ? { members: p.members.slice(0, MAX_PLAYERS).map((m) => str(m, 40)).filter(Boolean) } : {})
  }
}

function turn(v: unknown): TurnRecord | null {
  if (!v || typeof v !== 'object') return null
  const t = v as Record<string, unknown>
  const p = str(t.p, 40)
  const s = str(t.s, 40)
  if (!p || !s) return null
  return {
    p,
    s,
    y: num(t.y, 1900, 2100),
    ok: t.ok === true,
    ...(typeof t.team === 'string' ? { team: str(t.team, 40) } : {}),
    ...(t.bot === true ? { bot: true as const } : {}),
    ...(t.first === true ? { first: true as const } : {}),
    ...(typeof t.d === 'number' ? { d: num(t.d, 0, 300) } : {}),
    ...(typeof t.ti === 'boolean' ? { ti: t.ti } : {}),
    ...(typeof t.ar === 'boolean' ? { ar: t.ar } : {}),
    ...(typeof t.pts === 'number' ? { pts: num(t.pts, -100, 100) } : {}),
    ...(t.ch && typeof t.ch === 'object' ? { ch: { by: str((t.ch as Record<string, unknown>).by, 40), ok: (t.ch as Record<string, unknown>).ok === true } } : {})
  }
}

export interface CleanResult {
  winner: Player
  players: Player[]
  gameMode: GameMode
  turns: TurnRecord[]
}

/** The host's final result, made safe to store — or null if it makes no sense. */
export function sanitizeResult(result: unknown, gameMode: unknown, turns: unknown): CleanResult | null {
  if (!result || typeof result !== 'object' || !MODES.includes(gameMode as GameMode)) return null
  const r = result as Record<string, unknown>
  const players = Array.isArray(r.players) ? r.players.slice(0, MAX_PLAYERS).map(player).filter((p): p is Player => p !== null) : []
  const winner = player(r.winner)
  if (players.length === 0 || !winner || !players.some((p) => p.name === winner.name)) return null
  const log = Array.isArray(turns) ? turns.slice(0, MAX_TURNS).map(turn).filter((t): t is TurnRecord => t !== null) : []
  return { winner, players, gameMode: gameMode as GameMode, turns: log }
}
