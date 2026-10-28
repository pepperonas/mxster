import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider, msg, setCurrentLang } from '@/i18n'
import { statsText } from '../messages/stats'
import { historyText } from '../messages/history'
import { playersText } from '../messages/players'
import { achievementText } from '../messages/achievements'
import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementId,
  achievementDescription,
  achievementName,
  localizeAchievement,
  type Achievement
} from '@/types/achievements'
import { WeekColumns } from '@/components/charts/Bars'
import { MotionTestProvider } from '@/test/MotionTestProvider'

afterEach(() => setCurrentLang('de'))

describe('achievement texts', () => {
  it('has a German and an English name and description for every id', () => {
    for (const id of Object.values(AchievementId)) {
      setCurrentLang('de')
      expect(achievementName(id)).not.toBe(id)
      expect(achievementDescription(id)).not.toBe('')
      setCurrentLang('en')
      expect(achievementName(id)).not.toBe(id)
      expect(achievementDescription(id)).not.toBe('')
    }
  })

  it('names achievements in English by id', () => {
    setCurrentLang('en')
    expect(achievementName(AchievementId.ZEITMASCHINE)).toBe('Time machine')
    expect(achievementDescription(AchievementId.UNBEATABLE)).toBe('Won 5 rounds in a row')
    // The definitions follow the language at access time
    expect(ACHIEVEMENT_DEFINITIONS[AchievementId.PERFECTIONIST].name).toBe('Perfectionist')
    setCurrentLang('de')
    expect(ACHIEVEMENT_DEFINITIONS[AchievementId.PERFECTIONIST].name).toBe('Perfektionist')
  })

  it('ignores old German strings stored in the synced document', () => {
    setCurrentLang('en')
    const stored: Achievement = {
      id: AchievementId.CENTURION,
      name: 'Zenturio',
      description: '100 Spiele gespielt',
      icon: 'verified',
      unlocked: true
    }
    const shown = localizeAchievement(stored)
    expect(shown.name).toBe('Centurion')
    expect(shown.description).toBe('Played 100 games')
    expect(shown.unlocked).toBe(true)
  })

  it('keeps the German progress wording', () => {
    expect(msg(achievementText).progress(2, 5)).toBe('2 von 5')
    setCurrentLang('en')
    expect(msg(achievementText).progress(2, 5)).toBe('2 of 5')
  })
})

describe('stats and history plurals', () => {
  it('counts rounds in English', () => {
    setCurrentLang('en')
    const t = msg(statsText)
    expect(t.fromRounds(1)).toBe('From 1 round.')
    expect(t.fromRounds(4)).toBe('From 4 rounds.')
    expect(t.exactYears(1)).toBe('1 year exact')
    expect(t.percent(42)).toBe('42%')
    expect(msg(historyText).songsRight(1)).toBe('1 song right')
    expect(msg(playersText).wins(3)).toBe('3 wins')
  })

  it('keeps the German wording', () => {
    const t = msg(statsText)
    expect(t.fromRounds(1)).toBe('Aus 1 Runde.')
    expect(t.percent(42)).toBe('42 %')
    expect(msg(historyText).resultAt('3 Songs richtig', '20:15')).toBe('3 Songs richtig, 20:15 Uhr')
  })
})

describe('week chart dates', () => {
  const weeks = [
    { start: new Date(2026, 2, 2).getTime(), rounds: 1 },
    { start: new Date(2026, 2, 9).getTime(), rounds: 3 }
  ]

  it('formats week dates in English', () => {
    render(
      <LanguageProvider initial="en">
        <MotionTestProvider>
          <WeekColumns weeks={weeks} label="Rounds per week" />
        </MotionTestProvider>
      </LanguageProvider>
    )
    expect(screen.getByText('This week')).toBeInTheDocument()
    expect(screen.getByText('3 rounds')).toBeInTheDocument()
    expect(screen.getByLabelText('Week of 2 Mar: 1 round')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('formats week dates in German', () => {
    render(
      <LanguageProvider initial="de">
        <MotionTestProvider>
          <WeekColumns weeks={weeks} label="Runden pro Woche" />
        </MotionTestProvider>
      </LanguageProvider>
    )
    expect(screen.getByText('Diese Woche')).toBeInTheDocument()
    expect(screen.getByLabelText('Woche ab 2. März: 1 Runde')).toBeInTheDocument()
  })
})
