/**
 * Who is still at the table, during an online round.
 *
 * `useHostPresence` runs on the host's device (it runs the game):
 * - notes when a seat's connection drops, and after AWAY_GRACE_MS puts that
 *   player on the `absent` list (their turns are skipped until they are back);
 * - a player who left on purpose is marked `left` at once (out for good);
 * - when the round waits on an absent player, it takes the step that frees it
 *   (pass the turn, drop an objection, turn the card, continue).
 *
 * `usePresenceNotices` runs on every device and says what changed.
 */
import { useEffect, useRef, useState } from 'react'
import { useGame, useUI } from '@/contexts'
import type { TurnFlow } from '@/game/useTurnFlow'
import { absentPlayers, unstick } from '@/game/presence'
import { msg } from '@/i18n'
import { gameText } from '@/i18n/messages/game'
import { useRoom } from './RoomContext'

const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x) => b.includes(x))

export function useHostPresence(flow: TurnFlow, enabled: boolean) {
  const room = useRoom()
  const game = useGame()
  const offlineSince = useRef(new Map<number, number>())
  const [now, setNow] = useState(() => Date.now())

  const members = room?.members ?? []
  // Only trust the roster while this device is connected and has one
  const live = enabled && room?.connection === 'open' && members.length > 0

  // When did each connection drop? (local clock; a reload starts the wait anew)
  useEffect(() => {
    if (!live) return
    const map = offlineSince.current
    for (const m of members) {
      if (m.online || m.left) map.delete(m.seat)
      else if (!map.has(m.seat)) map.set(m.seat, Date.now())
    }
    setNow(Date.now())
  }, [live, members])

  // Tick while someone is offline, so the grace period runs out on time
  const waiting = live && members.some((m) => !m.online && !m.left)
  useEffect(() => {
    if (!waiting) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [waiting])

  const running = live && game.isGameStarted && !game.finished

  // Left on purpose: out at once
  const leftIndex = running ? game.players.findIndex((p) => !p.left && members.some((m) => m.left && m.seat === p.seat)) : -1
  const handledLeft = useRef(new Set<number>())
  useEffect(() => {
    // The flow object is new on every render: act once per leaver
    if (leftIndex < 0 || handledLeft.current.has(leftIndex)) return
    handledLeft.current.add(leftIndex)
    flow.markLeft(leftIndex)
  }, [leftIndex, flow])

  const absent = running ? absentPlayers(game.players, members, offlineSince.current, now, room?.seat ?? null) : []
  const changed = running && !sameSet(absent, game.absent ?? [])
  useEffect(() => {
    if (changed) game.setAbsent(absent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changed, absent.join(',')])

  // Free a round that waits on someone absent
  const step = running ? unstick({ phase: flow.phase, currentPlayer: game.currentPlayer, pending: flow.pending, reveal: flow.reveal }, game.absent ?? []) : null
  // One step per situation — a second call before the state has moved on would skip two turns
  const situation = step
    ? `${step}|${flow.phase}|${game.currentPlayer}|${flow.pending?.choosing ?? ''}|${flow.reveal?.song.id ?? game.currentSong?.id ?? ''}|${game.turnLog?.length ?? 0}`
    : null
  const lastSituation = useRef<string | null>(null)
  useEffect(() => {
    if (!step || situation === lastSituation.current) return
    lastSituation.current = situation
    if (step === 'pass') flow.passTurn()
    else if (step === 'cancelChallenge') flow.cancelChallenge()
    else if (step === 'reveal') flow.revealPlacement()
    else flow.continueTurn()
  }, [step, situation, flow])
}

/** Toasts on every device: someone lost the connection, came back, left, is skipped. */
export function usePresenceNotices(enabled: boolean) {
  const room = useRoom()
  const { absent, players } = useGame()
  const { addToast } = useUI()
  const before = useRef<Map<number, { online: boolean; left: boolean }> | null>(null)
  const absentBefore = useRef<number[]>([])

  const members = room?.members ?? []
  useEffect(() => {
    if (!enabled || members.length === 0) return
    const t = msg(gameText)
    const prev = before.current
    before.current = new Map(members.map((m) => [m.seat, { online: m.online, left: m.left }]))
    if (!prev) return
    for (const m of members) {
      if (m.seat === room?.seat) continue
      const was = prev.get(m.seat)
      if (!was) continue
      if (m.left && !was.left) addToast(t.hasLeft(m.name), 'info')
      else if (!m.left && was.online && !m.online) addToast(t.disconnected(m.name), 'warning')
      else if (!m.left && !was.online && m.online) addToast(t.backAgain(m.name), 'success')
    }
  }, [enabled, members, room?.seat, addToast])

  useEffect(() => {
    if (!enabled) return
    const t = msg(gameText)
    const list = absent ?? []
    for (const i of list) {
      const p = players[i]
      if (!absentBefore.current.includes(i) && p && !p.left && p.seat !== room?.seat) addToast(t.skippedWhileAway(p.name), 'info')
    }
    absentBefore.current = list
  }, [enabled, absent, players, room?.seat, addToast])
}
