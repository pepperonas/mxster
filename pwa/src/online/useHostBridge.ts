/**
 * On the host's device: share the game, carry out the players' intents.
 *
 * - Every change of the game state goes out as a snapshot (debounced 50 ms,
 *   and only when it actually changed).
 * - An intent is carried out only if the sender may act right now (rules.ts);
 *   then it calls exactly the function the local controls would call.
 */
import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useGame } from '@/contexts'
import type { TurnFlow } from '@/game/useTurnFlow'
import { useRoom } from './RoomContext'
import { indexOfSeat, mayAct } from './rules'
import { blindSnapshot } from './sanitize'
import type { Intent, Snapshot } from './protocol'
import type { Player } from '@/types'

/** The game context without its functions: what a snapshot carries. */
export function stateOf(game: object): Snapshot['game'] {
  return Object.fromEntries(Object.entries(game).filter(([, v]) => typeof v !== 'function')) as Snapshot['game']
}

const isGap = (gap: unknown, cards: number) => Number.isInteger(gap) && (gap as number) >= 0 && (gap as number) <= cards

export function carryOut(flow: TurnFlow, game: { players: Player[]; currentPlayer: number }, seat: number, intent: Intent): boolean {
  const view = { phase: flow.phase, players: game.players, currentPlayer: game.currentPlayer, pending: flow.pending, reveal: flow.reveal }
  if (!mayAct(view, seat, intent.action)) return false
  // A gap from another device must be one of the gaps on the board
  if ((intent.action === 'place' || intent.action === 'claim') && !isGap(intent.gap, flow.activeTimeline.length)) return false
  switch (intent.action) {
    case 'draw':
      flow.drawSong()
      return true
    case 'place':
      flow.placeCard(Number(intent.gap))
      return true
    case 'challenge':
      flow.startChallenge(indexOfSeat(game.players, seat))
      return true
    case 'claim':
      flow.claimGap(Number(intent.gap))
      return true
    case 'cancelChallenge':
      flow.cancelChallenge()
      return true
    case 'reveal':
      flow.revealPlacement()
      return true
    case 'guess':
      flow.submitGuess(String(intent.title ?? ''), String(intent.artist ?? ''), String(intent.year ?? ''))
      return true
    case 'skip':
      flow.skip()
      return true
    case 'continue':
      flow.continueTurn()
      return true
    default:
      return false
  }
}

/**
 * Carries out one intent and commits it at once. The next intent (or a queue
 * flushed on reconnect) must be checked against the state this one left
 * behind, or two taps could both pass (reveal + objection, continue twice).
 * `latest` is read after every commit: it is refreshed by the re-render.
 */
export function intentHandler(latest: () => { flow: TurnFlow; game: ReturnType<typeof useGame> }) {
  return (seat: number, intent: Intent) => {
    flushSync(() => {
      const { flow, game } = latest()
      carryOut(flow, game, seat, intent)
    })
  }
}

export function useHostBridge(flow: TurnFlow, result: Snapshot['result']) {
  const room = useRoom()
  const game = useGame()
  const isHost = room?.role === 'host'

  // Intents: always the latest flow and players
  const latest = useRef({ flow, game })
  latest.current = { flow, game }
  useEffect(() => {
    if (!room || !isHost) return
    room.intentHandler.current = intentHandler(() => latest.current)
    return () => {
      room.intentHandler.current = null
    }
  }, [room, isHost])

  // Snapshots
  const sent = useRef('')
  // Before the reveal the song goes out without its year (sanitize.ts)
  const snapshot = isHost ? JSON.stringify({ game: blindSnapshot(stateOf(game)), result }) : ''
  useEffect(() => {
    if (!room || !isHost || snapshot === sent.current) return
    const id = window.setTimeout(() => {
      sent.current = snapshot
      room.sendState(JSON.parse(snapshot) as Snapshot)
    }, 50)
    return () => window.clearTimeout(id)
  }, [room, isHost, snapshot])
  // A new connection (reconnect) should get the current state again
  useEffect(() => {
    if (room?.connection === 'open') sent.current = ''
  }, [room?.connection])
}
