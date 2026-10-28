/**
 * Online presence: who is skipped, who is out, and how a round that waits on
 * an absent player moves on.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProviders, useGame } from '@/contexts'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { useTurnFlow } from '../useTurnFlow'
import { absentPlayers, nextPresent, unstick, AWAY_GRACE_MS } from '../presence'
import { nextSeat } from '@/contexts/GameContext'
import type { Player, Song } from '@/types'

const song = (year: number): Song => ({ id: `s${year}`, title: `Song ${year}`, artist: 'A', year })
const player = (name: string, seat: number, extra: Partial<Player> = {}): Player =>
  ({ name, seat, timeline: [], cards: 0, score: 0, ...extra }) as Player

describe('absentPlayers', () => {
  const players = [player('Host', 0), player('Lisa', 1), player('Tom', 2)]
  const members = (lisaOnline: boolean, tomLeft = false) => [
    { seat: 0, online: true, left: false },
    { seat: 1, online: lisaOnline, left: false },
    { seat: 2, online: !tomLeft, left: tomLeft }
  ]

  it('a dropped connection is skipped only after the grace period', () => {
    const since = new Map([[1, 1000]])
    expect(absentPlayers(players, members(false), since, 1000 + AWAY_GRACE_MS - 1, 0)).toEqual([])
    expect(absentPlayers(players, members(false), since, 1000 + AWAY_GRACE_MS, 0)).toEqual([1])
    expect(absentPlayers(players, members(true), since, 1000 + AWAY_GRACE_MS, 0)).toEqual([])
  })

  it('left is out at once, the host never', () => {
    expect(absentPlayers(players, members(true, true), new Map(), 0, 0)).toEqual([2])
    expect(absentPlayers([player('Host', 0)], [{ seat: 0, online: false, left: false }], new Map([[0, 0]]), 1e9, 0)).toEqual([])
    // Marked left in the game, even while the roster still shows the seat online
    expect(absentPlayers([player('Lisa', 1, { left: true })], [{ seat: 1, online: true, left: false }], new Map(), 0, 0)).toEqual([0])
  })
})

describe('turn order', () => {
  it('skips absent players and wraps', () => {
    expect(nextPresent([0, 1, 2, 3], 0, [1])).toBe(2)
    expect(nextPresent([0, 1, 2, 3], 2, [3])).toBe(0)
    expect(nextPresent([0, 1, 2], 0, [1, 2])).toBe(0)
    expect(nextPresent([1, 3], 1, [])).toBe(3)
  })

  it('the reducer uses it, in a tiebreak too', () => {
    const players = [player('A', 0), player('B', 1), player('C', 2)]
    expect(nextSeat({ players, currentPlayer: 0, absent: [1], tiebreak: null })).toBe(2)
    expect(nextSeat({ players, currentPlayer: 0, absent: [], tiebreak: null })).toBe(1)
    expect(nextSeat({ players, currentPlayer: 0, absent: [2], tiebreak: { contenders: [0, 2], played: [], round: 1 } })).toBe(0)
  })
})

describe('unstick', () => {
  const base = { currentPlayer: 1, pending: null, reveal: null }
  it('names the step that frees the round', () => {
    expect(unstick({ ...base, phase: 'placing' }, [1])).toBe('pass')
    expect(unstick({ ...base, phase: 'idle' }, [0])).toBeNull()
    const pending = { playerIndex: 1, gapIndex: 0, challengers: [2], choosing: null, claim: null }
    // An absent placer: the objection window closes by itself
    expect(unstick({ ...base, phase: 'challenge', pending }, [1])).toBeNull()
    expect(unstick({ ...base, phase: 'challenge', pending: { ...pending, choosing: 2 } }, [2])).toBe('cancelChallenge')
    expect(unstick({ ...base, phase: 'challenge', pending: { ...pending, choosing: 2 } }, [1])).toBeNull()
    expect(unstick({ ...base, phase: 'revealed', reveal: { playerIndex: 1 } as never }, [1])).toBe('continue')
  })
})

// ── flow ───────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => (
  <MotionTestProvider>
    <AppProviders>{children}</AppProviders>
  </MotionTestProvider>
)

function setup(names: string[]) {
  const onGameOver = vi.fn()
  const hook = renderHook(
    () => {
      const game = useGame()
      const flow = useTurnFlow({ onGameOver, onSkipNotice: (_n, ack) => ack() })
      return { game, flow }
    },
    { wrapper }
  )
  act(() => {
    hook.result.current.game.setGameMode('timeline_personal' as never)
    names.forEach((n) => hook.result.current.game.addPlayer(n))
  })
  return { onGameOver, get: () => hook.result.current }
}

beforeEach(() => localStorage.clear())

describe('flow with absent players', () => {
  it('passTurn moves on without booking and skips the absent one next time', () => {
    const t = setup(['A', 'B', 'C'])
    act(() => t.get().game.setAbsent([1]))
    act(() => t.get().game.setCurrentPlayer(1))
    act(() => t.get().game.setCurrentSong(song(1990)))
    act(() => t.get().flow.passTurn())
    expect(t.get().game.currentPlayer).toBe(2)
    expect(t.get().game.currentSong).toBeNull()
    expect(t.get().game.turnLog).toHaveLength(0)
    expect(t.get().game.players[1].cards).toBe(0)
    // C plays; the turn after C goes past B
    act(() => t.get().game.nextTurn())
    expect(t.get().game.currentPlayer).toBe(0)
    act(() => t.get().game.nextTurn())
    expect(t.get().game.currentPlayer).toBe(2)
  })

  it('an absent player cannot object', () => {
    const t = setup(['A', 'B', 'C'])
    act(() => {
      t.get().game.updatePlayer(0, { timeline: [song(1980)], cards: 1 })
      t.get().game.updatePlayer(1, { challenges: 3 })
      t.get().game.updatePlayer(2, { challenges: 3 })
    })
    act(() => t.get().game.setAbsent([1]))
    act(() => t.get().game.setCurrentSong(song(1990)))
    act(() => t.get().flow.placeCard(1))
    expect(t.get().flow.pending?.challengers).toEqual([2])
  })

  it('when everyone else left, the last one wins', () => {
    const t = setup(['A', 'B', 'C'])
    act(() => t.get().flow.markLeft(1))
    expect(t.get().game.players[1].left).toBe(true)
    expect(t.onGameOver).not.toHaveBeenCalled()
    act(() => t.get().flow.markLeft(2))
    expect(t.onGameOver).toHaveBeenCalledTimes(1)
    expect(t.onGameOver.mock.calls[0][0].name).toBe('A')
  })

  it('a leaver cannot win the round', () => {
    const t = setup(['A', 'B', 'C'])
    act(() => {
      t.get().game.setOptions({ goal: 5 })
      t.get().game.updatePlayer(1, { cards: 5, left: true })
      t.get().game.updatePlayer(0, { cards: 4, timeline: [song(1970), song(1975), song(1980), song(1985)] })
    })
    act(() => t.get().game.setCurrentSong(song(1995)))
    act(() => t.get().flow.placeCard(4))
    act(() => t.get().flow.continueTurn())
    expect(t.onGameOver).toHaveBeenCalledTimes(1)
    expect(t.onGameOver.mock.calls[0][0].name).toBe('A')
  })

  it('a tiebreak goes on without the leaver, and ends when one contender is left', () => {
    // D is still in the round but not in the tiebreak
    const t = setup(['A', 'B', 'C', 'D'])
    act(() => t.get().game.setTiebreak({ contenders: [0, 1, 2], played: [], round: 1 }))
    act(() => t.get().flow.markLeft(2))
    expect(t.get().game.tiebreak?.contenders).toEqual([0, 1])
    expect(t.onGameOver).not.toHaveBeenCalled()
    act(() => t.get().flow.markLeft(1))
    expect(t.onGameOver.mock.calls[0][0].name).toBe('A')
  })

  it('a passed tiebreak turn counts as played, so the tiebreak round can end', () => {
    const t = setup(['A', 'B'])
    act(() => {
      t.get().game.updatePlayer(0, { cards: 6 })
      t.get().game.updatePlayer(1, { cards: 5 })
      t.get().game.setTiebreak({ contenders: [0, 1], played: [0], round: 1 })
      t.get().game.setAbsent([1])
      t.get().game.setCurrentPlayer(1)
    })
    act(() => t.get().flow.passTurn())
    expect(t.onGameOver).toHaveBeenCalledTimes(1)
    expect(t.onGameOver.mock.calls[0][0].name).toBe('A')
  })

  it('an absent contender counts as played when the others finish the tiebreak round', () => {
    const t = setup(['A', 'B'])
    act(() => {
      t.get().game.updatePlayer(0, { cards: 5, timeline: [song(1970)] })
      t.get().game.updatePlayer(1, { cards: 5 })
      t.get().game.setTiebreak({ contenders: [0, 1], played: [], round: 1 })
      t.get().game.setAbsent([1])
    })
    act(() => t.get().game.setCurrentSong(song(1990)))
    act(() => t.get().flow.placeCard(1))
    act(() => t.get().flow.continueTurn())
    expect(t.onGameOver).toHaveBeenCalledTimes(1)
    expect(t.onGameOver.mock.calls[0][0].name).toBe('A')
  })
})
