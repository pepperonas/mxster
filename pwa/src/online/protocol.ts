/**
 * Messages between a device and its room (server/app/api/rooms.py).
 *
 * The host's device runs the game and sends `state` snapshots and `audio`
 * cues; everyone else sends `intent`s, which the server stamps with the real
 * seat and hands to the host only.
 */
import type { GameState } from '@/contexts/GameContext'
import type { Player } from '@/types'
import type { AchievementEffect } from '@/game/achievementRules'

export type RoomStatus = 'lobby' | 'running' | 'finished' | 'closed'
export type MusicMode = 'room' | 'everyone'
export type Role = 'host' | 'player'

export interface Member {
  seat: number
  name: string
  guest: boolean
  host: boolean
  picture: string
  online: boolean
  /** Left the running round on purpose (out for good). */
  left: boolean
  userId: number | null
}

export interface RoomInfo {
  code: string
  status: RoomStatus
  music: MusicMode
  options: Record<string, unknown>
  host: { name: string; picture: string }
  members: Member[]
  maxSeats: number
  me: { seat: number; name: string; host: boolean; left?: boolean } | null
}

/** What the host shares: the whole game state plus the end of the round. */
export interface Snapshot {
  game: Partial<GameState>
  result: { winner: Player; players: Player[]; effects: AchievementEffect[] } | null
}

export interface AudioCue {
  songId: string | null
  playing: boolean
  positionMs: number
  /** Server time (ms) the cue was stamped. */
  at: number
}

export type Intent =
  | { action: 'draw' }
  | { action: 'place'; gap: number }
  | { action: 'challenge' }
  | { action: 'claim'; gap: number }
  | { action: 'cancelChallenge' }
  | { action: 'reveal' }
  | { action: 'guess'; title: string; artist: string; year: string }
  | { action: 'skip' }
  | { action: 'continue' }

export type ServerMessage =
  | {
      type: 'welcome'
      seat: number
      role: Role
      status: RoomStatus
      rev: number
      snapshot: Snapshot | null
      audio: AudioCue | null
      members: Member[]
      server: number
    }
  | { type: 'roster'; members: Member[] }
  | { type: 'state'; rev: number; snapshot: Snapshot }
  | ({ type: 'audio' } & AudioCue)
  | ({ type: 'intent'; seat: number } & Intent)
  | { type: 'status'; status: RoomStatus }
  | { type: 'pong'; t: number; server: number }
  | { type: 'error'; code: string }
  | { type: 'closed'; reason: string }
