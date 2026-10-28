/**
 * The room this device is in: who sits where, the live connection, and the
 * bridge into the game context.
 *
 * - Players mirror the host: every snapshot is loaded into the game context
 *   (LOAD_GAME_STATE); the game is never saved on their device.
 * - The host loads the room's snapshot once on (re)connect, so a reload or a
 *   switch to another device of the same account continues the round. The
 *   host's game screen registers `intentHandler` to carry out players' intents.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { useGame } from '@/contexts'
import { ApiError } from '@/api/client'
import { RoomClient, type Connection } from './roomClient'
import { roomApi } from './roomApi'
import { restoreSong } from './sanitize'
import type { AudioCue, Intent, Member, Role, RoomInfo, RoomStatus, ServerMessage, Snapshot } from './protocol'

export interface RoomValue {
  code: string
  info: RoomInfo | null
  /** Why the room cannot be shown (not found, removed, closed). */
  problem: string | null
  members: Member[]
  status: RoomStatus | null
  seat: number | null
  role: Role | null
  connection: Connection
  cue: AudioCue | null
  result: Snapshot['result']
  /** Server ms − local ms. */
  clockOffset: () => number
  sendIntent: (intent: Intent) => void
  sendState: (snapshot: Snapshot) => void
  sendAudio: (cue: Omit<AudioCue, 'at'>) => void
  intentHandler: MutableRefObject<((seat: number, intent: Intent) => void) | null>
  refresh: () => Promise<RoomInfo | null>
}

const RoomContext = createContext<RoomValue | null>(null)

export const useRoom = () => useContext(RoomContext)

export function RoomProvider({ code, children }: { code: string; children: ReactNode }) {
  const game = useGame()
  const gameRef = useRef(game)
  gameRef.current = game

  const [info, setInfo] = useState<RoomInfo | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [status, setStatus] = useState<RoomStatus | null>(null)
  const [seat, setSeat] = useState<number | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [connection, setConnection] = useState<Connection>('connecting')
  const [cue, setCue] = useState<AudioCue | null>(null)
  const [result, setResult] = useState<Snapshot['result']>(null)
  const client = useRef<RoomClient | null>(null)
  const intentHandler = useRef<((seat: number, intent: Intent) => void) | null>(null)
  const roleRef = useRef<Role | null>(null)

  const refresh = useCallback(async () => {
    try {
      const r = await roomApi.read(code)
      setInfo(r)
      setMembers(r.members)
      setStatus(r.status)
      return r
    } catch (error) {
      setProblem(error instanceof ApiError && error.status === 404 ? 'not_found' : 'unreachable')
      return null
    }
  }, [code])

  const applySnapshot = useCallback(
    (snapshot: Snapshot | null) => {
      if (!snapshot) return
      gameRef.current.loadGameState({ ...snapshot.game, onlineRoom: code })
      setResult(snapshot.result)
    },
    [code]
  )

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'welcome': {
          setSeat(msg.seat)
          setRole(msg.role)
          roleRef.current = msg.role
          setMembers(msg.members)
          setStatus(msg.status)
          setCue(msg.audio)
          // Players always follow the host; the host continues from the room's
          // snapshot unless this device already runs this round
          if (msg.role === 'player') applySnapshot(msg.snapshot)
          else if (gameRef.current.onlineRoom !== code && msg.snapshot)
            applySnapshot({ ...msg.snapshot, game: restoreSong(msg.snapshot.game) })
          break
        }
        case 'roster':
          setMembers(msg.members)
          break
        case 'state':
          if (roleRef.current === 'player') applySnapshot(msg.snapshot)
          break
        case 'audio':
          setCue({ songId: msg.songId, playing: msg.playing, positionMs: msg.positionMs, at: msg.at })
          break
        case 'intent': {
          const { type: _t, seat: from, ...intent } = msg
          intentHandler.current?.(from, intent as Intent)
          break
        }
        case 'status':
          setStatus(msg.status)
          setInfo((prev) => (prev ? { ...prev, status: msg.status } : prev))
          break
        case 'closed':
          setProblem(msg.reason === 'kicked' || msg.reason === 'left' ? msg.reason : 'closed')
          break
        case 'error':
          break
      }
    },
    [applySnapshot, code]
  )

  // Load the room, then connect — only once this device has a seat
  useEffect(() => {
    let cancelled = false
    void refresh().then((r) => {
      if (cancelled || !r || !r.me) return
      // Left this round on purpose: no way back in
      if (r.me.left) return void setProblem('left')
      const c = new RoomClient(code, { onMessage, onConnection: setConnection })
      client.current = c
      c.connect()
    })
    return () => {
      cancelled = true
      client.current?.close()
      client.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const value = useMemo<RoomValue>(
    () => ({
      code,
      info,
      problem,
      members,
      status,
      seat,
      role,
      connection,
      cue,
      result,
      clockOffset: () => client.current?.offset ?? 0,
      sendIntent: (intent) => client.current?.sendIntent(intent),
      sendState: (snapshot) => client.current?.sendState(snapshot),
      sendAudio: (c) => {
        client.current?.sendAudio(c)
        // The sender hears no echo: keep its own cue too (the host's step
        // clock reads it when the host's device has the music)
        setCue({ ...c, at: Date.now() + (client.current?.offset ?? 0) })
      },
      intentHandler,
      refresh
    }),
    [code, info, problem, members, status, seat, role, connection, cue, result, refresh]
  )

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}
