import { describe, it, expect } from 'vitest'
import { blindSnapshot, sanitizeResult } from '../sanitize'

const song = { id: 's1', title: 'T', artist: 'A', year: 1984, album: 'Alb', fact: 'Fakt', previewUrl: '/audio/s1.m4a' }

describe('blindSnapshot', () => {
  it('sends the song on the platter without year, album and fact before the reveal', () => {
    const out = blindSnapshot({ currentSong: song, reveal: null } as never)
    expect(out.currentSong).toEqual({ id: 's1', title: 'T', artist: 'A', previewUrl: '/audio/s1.m4a', year: 0 })
    expect(JSON.stringify(out)).not.toContain('1984')
  })

  it('leaves everything as it is once revealed', () => {
    const game = { currentSong: song, reveal: { kind: 'placement', song } } as never
    expect(blindSnapshot(game)).toBe(game)
  })
})

describe('sanitizeResult', () => {
  const p = (name: string, extra = {}) => ({ name, cards: 3, score: 0, timeline: [{ id: 'a', title: 'x', artist: 'y', year: 1990 }], ...extra })

  it('keeps a sensible result', () => {
    const r = sanitizeResult({ winner: p('Martin'), players: [p('Martin'), p('Lisa', { guest: true })] }, 'timeline_personal', [{ p: 'Lisa', s: 'a', y: 1990, ok: true }])
    expect(r?.players.map((x) => x.name)).toEqual(['Martin', 'Lisa'])
    expect(r?.turns).toHaveLength(1)
  })

  it('refuses nonsense: unknown mode, a winner who did not play, no players', () => {
    expect(sanitizeResult({ winner: p('X'), players: [p('Y')] }, 'timeline_personal', [])).toBeNull()
    expect(sanitizeResult({ winner: p('X'), players: [p('X')] }, 'evil', [])).toBeNull()
    expect(sanitizeResult({ winner: p('X'), players: [] }, 'hardcore', [])).toBeNull()
    expect(sanitizeResult('junk', 'hardcore', [])).toBeNull()
  })

  it('cuts sizes and drops unexpected fields', () => {
    const many = Array.from({ length: 30 }, (_, i) => p(`P${i}`))
    const huge = { ...p('Big'), name: 'B'.repeat(500), cards: 1e9, extra: 'x', timeline: Array.from({ length: 500 }, (_, i) => ({ id: `s${i}`, title: 't', artist: 'a', year: 3000, html: '<b>' })) }
    const r = sanitizeResult({ winner: many[0], players: [...many, huge] }, 'hardcore', Array.from({ length: 1000 }, () => ({ p: 'P0', s: 's', y: 1990, ok: 'yes' })))
    expect(r!.players).toHaveLength(10)
    expect(r!.turns).toHaveLength(400)
    expect(r!.turns[0].ok).toBe(false)
    const big = sanitizeResult({ winner: huge, players: [huge] }, 'hardcore', [])!
    expect(big.players[0].name).toHaveLength(40)
    expect(big.players[0].cards).toBe(60)
    expect(big.players[0].timeline).toHaveLength(60)
    expect(big.players[0].timeline[0]).toEqual({ id: 's0', title: 't', artist: 'a', year: 2100 })
    expect('extra' in big.players[0]).toBe(false)
  })
})
