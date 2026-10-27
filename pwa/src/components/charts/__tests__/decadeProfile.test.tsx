import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DecadeProfile } from '../DecadeProfile'
import { summarize } from '@/game/stats'
import { GameMode, type HistoryEntry } from '@/types'

const round = (turns?: HistoryEntry['turns']): HistoryEntry => ({
  id: 1,
  timestamp: 1,
  date: new Date(1).toISOString(),
  winner: { name: 'Lisa', cards: 2, score: 0 },
  gameMode: GameMode.TIMELINE_GLOBAL,
  players: [{ name: 'Lisa', cards: 2, score: 0, timeline: [] }],
  ...(turns ? { turns } : {})
})

describe('DecadeProfile, cards view', () => {
  it('draws the shared-timeline cards from the turn log', () => {
    const people = summarize([round([{ p: 'Lisa', s: 'a', y: 1984, ok: true }, { p: 'Lisa', s: 'b', y: 1991, ok: true }])])
    render(<DecadeProfile people={people} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Karten' }))
    expect(screen.queryByText(/kennt mxtape die Jahrzehnte der Karten nicht/)).toBeNull()
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('says why the web is empty instead of drawing nothing', () => {
    render(<DecadeProfile people={summarize([round()])} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Karten' }))
    expect(screen.getByText(/kennt mxtape die Jahrzehnte der Karten nicht/)).toBeTruthy()
  })
})
