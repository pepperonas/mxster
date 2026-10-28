import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rematchStarter } from '../rematch'
import type { Player } from '@/types'

const p = (name: string, cards = 0, score = 0) => ({ name, cards, score }) as Player

describe('who starts again with the same people', () => {
  it('whoever came last (cards, or points in hardcore)', () => {
    expect(rematchStarter([p('A', 5), p('B', 2), p('C', 3)], 'timeline_personal', 'A')).toBe(1)
    expect(rematchStarter([p('A', 1, 40), p('B', 9, 5), p('C', 3, 20)], 'hardcore', 'A')).toBe(1)
  })
  it('a shared last place: the first of them in seat order', () => {
    expect(rematchStarter([p('A', 5), p('B', 2), p('C', 2)], 'timeline_global', 'A')).toBe(1)
  })
  it('never the winner, even when a tiebreak left everyone level', () => {
    expect(rematchStarter([p('A', 5), p('B', 5)], 'timeline_global', 'A')).toBe(1)
    expect(rematchStarter([p('A', 5), p('B', 5)], 'timeline_global', 'B')).toBe(0)
  })
  it('one person alone simply starts', () => {
    expect(rematchStarter([p('A', 5)], 'timeline_personal', 'A')).toBe(0)
    expect(rematchStarter([], 'timeline_personal')).toBe(0)
  })
  it('the round end passes the winner and names who starts', () => {
    const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')
    expect(src('src/screens/GameScreen.tsx')).toContain('rematch(shownResult.winner.name)')
    expect(src('src/components/game/GameOver.tsx')).toContain('t.rematchStarter(starter)')
  })
})
