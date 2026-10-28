import { describe, it, expect, vi } from 'vitest'
import type { Player } from '@/types'
import { mayAct, type TurnView } from '../rules'
import { carryOut } from '../useHostBridge'
import { cuePosition, medianOffset, offsetOf } from '../clock'
import type { TurnFlow } from '@/game/useTurnFlow'

const p = (name: string, seat: number): Player => ({ name, seat, timeline: [], cards: 0, score: 0 })
// Seats deliberately not equal to indices (someone was removed from the lobby)
const players = [p('Host', 0), p('Lisa', 2), p('Tom', 5)]

const view = (over: Partial<TurnView>): TurnView => ({ phase: 'idle', players, currentPlayer: 1, pending: null, reveal: null, ...over })

describe('mayAct', () => {
  it('the player on turn draws, places, guesses; others do not', () => {
    expect(mayAct(view({}), 2, 'draw')).toBe(true)
    expect(mayAct(view({}), 5, 'draw')).toBe(false)
    expect(mayAct(view({ phase: 'placing' }), 2, 'place')).toBe(true)
    expect(mayAct(view({ phase: 'placing' }), 5, 'place')).toBe(false)
    expect(mayAct(view({ phase: 'guessing' }), 2, 'guess')).toBe(true)
    expect(mayAct(view({ phase: 'guessing' }), 0, 'guess')).toBe(false)
  })

  it('nothing outside its phase', () => {
    expect(mayAct(view({ phase: 'placing' }), 2, 'draw')).toBe(false)
    expect(mayAct(view({ phase: 'idle' }), 2, 'place')).toBe(false)
  })

  it('only offered seats object, only the objector picks the gap', () => {
    const pending = { playerIndex: 1, gapIndex: 0, challengers: [2], choosing: null, claim: null }
    expect(mayAct(view({ phase: 'challenge', pending }), 5, 'challenge')).toBe(true)
    expect(mayAct(view({ phase: 'challenge', pending }), 0, 'challenge')).toBe(false)
    const choosing = { ...pending, choosing: 2 }
    expect(mayAct(view({ phase: 'challenge', pending: choosing }), 5, 'claim')).toBe(true)
    expect(mayAct(view({ phase: 'challenge', pending: choosing }), 2, 'claim')).toBe(false)
    expect(mayAct(view({ phase: 'challenge', pending: choosing }), 5, 'challenge')).toBe(false)
  })

  it('nobody turns a placed card over by hand online, not even the host', () => {
    const pending = { playerIndex: 1, gapIndex: 0, challengers: [2], choosing: null, claim: null }
    expect(mayAct(view({ phase: 'challenge', pending }), 2, 'reveal')).toBe(false)
    expect(mayAct(view({ phase: 'challenge', pending }), 0, 'reveal', true)).toBe(false)
  })

  it('whoever may object may pass, once', () => {
    const pending = { playerIndex: 1, gapIndex: 0, challengers: [2], choosing: null, claim: null }
    const me = 5 // Tom, index 2
    expect(mayAct(view({ phase: 'challenge', pending }), me, 'pass')).toBe(true)
    expect(mayAct(view({ phase: 'challenge', pending }), 2, 'pass')).toBe(false)
    const passed = { ...pending, passed: [2] }
    expect(mayAct(view({ phase: 'challenge', pending: passed }), me, 'pass')).toBe(false)
    expect(mayAct(view({ phase: 'challenge', pending: passed }), me, 'challenge')).toBe(false)
  })

  it('the placer continues; the host only for someone away', () => {
    const reveal = { kind: 'placement', playerIndex: 1 } as never
    expect(mayAct(view({ phase: 'revealed', reveal }), 2, 'continue')).toBe(true)
    expect(mayAct(view({ phase: 'revealed', reveal }), 5, 'continue')).toBe(false)
    expect(mayAct(view({ phase: 'revealed', reveal }), 0, 'continue', true)).toBe(false)
    expect(mayAct(view({ phase: 'revealed', reveal, away: [1] }), 0, 'continue', true)).toBe(true)
    expect(mayAct(view({ phase: 'idle', currentPlayer: 1 }), 0, 'draw', true)).toBe(false)
    expect(mayAct(view({ phase: 'idle', currentPlayer: 1, away: [1] }), 0, 'draw', true)).toBe(true)
    expect(mayAct(view({ phase: 'idle', currentPlayer: 1, away: [1] }), 5, 'draw')).toBe(false)
  })

  it('the host may not place for someone else', () => {
    expect(mayAct(view({ phase: 'placing' }), 0, 'place', true)).toBe(false)
  })
})

describe('carryOut (host side)', () => {
  const flow = (over: Partial<TurnFlow>): TurnFlow =>
    ({
      phase: 'placing',
      pending: null,
      reveal: null,
      activeTimeline: [{ id: 'a', title: '', artist: '', year: 1980 }],
      placeCard: vi.fn(),
      startChallenge: vi.fn(),
      claimGap: vi.fn(),
      drawSong: vi.fn(),
      ...over
    }) as unknown as TurnFlow

  it('carries out an allowed intent with the same function as the local controls', () => {
    const f = flow({})
    expect(carryOut(f, { players, currentPlayer: 1 }, 2, { action: 'place', gap: 1 })).toBe(true)
    expect(f.placeCard).toHaveBeenCalledWith(1)
  })

  it('refuses intents out of turn and gaps that are not on the board', () => {
    const f = flow({})
    expect(carryOut(f, { players, currentPlayer: 1 }, 5, { action: 'place', gap: 0 })).toBe(false)
    expect(carryOut(f, { players, currentPlayer: 1 }, 2, { action: 'place', gap: 7 })).toBe(false)
    expect(carryOut(f, { players, currentPlayer: 1 }, 2, { action: 'place', gap: -1 })).toBe(false)
    expect(carryOut(f, { players, currentPlayer: 1 }, 2, { action: 'place', gap: 'x' as never })).toBe(false)
    expect(f.placeCard).not.toHaveBeenCalled()
  })

  it('an objection names the sender, not a seat from the message', () => {
    const f = flow({ phase: 'challenge', pending: { playerIndex: 1, gapIndex: 0, challengers: [2], choosing: null, claim: null } })
    expect(carryOut(f, { players, currentPlayer: 1 }, 5, { action: 'challenge' })).toBe(true)
    expect(f.startChallenge).toHaveBeenCalledWith(2)
  })
})

describe('clock', () => {
  it('assumes the server stamped in the middle of the round trip', () => {
    expect(offsetOf({ sent: 1000, received: 1100, server: 5050 })).toBe(4000)
  })

  it('takes the median, so one slow round trip does not throw it off', () => {
    const fast = (o: number) => ({ sent: 0, received: 20, server: 10 + o })
    expect(medianOffset([fast(100), fast(102), { sent: 0, received: 2000, server: 3000 }, fast(98), fast(101)])).toBe(101)
  })

  it('a playing cue moves on with server time; a paused one stays', () => {
    const cue = { playing: true, positionMs: 10_000, at: 50_000 }
    // local 48_000 + offset 4_000 = server 52_000 → 2 s later
    expect(cuePosition(cue, 48_000, 4_000)).toBe(12)
    expect(cuePosition({ ...cue, playing: false }, 48_000, 4_000)).toBe(10)
  })
})
