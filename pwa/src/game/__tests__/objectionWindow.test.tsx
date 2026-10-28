import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProviders, useGame } from '@/contexts'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { useTurnFlow } from '../useTurnFlow'
import { CHOOSE_GAP_MS, OBJECTION_WINDOW_MS, secondsLeft, waitingOn, windowStep } from '../objectionWindow'
import { useObjectionWindow } from '@/online/useObjectionWindow'
import { GameMode, type Player, type Song } from '@/types'
import type { PendingPlacement } from '../turn'

const pending = (over: Partial<PendingPlacement> = {}): PendingPlacement => ({
  playerIndex: 0,
  gapIndex: 1,
  challengers: [1, 2],
  choosing: null,
  claim: null,
  ...over
})

describe('objection window (pure)', () => {
  it('waits for everyone allowed to object who has not passed and is here', () => {
    expect(waitingOn(pending())).toEqual([1, 2])
    expect(waitingOn(pending({ passed: [1] }))).toEqual([2])
    expect(waitingOn(pending({ passed: [1] }), [2])).toEqual([])
  })

  it('opens, then turns the card over when everyone passed or time ran out', () => {
    expect(windowStep(pending(), [], 1000)).toBe('start')
    expect(windowStep(pending({ deadlineAt: 5000 }), [], 1000)).toBe('none')
    expect(windowStep(pending({ deadlineAt: 5000 }), [], 5000)).toBe('reveal')
    expect(windowStep(pending({ deadlineAt: 5000, passed: [1, 2] }), [], 1000)).toBe('reveal')
    // Someone is choosing a gap: that choice has its own time
    expect(windowStep(pending({ choosing: 1 }), [], 0)).toBe('startChoosing')
    expect(windowStep(pending({ deadlineAt: 5000, choosing: 1 }), [], 1000)).toBe('none')
    expect(windowStep(pending({ deadlineAt: 5000, choosing: 1 }), [], 5000)).toBe('dropObjection')
    expect(windowStep(null, [], 0)).toBe('none')
  })

  it('counts down in whole seconds', () => {
    expect(secondsLeft(10_000, 0)).toBe(10)
    expect(secondsLeft(10_000, 9_100)).toBe(1)
    expect(secondsLeft(10_000, 12_000)).toBe(0)
    expect(secondsLeft(null, 0)).toBeNull()
  })
})

const song = (year: number): Song => ({ id: `s${year}`, title: `Song ${year}`, artist: 'A', year })
const wrapper = ({ children }: { children: ReactNode }) => (
  <MotionTestProvider>
    <AppProviders>{children}</AppProviders>
  </MotionTestProvider>
)

describe("the host's device runs the window", () => {
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
        useObjectionWindow(flow, true, Date.now)
        return { game, flow }
      },
      { wrapper }
    )
    const players: Array<Partial<Player> & { name: string }> = [
      { name: 'A', seat: 0, challenges: 3 },
      { name: 'B', seat: 1, challenges: 3 },
      { name: 'C', seat: 2, challenges: 3 }
    ]
    act(() => {
      hook.result.current.game.setGameMode(GameMode.TIMELINE_GLOBAL)
      players.forEach(({ name, ...d }) => hook.result.current.game.addPlayer(name, d as never))
    })
    players.forEach(({ name: _n, ...d }, i) => act(() => hook.result.current.game.updatePlayer(i, d)))
    const get = () => hook.result.current
    act(() => get().game.addToGlobalTimeline(song(1970), 0))
    act(() => get().game.setCurrentSong(song(1980)))
    act(() => get().flow.placeCard(1))
    return get
  }

  it('nothing turns over early, then the countdown does', () => {
    const get = setup()
    expect(get().game.pending?.deadlineAt).toBeGreaterThan(Date.now())
    act(() => vi.advanceTimersByTime(OBJECTION_WINDOW_MS - 1000))
    expect(get().game.reveal).toBeNull()
    act(() => vi.advanceTimersByTime(1500))
    expect(get().game.reveal).not.toBeNull()
  })

  it('turns over at once when everyone passed', () => {
    const get = setup()
    act(() => get().flow.passChallenge(1))
    expect(get().game.reveal).toBeNull()
    act(() => get().flow.passChallenge(2))
    expect(get().game.reveal).not.toBeNull()
  })

  it('an objection holds the window; dropping it counts as passing, the others get a fresh countdown', () => {
    const get = setup()
    act(() => get().flow.startChallenge(1))
    act(() => vi.advanceTimersByTime(OBJECTION_WINDOW_MS + 5000))
    expect(get().game.reveal).toBeNull()
    act(() => get().flow.cancelChallenge())
    expect(get().game.pending?.passed).toEqual([1])
    // No second objection from the same person on this card
    act(() => get().flow.startChallenge(1))
    expect(get().game.pending?.choosing).toBeNull()
    const fresh = get().game.pending?.deadlineAt ?? 0
    expect(fresh).toBeGreaterThanOrEqual(Date.now() + OBJECTION_WINDOW_MS - 50)
    act(() => vi.advanceTimersByTime(OBJECTION_WINDOW_MS + 200))
    expect(get().game.reveal).not.toBeNull()
  })
  it('an objector who never picks a gap loses the objection after the time to choose', () => {
    const get = setup()
    act(() => get().flow.startChallenge(1))
    act(() => vi.advanceTimersByTime(CHOOSE_GAP_MS - 1000))
    expect(get().game.pending?.choosing).toBe(1)
    act(() => vi.advanceTimersByTime(1500))
    expect(get().game.pending?.choosing).toBeNull()
    expect(get().game.pending?.passed).toEqual([1])
  })
})
