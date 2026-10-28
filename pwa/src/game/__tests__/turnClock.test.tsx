import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProviders, useGame } from '@/contexts'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { useTurnFlow } from '../useTurnFlow'
import { AFTER_MUSIC_MS, PLACE_CAP_MS, STEP_LIMITS_MS, SHOW_COUNTDOWN_MS, clockStep, placingAt, stepKey, visibleSecondsLeft } from '../turnClock'
import { useTurnClock } from '@/online/useTurnClock'
import { GameMode, type Player } from '@/types'

describe('step clock (pure)', () => {
  it('starts for each new step and acts when it runs out', () => {
    const key = stepKey('idle', 0, null, 0, 0)
    expect(clockStep('idle', key, null, 0)).toBe('start')
    expect(clockStep('idle', key, { key: 'other', at: 99 }, 0)).toBe('start')
    expect(clockStep('idle', key, { key, at: 1000 }, 500)).toBe('none')
    expect(clockStep('idle', key, { key, at: 1000 }, 1000)).toBe('act')
    // Objections run on their own clock
    expect(clockStep('challenge', key, null, 0)).toBe('none')
  })

  it('a new draw or turn is a new step, even for the same player', () => {
    expect(stepKey('idle', 0, null, 3, 4)).not.toBe(stepKey('idle', 0, null, 3, 5))
    expect(stepKey('revealed', 0, 's1', 3, 4)).not.toBe(stepKey('revealed', 0, 's1', 4, 4))
  })

  it('placing: no limit while the song plays, 30 s once it stopped, never past the cap', () => {
    const since = 1_000_000
    // Not started yet (e.g. blocked autoplay): 30 s from the draw
    expect(placingAt('s1', null, since)).toBe(since + AFTER_MUSIC_MS)
    // Playing: only the cap
    expect(placingAt('s1', { songId: 's1', playing: true, at: since + 5000 }, since)).toBe(since + PLACE_CAP_MS)
    // Ended or paused at 3:40: 30 s from then
    const stop = since + 220_000
    expect(placingAt('s1', { songId: 's1', playing: false, at: stop }, since)).toBe(stop + AFTER_MUSIC_MS)
    // A cue of another song does not count
    expect(placingAt('s1', { songId: 's0', playing: true, at: since }, since)).toBe(since + AFTER_MUSIC_MS)
    // Pausing late cannot push past the cap
    expect(placingAt('s1', { songId: 's1', playing: false, at: since + PLACE_CAP_MS - 1000 }, since)).toBe(since + PLACE_CAP_MS)
  })

  it('shows only the last seconds', () => {
    const key = 'k'
    expect(visibleSecondsLeft({ key, at: 100_000 }, key, 0)).toBeNull()
    expect(visibleSecondsLeft({ key, at: SHOW_COUNTDOWN_MS }, key, 0)).toBe(30)
    expect(visibleSecondsLeft({ key, at: 5000 }, key, 4100)).toBe(1)
    expect(visibleSecondsLeft({ key: 'old', at: 5000 }, key, 0)).toBeNull()
  })
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <MotionTestProvider>
    <AppProviders>{children}</AppProviders>
  </MotionTestProvider>
)

describe("the host's device runs the step clock", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })
  afterEach(() => vi.useRealTimers())

  function setup() {
    const hook = renderHook(
      () => {
        const game = useGame()
        const flow = useTurnFlow({ onGameOver: vi.fn(), onSkipNotice: (_n, a) => a() })
        useTurnClock(flow, true, Date.now)
        return { game, flow }
      },
      { wrapper }
    )
    const players: Array<Partial<Player> & { name: string }> = [
      { name: 'A', seat: 0 },
      { name: 'B', seat: 1 }
    ]
    act(() => {
      hook.result.current.game.setGameMode(GameMode.TIMELINE_PERSONAL)
      players.forEach(({ name, ...d }) => hook.result.current.game.addPlayer(name, d as never))
    })
    act(() => hook.result.current.game.startGame())
    return () => hook.result.current
  }

  it('draws for someone who does not, lets an unplaced card lapse, and moves on after the reveal', () => {
    const get = setup()
    expect(get().game.isGameStarted).toBe(true)
    expect(get().flow.phase).toBe('idle')
    act(() => vi.advanceTimersByTime(STEP_LIMITS_MS.idle! - 1000))
    expect(get().game.currentSong).toBeNull()
    act(() => vi.advanceTimersByTime(1500))
    expect(get().game.currentSong).not.toBeNull() // drawn for A
    expect(get().flow.phase).toBe('placing')
    act(() => vi.advanceTimersByTime(STEP_LIMITS_MS.placing! + 500))
    expect(get().game.currentPlayer).toBe(1) // A's turn lapsed
    expect(get().game.players[0].cards).toBe(0)
    // B draws and places, then nobody presses "Weiter"
    act(() => {
      get().flow.drawSong()
    })
    act(() => get().flow.placeCard(0))
    expect(get().flow.phase).toBe('revealed')
    act(() => vi.advanceTimersByTime(STEP_LIMITS_MS.revealed! + 500))
    expect(get().game.currentPlayer).toBe(0)
    expect(get().flow.phase).toBe('idle')
  })
})
