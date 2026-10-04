import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { TimelineBoard } from '../TimelineBoard'
import type { Song } from '@/types'

const song = (year: number, title = `Song ${year}`): Song => ({ id: `id-${year}-${title}`, title, artist: 'Artist', year })
const cards = [song(1970), song(1985), song(2001)].map((s) => ({ song: s }))

const renderBoard = (props: Partial<React.ComponentProps<typeof TimelineBoard>> = {}) =>
  render(
    <MotionTestProvider>
      <TimelineBoard label="Zeitleiste" cards={cards} {...props} />
    </MotionTestProvider>
  )

describe('TimelineBoard', () => {
  it('shows only cards when not interactive', () => {
    renderBoard()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('offers a labelled gap before, between and after every card', () => {
    renderBoard({ interactive: true, pendingSong: song(1990, 'neu') })
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Hier einfügen: Vor 1970',
      'Hier einfügen: Zwischen 1970 und 1985',
      'Hier einfügen: Zwischen 1985 und 2001',
      'Hier einfügen: Nach 2001'
    ])
  })

  it('reports the tapped gap', () => {
    const onGapSelect = vi.fn()
    renderBoard({ interactive: true, pendingSong: song(1990, 'neu'), onGapSelect })
    fireEvent.click(screen.getByRole('button', { name: /Zwischen 1985 und 2001/ }))
    expect(onGapSelect).toHaveBeenCalledWith(2)
  })

  it('a previewed card sits in its gap without revealing its year', () => {
    renderBoard({ interactive: true, pendingSong: song(1990, 'neu'), previewGap: 2 })
    const items = screen.getAllByRole('listitem')
    const previewIndex = items.findIndex((li) => li.textContent?.includes('neu'))
    // gap0, 1970, gap1, 1985, [preview], 2001, gap3
    // no part of the card may carry the year (screen readers, DevTools)
    expect(items[previewIndex].textContent).not.toContain('1990')
    expect(items[previewIndex].innerHTML).not.toContain('1990')
    expect(within(items[previewIndex]).getByLabelText('Jahr verdeckt')).toBeInTheDocument()
    expect(items[previewIndex - 1].textContent).toContain('1985')
    expect(items[previewIndex + 1].textContent).toContain('2001')
    expect(screen.queryByRole('button', { name: /Zwischen 1985 und 2001/ })).toBeNull()
  })

  it('a wrong card appears as a ghost at the chosen gap with its true year', () => {
    renderBoard({ reveal: { song: song(1960, 'falsch'), gapIndex: 3, isCorrect: false } })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[3].textContent).toContain('falsch')
    expect(items[3].textContent).toContain('1960')
  })

  it('blurs years when requested, except the card just revealed', () => {
    renderBoard({ hideYears: true, reveal: { song: cards[1].song, gapIndex: 1, isCorrect: true } })
    expect(screen.getByText('1970')).toHaveClass('blur-[6px]')
    expect(screen.getByText('1985')).not.toHaveClass('blur-[6px]')
  })

  it('offers one large gap on an empty board', () => {
    render(
      <MotionTestProvider>
        <TimelineBoard label="Leer" cards={[]} interactive pendingSong={song(1999)} />
      </MotionTestProvider>
    )
    expect(screen.getByRole('button', { name: 'Hier einfügen: Erste Karte platzieren' })).toHaveClass('min-h-[88px]')
  })
})
