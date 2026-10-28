/**
 * Small pure helpers that had no tests of their own: hardcore scoring, the
 * turn phase, turn records, correct gaps, the owner's name, dates.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { guessBreakdown, guessDetailsFor, guessTier, yearPoints } from '../guess'
import { derivePhase, deriveTurn, type TurnInput } from '../deriveTurn'
import { guessRecord, placementRecord } from '../turnRecord'
import { correctGapIndices, evaluatePlacement } from '../placement'
import { ownPlayerName } from '../owner'
import { coverSrc } from '@/utils/cover'
import { formatDay } from '@/utils/format'
import { setCurrentLang } from '@/i18n'
import { GameMode, type Player, type Song } from '@/types'

const song = (year: number, id = `s${year}`): Song => ({ id, title: `T${year}`, artist: 'A', year })
const player = (name: string, extra: Partial<Player> = {}): Player => ({ name, timeline: [], cards: 0, score: 0, ...extra })

describe('hardcore scoring', () => {
  it('gives 5 / 2 / 1 / 0 points for the year by distance', () => {
    expect([0, 1, 2, 3, 10, 9999].map(yearPoints)).toEqual([5, 2, 1, 0, 0, 0])
  })

  it('adds title, artist and year', () => {
    expect(guessBreakdown({ titleMatch: true, artistMatch: true, yearDifference: 0 })).toEqual({ title: 5, artist: 5, year: 5, total: 15 })
    expect(guessBreakdown({ titleMatch: false, artistMatch: true, yearDifference: 2 })).toEqual({ title: 0, artist: 5, year: 1, total: 6 })
    expect(guessBreakdown({ titleMatch: false, artistMatch: false, yearDifference: 7 }).total).toBe(0)
  })

  it('names the tier of every total', () => {
    expect([15, 14, 10, 9, 5, 4, 1, 0].map(guessTier)).toEqual(['perfect', 'great', 'great', 'good', 'good', 'partial', 'partial', 'miss'])
  })

  it('keeps the details that the achievements read', () => {
    expect(guessDetailsFor({ titleMatch: true, artistMatch: false, yearDifference: 1 })).toEqual({
      titleCorrect: true,
      artistCorrect: false,
      yearPoints: 2
    })
  })
})

describe('turn phase', () => {
  const base: TurnInput = {
    gameMode: GameMode.TIMELINE_PERSONAL,
    players: [player('A', { timeline: [song(1990)] }), player('B')],
    currentPlayer: 0,
    currentSong: null,
    globalTimeline: [],
    reveal: null,
    pending: null,
    finished: false
  }

  it('walks idle → placing / guessing → challenge → revealed → over, in that priority', () => {
    expect(derivePhase(base)).toBe('idle')
    expect(derivePhase({ ...base, currentSong: song(2000) })).toBe('placing')
    expect(derivePhase({ ...base, currentSong: song(2000), gameMode: GameMode.HARDCORE })).toBe('guessing')
    const pending = { gapIndex: 0 } as never
    expect(derivePhase({ ...base, currentSong: song(2000), pending })).toBe('challenge')
    const reveal = { kind: 'placement' } as never
    expect(derivePhase({ ...base, currentSong: song(2000), pending, reveal })).toBe('revealed')
    expect(derivePhase({ ...base, currentSong: song(2000), pending, reveal, finished: true })).toBe('over')
  })

  it('plays on the own timeline, or on the shared one in the global mode', () => {
    expect(deriveTurn(base).activeTimeline.map((s) => s.year)).toEqual([1990])
    const global = { ...base, gameMode: GameMode.TIMELINE_GLOBAL, globalTimeline: [{ song: song(1970) }] as never }
    expect(deriveTurn(global).activeTimeline.map((s) => s.year)).toEqual([1970])
  })

  it('copes with a player index past the end (someone just left)', () => {
    const t = deriveTurn({ ...base, currentPlayer: 5 })
    expect(t.activePlayer).toBeUndefined()
    expect(t.activeTimeline).toEqual([])
  })
})

describe('turn records', () => {
  it('names the member at the controls of a team and the team', () => {
    const team = player('Rot', { members: ['Anna', 'Ben'], memberTurn: 1 })
    expect(placementRecord(team, song(1980), true, false, null)).toEqual({ p: 'Ben', team: 'Rot', s: 's1980', y: 1980, ok: true })
  })

  it('marks a first card and a bot, and keeps the objection', () => {
    const bot = player('Bot Alpha', { isBot: true })
    const rec = placementRecord(bot, song(1980), false, true, { by: player('Lisa'), ok: true })
    expect(rec).toEqual({ p: 'Bot Alpha', bot: true, s: 's1980', y: 1980, ok: false, first: true, ch: { by: 'Lisa', ok: true } })
  })

  it('counts a hardcore guess right within two years, and leaves out a missing year', () => {
    const near = guessRecord(player('A'), song(1980), { titleMatch: false, artistMatch: true, yearDifference: -2 }, 6)
    expect(near).toMatchObject({ ok: true, d: 2, ti: false, ar: true, pts: 6 })
    const none = guessRecord(player('A'), song(1980), { titleMatch: true, artistMatch: false, yearDifference: 9999 }, 5)
    expect(none.ok).toBe(false)
    expect('d' in none).toBe(false)
  })
})

describe('placement', () => {
  const tl = [song(1970), song(1985), song(1985), song(2000)]

  it('accepts a year equal to a neighbour on either side', () => {
    expect(correctGapIndices(tl, song(1985, 'x'))).toEqual([1, 2, 3])
  })

  it('finds exactly the one right gap otherwise, and the ends', () => {
    expect(correctGapIndices(tl, song(1990))).toEqual([3])
    expect(correctGapIndices(tl, song(1950))).toEqual([0])
    expect(correctGapIndices(tl, song(2020))).toEqual([4])
  })

  it('clamps a gap index outside the timeline instead of losing the card', () => {
    expect(evaluatePlacement(tl, song(2020), 99).newTimeline.slice(-1)[0]?.year).toBe(2020)
    expect(evaluatePlacement(tl, song(1950), -3).newTimeline[0].year).toBe(1950)
  })

  it('leaves the timeline it was given untouched', () => {
    const before = tl.map((s) => s.id)
    evaluatePlacement(tl, song(1990), 2)
    expect(tl.map((s) => s.id)).toEqual(before)
  })
})

describe('owner and covers', () => {
  it('uses the first name, capped, with a fallback', () => {
    expect(ownPlayerName('Martin Pfeffer')).toBe('Martin')
    expect(ownPlayerName('  Lisa  ')).toBe('Lisa')
    expect(ownPlayerName('')).toBe('Ich')
    expect(ownPlayerName('Maximiliansebastianjohannes Meier')).toHaveLength(20)
  })

  it('serves covers next to the audio files', () => {
    expect(coverSrc({ id: 'song_042' })).toBe('/audio/covers/song_042.jpg')
  })
})

describe('formatDay', () => {
  afterEach(() => setCurrentLang('de'))
  const now = new Date(2026, 9, 28, 10, 0)

  it('says today and yesterday across midnight', () => {
    expect(formatDay(new Date(2026, 9, 28, 0, 5).getTime(), now)).toBe('heute')
    expect(formatDay(new Date(2026, 9, 27, 23, 59).getTime(), now)).toBe('gestern')
  })

  it('writes the date, with the year only for other years', () => {
    expect(formatDay(new Date(2026, 2, 12).getTime(), now)).toBe('12. März')
    expect(formatDay(new Date(2025, 2, 12).getTime(), now)).toBe('12. März 2025')
  })

  it('follows the app language', () => {
    setCurrentLang('en')
    expect(formatDay(new Date(2026, 9, 28).getTime(), now)).toBe('today')
    expect(formatDay(new Date(2026, 2, 12).getTime(), now)).toBe('12 March')
  })
})
