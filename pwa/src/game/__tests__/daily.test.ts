import { describe, it, expect } from 'vitest'
import { DAILY_MAX, DAILY_TOTAL, dailyRunOver, dailyStreak, dailySongs, localDay, resumedTimeline } from '../daily'
import { songs } from '@/data/songs'

describe('daily round', () => {
  it('everyone gets the same songs on the same day, whatever order the list is in', () => {
    const a = dailySongs('2026-10-28', songs).map((s) => s.id)
    const b = dailySongs('2026-10-28', [...songs].reverse()).map((s) => s.id)
    expect(a).toEqual(b)
    expect(a).toHaveLength(DAILY_TOTAL)
  })
  it('another day, other songs; well-known songs only, no song twice; years spread as long as there are enough', () => {
    const today = dailySongs('2026-10-28', songs)
    const tomorrow = dailySongs('2026-10-29', songs)
    expect(today.map((s) => s.id)).not.toEqual(tomorrow.map((s) => s.id))
    expect(today.every((s) => !s.exotic)).toBe(true)
    expect(new Set(today.map((s) => s.id)).size).toBe(DAILY_TOTAL)
    const years = new Set(songs.filter((s) => !s.exotic).map((s) => s.year)).size
    const distinct = Math.min(years, DAILY_TOTAL)
    expect(new Set(today.slice(0, distinct).map((s) => s.year)).size).toBe(distinct)
  })
  it('a start card and up to 50 songs; the streak leaves the start card out and stays in range', () => {
    expect(DAILY_MAX).toBe(50)
    expect(DAILY_TOTAL).toBe(51)
    expect(dailyStreak(0)).toBe(0)
    expect(dailyStreak(1)).toBe(0)
    expect(dailyStreak(8)).toBe(7)
    expect(dailyStreak(99)).toBe(DAILY_MAX)
  })
  it('the run ends at the first wrong card or after the last song — never at the start card', () => {
    const ids = dailySongs('2026-10-28', songs).map((s) => s.id)
    expect(dailyRunOver(undefined, ids)).toBe(false)
    expect(dailyRunOver({ s: ids[0], ok: true, first: true }, ids)).toBe(false)
    expect(dailyRunOver({ s: ids[3], ok: true }, ids)).toBe(false)
    expect(dailyRunOver({ s: ids[3], ok: false }, ids)).toBe(true)
    expect(dailyRunOver({ s: ids[DAILY_MAX], ok: true }, ids)).toBe(true)
  })
  it('a paused run comes back with the start card and every booked song on the timeline, in year order', () => {
    const list = dailySongs('2026-10-28', songs)
    expect(resumedTimeline(list, 0)).toEqual([])
    const back = resumedTimeline(list, 3)
    expect(back.map((s) => s.id).sort()).toEqual(list.slice(0, 4).map((s) => s.id).sort())
    for (let i = 1; i < back.length; i++) expect(back[i].year).toBeGreaterThanOrEqual(back[i - 1].year)
    expect(resumedTimeline(list, 500)).toHaveLength(DAILY_TOTAL)
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
