import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts'
import { setCurrentLang } from '@/i18n/lang'
import { PositionStrip } from '../PositionStrip'
import { SongInfo, factFor } from '../SongInfo'
import { announcementFor } from '../FeedbackLayer'
import type { Song } from '@/types'

const song = (year: number): Song => ({ id: `s${year}`, title: `Song ${year}`, artist: 'A', year })
const withFacts: Song = { ...song(1991), fact: 'Deutscher Fakt.', factEn: 'English fact.' }

const wrap = (ui: React.ReactNode) =>
  render(
    <MotionTestProvider>
      <AppProviders>{ui}</AppProviders>
    </MotionTestProvider>
  )

describe('game components in English', () => {
  beforeEach(() => setCurrentLang('en'))
  afterEach(() => setCurrentLang('de'))

  it('position strip names the gap and the open ends', () => {
    wrap(<PositionStrip timeline={[song(1983), song(2008)]} gap={2} />)
    const img = screen.getByRole('img', { name: 'After 2008' })
    expect(img.textContent).toBe('2008?later')
  })

  it('song info shows the English fact', () => {
    wrap(<SongInfo song={withFacts} head="none" />)
    expect(screen.getByText('English fact.')).toBeTruthy()
    expect(screen.getByText('Did you know?')).toBeTruthy()
    expect(screen.queryByText('Deutscher Fakt.')).toBeNull()
  })

  it('announces a reveal in English', () => {
    const text = announcementFor({
      kind: 'placement',
      song: song(1991),
      isCorrect: true,
      isFirstCard: false,
      playerIndex: 0,
      gapIndex: 0,
      cardsAfter: 1
    } as Parameters<typeof announcementFor>[0])
    expect(text).toBe('Placed correctly! Song 1991 is from 1991.')
  })
})

describe('factFor', () => {
  it('falls back to the German fact', () => {
    expect(factFor({ ...song(1991), fact: 'Nur deutsch.' }, 'en')).toBe('Nur deutsch.')
    expect(factFor(withFacts, 'de')).toBe('Deutscher Fakt.')
    expect(factFor(withFacts, 'en')).toBe('English fact.')
    expect(factFor(song(1991), 'en')).toBeUndefined()
  })

  it('shows the German fact in German', () => {
    wrap(<SongInfo song={withFacts} head="none" />)
    expect(screen.getByText('Deutscher Fakt.')).toBeTruthy()
  })
})
