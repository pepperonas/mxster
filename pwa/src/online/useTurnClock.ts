/**
 * Host's device: runs the step clock (see game/turnClock). Starts a clock for
 * each new step and, when it runs out, takes the step for the player: draw,
 * let the turn lapse, or move on. Once per step.
 */
import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/contexts'
import type { TurnFlow } from '@/game/useTurnFlow'
import { STEP_LIMITS_MS, actionFor, clockStep, stepKey } from '@/game/turnClock'

export function useTurnClock(flow: TurnFlow, enabled: boolean, serverNow: () => number) {
  const game = useGame()
  const [tick, setTick] = useState(0)
  const songId = flow.reveal?.song.id ?? game.currentSong?.id
  const key = stepKey(flow.phase, game.currentPlayer, songId, game.turnLog?.length ?? 0, game.playedSongs?.length ?? 0)
  const live = enabled && game.isGameStarted && !game.finished && !flow.gameOver
  const step = live ? clockStep(flow.phase, key, game.stepClock, serverNow()) : 'none'

  const at = live && game.stepClock?.key === key ? game.stepClock.at : null
  useEffect(() => {
    if (at == null) return
    const id = window.setTimeout(() => setTick((n) => n + 1), Math.max(0, at - serverNow()) + 50)
    return () => window.clearTimeout(id)
  }, [at, serverNow])

  const done = useRef<string | null>(null)
  useEffect(() => {
    if (step === 'none') return
    const once = `${step}|${key}`
    if (done.current === once) return
    done.current = once
    if (step === 'start') {
      game.setStepClock({ key, at: serverNow() + (STEP_LIMITS_MS[flow.phase] ?? 0) })
      return
    }
    // Someone absent is handled by presence (useHostPresence): acting here too
    // could move the turn on twice
    const who = flow.phase === 'revealed' ? (flow.reveal?.playerIndex ?? game.currentPlayer) : game.currentPlayer
    if ((game.absent ?? []).includes(who)) return
    const action = actionFor(flow.phase)
    if (action === 'draw') flow.drawSong()
    else if (action === 'pass') flow.passTurn()
    else if (action === 'continue') flow.continueTurn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, key, tick])
}
