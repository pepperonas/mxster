import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { LanguageProvider } from '@/i18n'
import { TimelineBoard } from '../TimelineBoard'
import { GameOver, MOSAIC_MAX, MOSAIC_OPACITY, MOSAIC_VEIL } from '../GameOver'
import { roundSongIds } from '@/utils/cover'
import { COVER_MAX, coverSlots } from '@/utils/resultImage'
import { GameMode, type Player, type Song } from '@/types'

const song = (year: number): Song => ({ id: `song_${year}`, title: `Song ${year}`, artist: 'Artist', year })

describe('covers on the timeline', () => {
  it('every face-up card shows its cover, the waiting card never (it could hint the era)', () => {
    const { container } = render(
      <MotionTestProvider>
        <TimelineBoard label="Zeitleiste" cards={[song(1970), song(1985)].map((s) => ({ song: s }))} pendingSong={song(1990)} placedGap={2} />
      </MotionTestProvider>
    )
    const covers = [...container.querySelectorAll('[data-card-cover] img')].map((i) => i.getAttribute('src'))
    expect(covers).toEqual(['/audio/covers/song_1970.jpg', '/audio/covers/song_1985.jpg'])
  })
})

describe('the songs of a stored round', () => {
  it('come from the turn log in play order, once each', () => {
    expect(roundSongIds({ turns: [{ s: 'b' }, { s: 'a' }, { s: 'b' }], players: [{ timeline: [{ id: 'x' }] }] })).toEqual(['b', 'a'])
  })
  it('fall back to the timelines for rounds without a turn log', () => {
    expect(roundSongIds({ players: [{ timeline: [{ id: 'x' }, { id: 'y' }] }, { timeline: [{ id: 'x' }] }] })).toEqual(['x', 'y'])
    expect(roundSongIds({ turns: [], players: [] })).toEqual([])
  })
})

describe('the round end', () => {
  const players = [{ name: 'A', cards: 5, score: 0, timeline: [] }, { name: 'B', cards: 2, score: 0, timeline: [] }] as unknown as Player[]
  const view = (songIds?: string[]) =>
    render(
      <LanguageProvider initial="de">
        <MotionTestProvider>
          <GameOver winner={players[0]} players={players} mode={GameMode.TIMELINE_GLOBAL} onHome={() => {}} songIds={songIds} />
        </MotionTestProvider>
      </LanguageProvider>
    )

  it('lays the round’s covers behind the result, a full grid even from a few songs', () => {
    const { container } = view(['song_1', 'song_2', 'song_3'])
    const srcs = [...container.querySelectorAll('[data-cover-mosaic] img')].map((i) => i.getAttribute('src'))
    expect(srcs).toHaveLength(MOSAIC_MAX)
    expect(new Set(srcs)).toEqual(new Set(['/audio/covers/song_1.jpg', '/audio/covers/song_2.jpg', '/audio/covers/song_3.jpg']))
  })

  it('without songs there is no mosaic', () => {
    expect(view([]).container.querySelector('[data-cover-mosaic]')).toBeNull()
    expect(view().container.querySelector('[data-cover-mosaic]')).toBeNull()
  })

  it('the covers stay a hint: at most a fifth of their colour reaches the text', () => {
    expect(MOSAIC_OPACITY * (1 - MOSAIC_VEIL)).toBeLessThanOrEqual(0.2)
  })
})

describe('the picture to share', () => {
  it('fans out up to five covers, clear of the record on the right', () => {
    const slots = coverSlots(9)
    expect(slots).toHaveLength(COVER_MAX)
    // the record's disc starts at x = 1080 − 120 − 300 = 660; the kicker line at y ≈ 520
    for (const s of slots) {
      expect(s.x + 150).toBeLessThan(660)
      expect(s.y + 150).toBeLessThan(520)
    }
    expect(coverSlots(0)).toEqual([])
  })
  it('the round end hands the round’s covers to it', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/game/GameOver.tsx'), 'utf8')
    expect(src).toContain('covers: songIds.slice(0, COVER_MAX).map((id) => coverSrc({ id }))')
    expect(readFileSync(join(process.cwd(), 'src/screens/GameScreen.tsx'), 'utf8')).toContain('songIds={roundSongIds({ turns: turnLog, players: shownResult.players })}')
  })
})
