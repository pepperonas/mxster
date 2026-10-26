import { describe, it, expect } from 'vitest'
import { GameMode, type Player } from '@/types'
import { afterTiebreakTurn, leaders, nextContender, rankPlayers, startTiebreak } from '../tiebreak'

const p = (name: string, cards: number, score = 0): Player => ({ name, cards, score, timeline: [] })

describe('leaders', () => {
  it('counts cards in the timeline modes and points in hardcore', () => {
    const players = [p('A', 5, 10), p('B', 5, 30), p('C', 3, 30)]
    expect(leaders(players, GameMode.TIMELINE_GLOBAL)).toEqual([0, 1])
    expect(leaders(players, GameMode.HARDCORE)).toEqual([1, 2])
  })
})

describe('tiebreak rounds', () => {
  it('only contenders take turns, in seat order', () => {
    const tb = startTiebreak([2, 0])
    expect(tb.contenders).toEqual([0, 2])
    expect(nextContender(tb, 0)).toBe(2)
    expect(nextContender(tb, 1)).toBe(2)
    expect(nextContender(tb, 2)).toBe(0)
  })

  it('does not decide before every contender had a song', () => {
    const tb = startTiebreak([0, 1])
    const step = afterTiebreakTurn(tb, 0, [p('A', 6), p('B', 5)], GameMode.TIMELINE_GLOBAL)
    expect(step).toEqual({ kind: 'continue', tiebreak: { contenders: [0, 1], played: [0], round: 1 } })
  })

  it('a single leader after a full round wins', () => {
    const tb = { contenders: [0, 1], played: [0], round: 1 }
    expect(afterTiebreakTurn(tb, 1, [p('A', 6), p('B', 5)], GameMode.TIMELINE_GLOBAL)).toEqual({ kind: 'winner', index: 0 })
  })

  it('still level: another round, and players who fell behind drop out', () => {
    const tb = { contenders: [0, 1, 2], played: [0, 1], round: 1 }
    const step = afterTiebreakTurn(tb, 2, [p('A', 6), p('B', 5), p('C', 6)], GameMode.TIMELINE_GLOBAL)
    expect(step).toEqual({ kind: 'continue', tiebreak: { contenders: [0, 2], played: [], round: 2 } })
  })

  it('hardcore is decided by points', () => {
    const tb = { contenders: [0, 1], played: [1], round: 1 }
    expect(afterTiebreakTurn(tb, 0, [p('A', 11, 40), p('B', 11, 52)], GameMode.HARDCORE)).toEqual({ kind: 'winner', index: 1 })
  })

  it('nobody can win twice-counted: a repeated turn does not complete the round', () => {
    const tb = { contenders: [0, 1], played: [0], round: 1 }
    expect(afterTiebreakTurn(tb, 0, [p('A', 7), p('B', 5)], GameMode.TIMELINE_GLOBAL).kind).toBe('continue')
  })
})

describe('rankPlayers', () => {
  it('equal standings share a place, the winner stays alone on top', () => {
    const ranked = rankPlayers([p('A', 4), p('B', 6), p('C', 4), p('D', 2)], GameMode.TIMELINE_GLOBAL, 'B')
    expect(ranked.map((r) => `${r.place}.${r.player.name}`)).toEqual(['1.B', '2.A', '2.C', '4.D'])
  })

  it('never shows two players on place 1', () => {
    const ranked = rankPlayers([p('A', 5), p('B', 5)], GameMode.TIMELINE_GLOBAL, 'B')
    expect(ranked.map((r) => r.place)).toEqual([1, 2])
    expect(ranked[0].player.name).toBe('B')
  })
})
