import { describe, it, expect, beforeEach } from 'vitest'
import { markSaved, resultKey, wasSaved } from '../savedResults'

beforeEach(() => localStorage.clear())

describe('saved online results', () => {
  const result = { winner: { name: 'Anna', cards: 10 }, players: [{ name: 'Anna' }, { name: 'Ben' }] }

  it('recognises the same result as a new object (after a reconnect or reload)', () => {
    markSaved(resultKey('ROOM1', result))
    expect(wasSaved(resultKey('ROOM1', JSON.parse(JSON.stringify(result))))).toBe(true)
  })

  it('tells apart another round of the same room and the same round elsewhere', () => {
    markSaved(resultKey('ROOM1', result))
    expect(wasSaved(resultKey('ROOM1', { ...result, winner: { name: 'Ben', cards: 10 } }))).toBe(false)
    expect(wasSaved(resultKey('ROOM2', result))).toBe(false)
  })

  it('keeps only the latest 30', () => {
    for (let i = 0; i < 35; i++) markSaved(resultKey('R', { i }))
    expect(wasSaved(resultKey('R', { i: 0 }))).toBe(false)
    expect(wasSaved(resultKey('R', { i: 34 }))).toBe(true)
  })

  it('survives broken storage contents', () => {
    localStorage.setItem('mxtape_saved_results', '{oops')
    expect(wasSaved('x')).toBe(false)
    markSaved('x')
    expect(wasSaved('x')).toBe(true)
  })
})
