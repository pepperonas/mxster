import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { AchievementId, type Achievement } from '@/types/achievements'
import { ACHIEVEMENT_POINTS, MAX_POINTS, RANKS, pointsFor, pointsSince, rankBoard, rankFor, totalPoints } from '../achievementPoints'
import { earnedThisRound } from '@/components/game/GameOver'
import { RankCard } from '@/components/achievements/RankCard'
import { LanguageProvider, setCurrentLang } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { ICON_NAMES } from '@/components/ui/Icon'
import type { Player } from '@/types'

const a = (id: AchievementId, unlocked = true, unlockedAt?: number) => ({ id, unlocked, unlockedAt }) as unknown as Achievement

describe('points per achievement', () => {
  it('every achievement is worth 50 to 250 in steps of 50', () => {
    const ids = Object.values(AchievementId)
    expect(Object.keys(ACHIEVEMENT_POINTS).sort()).toEqual([...ids].sort())
    for (const id of ids) expect([50, 100, 150, 200, 250], id).toContain(ACHIEVEMENT_POINTS[id])
  })

  it('all five levels are used, and the hardest are rare', () => {
    const counts = new Map<number, number>()
    for (const p of Object.values(ACHIEVEMENT_POINTS)) counts.set(p, (counts.get(p) ?? 0) + 1)
    expect([...counts.keys()].sort((x, y) => x - y)).toEqual([50, 100, 150, 200, 250])
    expect(counts.get(250)!).toBeLessThan(counts.get(50)!)
  })

  it('harder versions of the same goal are worth more', () => {
    const pairs: [AchievementId, AchievementId][] = [
      [AchievementId.FIRST_ROUND, AchievementId.REGULAR],
      [AchievementId.REGULAR, AchievementId.MARATHON_RUNNER],
      [AchievementId.MARATHON_RUNNER, AchievementId.CENTURION],
      [AchievementId.FIRST_WIN, AchievementId.WINNER_10],
      [AchievementId.WINNER_10, AchievementId.WINNER_25],
      [AchievementId.UNBEATABLE, AchievementId.LEGENDARY_STREAK],
      [AchievementId.LIGHTNING_FAST, AchievementId.MASTER_OF_TIME],
      [AchievementId.COMEBACK_KING, AchievementId.COMEBACK_PROFI],
      [AchievementId.MUSIC_EXPERT, AchievementId.GRAND_MASTER],
      [AchievementId.COLLECTOR, AchievementId.ARCHIVIST],
      [AchievementId.HOT_STREAK, AchievementId.UNSTOPPABLE],
      [AchievementId.OBJECTION_WON, AchievementId.STAR_LAWYER],
      [AchievementId.PUNKTEJAEGER, AchievementId.HARDCORE_CHAMPION],
      [AchievementId.FULL_SCORE, AchievementId.PERFECT_STREAK],
      [AchievementId.PERFECT_STREAK, AchievementId.FLAWLESS_VICTORY],
      [AchievementId.ZEITMASCHINE, AchievementId.TIME_TRAVELER],
      [AchievementId.TIME_TRAVELER, AchievementId.ALL_OVER],
      [AchievementId.BOT_SLAYER_EASY, AchievementId.BOT_SLAYER_MEDIUM],
      [AchievementId.BOT_SLAYER_MEDIUM, AchievementId.BOT_SLAYER_HARD],
      [AchievementId.DAILY_FIRST, AchievementId.DAILY_REGULAR],
      [AchievementId.DAILY_FIRST, AchievementId.DAILY_PERFECT]
    ]
    for (const [easy, hard] of pairs) expect(pointsFor(hard), `${easy} < ${hard}`).toBeGreaterThan(pointsFor(easy))
  })

  it('the server knows the same maximum', () => {
    const py = readFileSync(join(process.cwd(), '../server/app/api/achievements.py'), 'utf8')
    expect(Number(/^MAX_POINTS = (\d+)$/m.exec(py)![1])).toBe(MAX_POINTS)
    expect(Number(/^MAX_UNLOCKED = (\d+)$/m.exec(py)![1])).toBe(Object.keys(ACHIEVEMENT_POINTS).length)
  })
})

describe('totals', () => {
  it('counts unlocked achievements once', () => {
    expect(totalPoints([a(AchievementId.FIRST_ROUND), a(AchievementId.FIRST_ROUND), a(AchievementId.ARCHIVIST, false)])).toBe(50)
    expect(totalPoints([])).toBe(0)
  })

  it('points since a moment: what this round earned', () => {
    const list = [a(AchievementId.FIRST_ROUND, true, 100), a(AchievementId.FIRST_WIN, true, 300), a(AchievementId.WINNER_25, true, 400)]
    expect(pointsSince(list, 300)).toBe(250)
    expect(pointsSince(list, 500)).toBe(0)
  })

  it('a team earns what its members earned; bots and empty seats are left out', () => {
    const players = [
      { name: 'Rot', members: ['Ana', 'Ben'] },
      { name: 'Cleo' },
      { name: 'Bot', isBot: true },
      { name: 'Dan' }
    ] as unknown as Player[]
    const pts: Record<string, number> = { Ana: 50, Ben: 100, Cleo: 200, Bot: 250, Dan: 0 }
    expect(earnedThisRound(players, (n) => pts[n] ?? 0)).toEqual({ Rot: 150, Cleo: 200 })
  })
})

describe('ranks', () => {
  it('start at zero, climb, and the top needs most of everything', () => {
    expect(RANKS[0].min).toBe(0)
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min)
    expect(RANKS[RANKS.length - 1].min).toBeLessThanOrEqual(MAX_POINTS)
    expect(RANKS[RANKS.length - 1].min).toBeGreaterThan(MAX_POINTS * 0.8)
    for (const r of RANKS) expect(ICON_NAMES).toContain(r.icon)
  })

  it('places a total on its rank and measures the way to the next', () => {
    expect(rankFor(0)).toMatchObject({ rank: { id: 'demo' }, next: { id: 'single' }, toNext: 250, progress: 0 })
    expect(rankFor(249).rank.id).toBe('demo')
    expect(rankFor(250).rank.id).toBe('single')
    expect(rankFor(500)).toMatchObject({ rank: { id: 'single' }, toNext: 250, progress: 0.5 })
    expect(rankFor(MAX_POINTS)).toMatchObject({ rank: { id: 'legend' }, next: null, toNext: 0, progress: 1 })
    expect(rankFor(-50).rank.id).toBe('demo')
  })

  it('every rank has a name in both languages', () => {
    for (const lang of ['de', 'en'] as const) {
      const t = achievementText[lang] as unknown as Record<string, unknown>
      for (const r of RANKS) expect(t[`rank_${r.id}`], `${lang} ${r.id}`).toBeTruthy()
    }
  })
})

describe('leaderboard', () => {
  it('sorts by points, then achievements; a full tie shares a place', () => {
    const board = rankBoard([
      { key: 'a', name: 'Ana', points: 300, unlocked: 4 },
      { key: 'b', name: 'Ben', points: 500, unlocked: 5 },
      { key: 'c', name: 'Cleo', points: 300, unlocked: 3 },
      { key: 'd', name: 'Dan', points: 300, unlocked: 4 }
    ])
    expect(board.map((e) => [e.name, e.place])).toEqual([
      ['Ben', 1],
      ['Ana', 2],
      ['Dan', 2],
      ['Cleo', 4]
    ])
  })
})

describe('rank card', () => {
  it('names the rank, the points and the way to the next rank', () => {
    setCurrentLang('de')
    render(
      <LanguageProvider initial="de">
        <MotionTestProvider>
          <RankCard points={400} />
        </MotionTestProvider>
      </LanguageProvider>
    )
    expect(screen.getByText('Single')).toBeTruthy()
    expect(screen.getAllByText('Noch 350 EP bis Album').length).toBeGreaterThan(0)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('30')
  })
})

describe('achievements page', () => {
  it('shows the people first, then the picked person: count, rank, achievements', () => {
    const page = readFileSync(join(process.cwd(), 'src/screens/AchievementsScreen.tsx'), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    const at = (needle: string) => {
      const i = page.indexOf(needle)
      expect(i, needle).toBeGreaterThan(-1)
      return i
    }
    expect(at('<PointsBoard')).toBeLessThan(at('t.ofPerson(who)'))
    expect(at('t.ofPerson(who)')).toBeLessThan(at('t.countOf(unlocked'))
    expect(at('t.countOf(unlocked')).toBeLessThan(at('<RankCard'))
    expect(at('<RankCard')).toBeLessThan(at('sorted.map('))
  })
})

describe('points in the game', () => {
  const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')
  it('the unlock card says what the achievement is worth', () => {
    expect(src('src/components/AchievementUnlockAnimation.tsx')).toContain('t.plusPoints(pointsFor(currentNotification.achievement.id))')
  })
  it('the round end shows what each seat earned this round', () => {
    expect(src('src/screens/GameScreen.tsx')).toMatch(/earned=\{earnedThisRound\(shownResult\.players, \(name\) => pointsSince\(getPlayerAchievements\(name\), startedAt\)\)\}/)
    expect(src('src/components/game/GameOver.tsx')).toContain('at.plusPoints(earned[p.name])')
  })
  it('the device reports the account holder’s total, from the app shell', () => {
    expect(src('src/shell/AppShell.tsx').match(/<AchievementScoreSync \/>/g)?.length).toBe(2)
    expect(src('src/components/AchievementScoreSync.tsx')).toContain("api('/api/achievements/score', { method: 'PUT', json: { points, unlocked } })")
  })
})
