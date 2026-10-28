import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { rampRate, MOTOR } from '../useRecordMotor'
import { Vinyl } from '../Vinyl'
import { isNew, lastSeen, markSeen, SEEN_KEY } from '@/game/achievementSeen'
import { rankDelay } from '@/components/game/GameOver'
import type { Achievement } from '@/types/achievements'

const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/g, '')

describe('record motor', () => {
  it('ramps eased out, from its start to its end, clamped', () => {
    expect(rampRate(0, 1, 0)).toBe(0)
    expect(rampRate(0, 1, 1)).toBe(1)
    expect(rampRate(0, 1, 2)).toBe(1)
    expect(rampRate(1, 0, -1)).toBe(1)
    // eased out: past the halfway mark at half time, and always monotonic
    expect(rampRate(0, 1, 0.5)).toBeGreaterThan(0.5)
    let prev = -1
    for (let t = 0; t <= 1; t += 0.05) {
      const v = rampRate(0, 1, t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('a platter starts quicker than it coasts', () => {
    expect(MOTOR.upMs).toBeLessThan(MOTOR.downMs)
  })

  it('without the Web Animations API the record simply follows `spinning`', () => {
    const { container, rerender } = render(<Vinyl spinning />)
    const svg = () => container.querySelector('svg.vinyl')!
    expect(svg().getAttribute('data-spinning')).toBe('true')
    rerender(<Vinyl spinning={false} />)
    expect(svg().getAttribute('data-spinning')).toBe('false')
  })
})

describe('new achievements', () => {
  const a = (unlockedAt?: number, unlocked = true) => ({ id: 'FIRST_ROUND', unlocked, unlockedAt }) as unknown as Achievement
  beforeEach(() => localStorage.clear())

  it('marks only what was unlocked after the last visit', () => {
    expect(isNew(a(200), 100)).toBe(true)
    expect(isNew(a(100), 100)).toBe(false)
    expect(isNew(a(50), 100)).toBe(false)
    expect(isNew(a(200, false), 100)).toBe(false)
    expect(isNew(a(undefined), 100)).toBe(false)
  })

  it('a person never looked at before marks nothing', () => {
    expect(lastSeen('Lisa')).toBeNull()
    expect(isNew(a(200), lastSeen('Lisa'))).toBe(false)
  })

  it('remembers the visit per person and survives a broken store', () => {
    markSeen('Lisa', 500)
    markSeen('Martin', 700)
    expect(lastSeen('Lisa')).toBe(500)
    expect(lastSeen('Martin')).toBe(700)
    localStorage.setItem(SEEN_KEY, 'nonsense')
    expect(lastSeen('Lisa')).toBeNull()
  })

  it('the page reads the visit before it notes this one', () => {
    const page = src('src/screens/AchievementsScreen.tsx')
    expect(page).toContain('useMemo(() => lastSeen(who), [who])')
    expect(page).toContain('useEffect(() => markSeen(who), [who])')
    expect(page.indexOf('lastSeen(who)')).toBeLessThan(page.indexOf('markSeen(who)'))
  })
})

describe('end of round', () => {
  it('the ranking fills from the bottom and the winner arrives last', () => {
    const delays = [0, 1, 2, 3].map((i) => rankDelay(i, 4))
    expect(delays[3]).toBeLessThan(delays[2])
    expect(delays[2]).toBeLessThan(delays[1])
    expect(delays[0]).toBeGreaterThan(delays[1])
    // …and a beat later than the rows before it come one after the other
    expect(delays[0] - delays[1]).toBeGreaterThan(delays[1] - delays[2])
    expect(rankDelay(0, 1)).toBeGreaterThan(0)
  })
})

describe('empty states and the radar', () => {
  it('history and statistics use the shared empty state', () => {
    for (const f of ['HistoryScreen', 'StatisticsScreen']) expect(src(`src/screens/${f}.tsx`), f).toContain('<EmptyState')
  })

  it('the radar morphs its web instead of redrawing it', () => {
    const radar = src('src/components/charts/RadarChart.tsx')
    expect(radar).toMatch(/<m\.polygon[\s\S]*?animate=\{\{ points: poly\(pts\) \}\}/)
    expect(radar).toMatch(/<m\.circle[\s\S]*?animate=\{\{ cx: pts\[i\]\[0\], cy: pts\[i\]\[1\] \}\}/)
  })
})
