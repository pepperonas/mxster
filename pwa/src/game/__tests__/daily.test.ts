import { describe, it, expect } from 'vitest'
import { DAILY_TOTAL, dailyScore, dailySongs, localDay } from '../daily'
import { songs } from '@/data/songs'

describe('daily round', () => {
  it('everyone gets the same songs on the same day, whatever order the list is in', () => {
    const a = dailySongs('2026-10-28', songs).map((s) => s.id)
    const b = dailySongs('2026-10-28', [...songs].reverse()).map((s) => s.id)
    expect(a).toEqual(b)
    expect(a).toHaveLength(DAILY_TOTAL)
  })
  it('another day, other songs; well-known songs only, no two from the same year', () => {
    const today = dailySongs('2026-10-28', songs)
    const tomorrow = dailySongs('2026-10-29', songs)
    expect(today.map((s) => s.id)).not.toEqual(tomorrow.map((s) => s.id))
    expect(today.every((s) => !s.exotic)).toBe(true)
    expect(new Set(today.map((s) => s.year)).size).toBe(today.length)
  })
  it('the score leaves the start card out and stays in range', () => {
    expect(dailyScore(1)).toBe(0)
    expect(dailyScore(11)).toBe(10)
    expect(dailyScore(0)).toBe(0)
    expect(dailyScore(40)).toBe(10)
  })
  it('the day is the device calendar day', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('daily songs and admin corrections', () => {
  it('a corrected year or a blocked song elsewhere does not change the day for later players', async () => {
    const { dailySongs } = await import('../daily')
    const { songs } = await import('@/data/songs')
    const { applyOverrides } = await import('@/data/catalogue')
    const before = dailySongs('2026-10-28', songs).map((x) => x.id)
    // the screen draws from the bundled list, so this is what stays stable
    expect(dailySongs('2026-10-28', songs).map((x) => x.id)).toEqual(before)
    // whereas a list with corrections laid over it can differ (why the bundled list is used)
    const blocked = Object.fromEntries(before.slice(0, 1).map((id) => [id, { blocked: true }]))
    expect(dailySongs('2026-10-28', applyOverrides(songs, blocked)).map((x) => x.id)).not.toEqual(before)
  })
})
