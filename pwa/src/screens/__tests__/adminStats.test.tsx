import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { byRate, decadeTicks, mostPlayed, peak, songPlays, songsPerDecade, songsPerYear } from '../adminStatsModel'
import { Columns } from '@/components/charts/Columns'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { songs } from '@/data/songs'

describe('the catalogue over the years', () => {
  it('counts every year from the first to the last, empty years included', () => {
    const rows = songsPerYear([{ year: 1960 }, { year: 1963 }, { year: 1963 }])
    expect(rows).toEqual([
      { year: 1960, count: 1 },
      { year: 1961, count: 0 },
      { year: 1962, count: 0 },
      { year: 1963, count: 2 }
    ])
    expect(songsPerYear([])).toEqual([])
  })

  it('adds up to the whole catalogue, per year and per decade', () => {
    expect(songsPerYear(songs).reduce((n, r) => n + r.count, 0)).toBe(songs.length)
    expect(songsPerDecade(songs).reduce((n, r) => n + r.count, 0)).toBe(songs.length)
    expect(songsPerDecade([{ year: 1985 }, { year: 1979 }])).toEqual([
      { decade: 1970, count: 1 },
      { decade: 1980, count: 1 }
    ])
  })

  it('ticks the first year and every decade start', () => {
    expect(decadeTicks([1953, 1954, 1960, 1961, 1970])).toEqual(['1953', '1960', '1970'])
  })
})

describe('songs in play', () => {
  const plays = songPlays({ a: [5, 1], b: [3, 3], c: [2, 0], d: [9, 6] })
  it('most drawn first', () => {
    expect(mostPlayed(plays, 2).map((p) => p.id)).toEqual(['d', 'a'])
  })
  it('hardest and easiest only from 3 tries on', () => {
    expect(byRate(plays, 5, true).map((p) => p.id)).toEqual(['a', 'd', 'b'])
    expect(byRate(plays, 5, false).map((p) => p.id)).toEqual(['b', 'd', 'a'])
  })
  it('the peak is the first largest value, none when all are zero', () => {
    expect(peak([0, 3, 1, 3])).toBe(1)
    expect(peak([0, 0])).toBe(-1)
  })
})

describe('Columns', () => {
  const cols = [
    { key: '1980', label: '1980', value: 2 },
    { key: '1981', label: '1981', value: 0 },
    { key: '1982', label: '1982', value: 5 }
  ]
  it('reads out a column on hover or focus and every value in its table', () => {
    render(
      <MotionTestProvider>
        <Columns columns={cols} label="Songs pro Jahr" idle="7 Songs" describe={(c) => `${c.key}: ${c.value}`} valueHeading="Wert" tableToggle="Tabelle" />
      </MotionTestProvider>
    )
    expect(screen.getByText('7 Songs')).toBeTruthy()
    fireEvent.focus(screen.getByLabelText('1982: 5'))
    expect(screen.getAllByText('1982: 5').length).toBeGreaterThan(0)
    const cells = [...document.querySelectorAll('table td')].map((td) => td.textContent)
    expect(cells).toEqual(['2', '0', '5'])
  })
})

describe('admin screen', () => {
  it('has the statistics tab', () => {
    const src = readFileSync(join(process.cwd(), 'src/screens/AdminScreen.tsx'), 'utf8')
    expect(src).toContain("{ id: 'stats', label: 'tabStats' }")
    expect(src).toContain('<AdminStats />')
    // five tabs on a phone: a tab keeps its full label and the row scrolls
    expect(src).toContain('min-w-max')
  })
})
