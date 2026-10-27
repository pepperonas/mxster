import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts'
import { PositionStrip } from '../PositionStrip'
import { TimelineBoard } from '../TimelineBoard'
import type { Song } from '@/types'

const song = (year: number): Song => ({ id: `s${year}`, title: `Song ${year}`, artist: 'A', year })
const timeline = [song(1984), song(2013)]

const strip = (gap: number, tl = timeline) =>
  render(
    <MotionTestProvider>
      <AppProviders>
        <PositionStrip timeline={tl} gap={gap} />
      </AppProviders>
    </MotionTestProvider>
  )

describe('PositionStrip', () => {
  it('shows the years on both sides of the slot', () => {
    strip(1)
    const img = screen.getByRole('img', { name: 'Zwischen 1984 und 2013' })
    expect(img.textContent).toBe('1984?2013')
  })

  it('names the open end at the edges', () => {
    strip(0)
    expect(screen.getByRole('img', { name: 'Vor 1984' }).textContent).toBe('früher?1984')
  })

  it('says "Erste Karte" on an empty timeline', () => {
    strip(0, [])
    expect(screen.getByText('Erste Karte')).toBeInTheDocument()
  })
})

describe('board neighbours of a waiting card', () => {
  it('colour exactly the two year chips around the placed card', () => {
    const cards = [song(1970), song(1984), song(2013)].map((s) => ({ song: s }))
    render(
      <MotionTestProvider>
        <TimelineBoard label="Zeitleiste" cards={cards} pendingSong={song(1999)} placedGap={2} />
      </MotionTestProvider>
    )
    const chip = (year: number) => screen.getByText(String(year)).closest('span[class*="w-[4.25rem]"]')!
    expect(chip(1984).className).toContain('bg-md-primary ')
    expect(chip(2013).className).toContain('bg-md-primary ')
    expect(chip(1970).className).not.toContain('bg-md-primary ')
  })
})
