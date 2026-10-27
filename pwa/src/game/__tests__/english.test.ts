/** The rule modules' wording follows the app language at call time. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setCurrentLang } from '@/i18n/lang'
import { gapLabel } from '../placement'
import { MODE_COPY, DIFFICULTY_LABEL } from '../modeCopy'
import { GOAL_LABEL, goalWord } from '../roundEnd'
import { decadeLabel } from '../songPool'
import { TEAMS } from '../teams'
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'
import type { Song } from '@/types'

const song = (year: number): Song => ({ id: `s${year}`, title: `Song ${year}`, artist: 'A', year })
const tl = [song(1983), song(2008)]

describe('rule wording in English', () => {
  beforeEach(() => setCurrentLang('en'))
  afterEach(() => setCurrentLang('de'))

  it('names gaps', () => {
    expect(gapLabel([], 0)).toBe('Place the first card')
    expect(gapLabel(tl, 0)).toBe('Before 1983')
    expect(gapLabel(tl, 1)).toBe('Between 1983 and 2008')
    expect(gapLabel(tl, 2)).toBe('After 2008')
  })

  it('names modes, difficulties, lengths, decades and teams', () => {
    expect(MODE_COPY.timeline_personal.name).toBe('Own timeline')
    expect(MODE_COPY.timeline_global.name).toBe('Shared timeline')
    expect(MODE_COPY.hardcore.name).toBe('Hardcore')
    expect(MODE_COPY.timeline_personal.how(10)).toContain('ten songs')
    expect(DIFFICULTY_LABEL.easy).toBe('Easy')
    expect(GOAL_LABEL[15]).toBe('Long')
    expect(goalWord(5)).toBe('five')
    expect(decadeLabel(1980)).toBe('80s')
    expect(TEAMS[3].name).toBe('Team Green')
  })

  it('joins tiebreak names with commas and a final "and"', () => {
    expect(msg(modesText).tie(['Ann', 'Bo', 'Cy'])).toBe('Tied! Tiebreak between Ann, Bo and Cy')
  })

  it('switches back at runtime', () => {
    expect(MODE_COPY.timeline_personal.name).toBe('Own timeline')
    setCurrentLang('de')
    expect(MODE_COPY.timeline_personal.name).toBe('Eigene Zeitleiste')
    expect(decadeLabel(1980)).toBe('80er')
    expect(gapLabel(tl, 0)).toBe('Vor 1983')
  })
})
