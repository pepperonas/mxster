/**
 * Host's device: runs the online objection window (see game/objectionWindow).
 * Opens it with a deadline, turns the card over once nobody is left to wait
 * for or the time is up. Once per situation — a second reveal must not run
 * before the state has moved on.
 */
import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/contexts'
import type { TurnFlow } from '@/game/useTurnFlow'
import { CHOOSE_GAP_MS, OBJECTION_WINDOW_MS, windowStep } from '@/game/objectionWindow'

export function useObjectionWindow(flow: TurnFlow, enabled: boolean, serverNow: () => number) {
  const { absent, currentSong } = useGame()
  const pending = enabled && flow.phase === 'challenge' ? flow.pending : null
  const [tick, setTick] = useState(0)
  const step = windowStep(pending, absent ?? [], serverNow())

  // Wake up when the deadline passes
  const deadline = pending?.deadlineAt ?? null
  useEffect(() => {
    if (deadline == null) return
    const id = window.setTimeout(() => setTick((n) => n + 1), Math.max(0, deadline - serverNow()) + 50)
    return () => window.clearTimeout(id)
  }, [deadline, serverNow])

  const done = useRef<string | null>(null)
  const situation = pending ? `${currentSong?.id}|${pending.playerIndex}|${pending.gapIndex}|${pending.choosing}|${step}|${deadline}` : null
  useEffect(() => {
    // Nothing to do: forget the last step, so the same step can come again
    // (an objection dropped opens the window anew)
    if (!pending || step === 'none') {
      done.current = null
      return
    }
    if (situation === done.current) return
    done.current = situation
    if (step === 'start') flow.setObjectionDeadline(serverNow() + OBJECTION_WINDOW_MS)
    else if (step === 'startChoosing') flow.setObjectionDeadline(serverNow() + CHOOSE_GAP_MS)
    else if (step === 'dropObjection') flow.cancelChallenge()
    else flow.revealPlacement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situation, tick])
}
