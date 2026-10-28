/**
 * Erfolge — per player name (achievements belong to whoever played). On top
 * the shown person's rank and achievement points, then the leaderboard
 * (everyone on this account plus friends; tapping someone on this account
 * shows their achievements), then the achievements with what each is worth.
 */
import { Icon } from '@/components/ui/Icon'
import { achievementDescription, achievementIcon, achievementName } from '@/types/achievements'
import { useMessages } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'
import { useEffect, useMemo, useState } from 'react'
import { isNew, lastSeen, markSeen } from '@/game/achievementSeen'
import { m } from 'motion/react'
import { useMe } from '@/auth/AuthContext'
import { useAchievements, useSettings } from '@/contexts'
import { useSearchParams } from 'react-router-dom'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ownPlayerName } from '@/game/owner'
import { spring } from '@/motion/springs'
import { formatDay } from '@/utils/format'
import { ACHIEVEMENT_DEFINITIONS, type Achievement } from '@/types/achievements'
import { pointsFor, totalPoints, type BoardEntry } from '@/game/achievementPoints'
import { RankCard } from '@/components/achievements/RankCard'
import { PointsBoard } from '@/components/achievements/PointsBoard'
import { api } from '@/api/client'

interface FriendScore {
  id: number
  name: string
  picture: string
  points: number
  unlocked: number
  me: boolean
}

/** Friends' totals from the server (empty while loading or offline). */
function useFriendScores(): FriendScore[] {
  const [rows, setRows] = useState<FriendScore[]>([])
  useEffect(() => {
    let alive = true
    api<{ board: FriendScore[] }>('/api/achievements/board')
      .then((b) => alive && setRows(b.board.filter((r) => !r.me)))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return rows
}

export function AchievementsScreen() {
  const me = useMe()
  const own = ownPlayerName(me.name)
  const t = useMessages(achievementText)
  const { getPlayerAchievements, getAllPlayerNames } = useAchievements()
  const { settings } = useSettings()
  const [params] = useSearchParams()
  const names = useMemo(() => {
    const all = getAllPlayerNames().filter((n) => !settings.hiddenPlayers.includes(n))
    return [own, ...all.filter((n) => n !== own)]
  }, [getAllPlayerNames, own, settings.hiddenPlayers])
  // Opened from a person in the player management: start with them
  const asked = params.get('player')
  const [who, setWho] = useState(asked && names.includes(asked) ? asked : own)

  // Read once per person when they are shown, then note this visit — the
  // badges stay for the whole visit and are gone the next time
  const seenAt = useMemo(() => lastSeen(who), [who])
  useEffect(() => markSeen(who), [who])

  const stored = getPlayerAchievements(who)
  // Nobody played under this name yet: show every achievement as still open.
  const list: Achievement[] = stored.length
    ? stored
    : Object.values(ACHIEVEMENT_DEFINITIONS).map((d) => ({ ...d, unlocked: false, progress: d.target ? 0 : undefined }))
  const unlocked = list.filter((a) => a.unlocked).length
  const points = totalPoints(list)
  const friends = useFriendScores()
  const board: BoardEntry[] = [
    ...names.map((n) => {
      const mine = getPlayerAchievements(n)
      return {
        key: `p-${n}`,
        name: n,
        points: totalPoints(mine),
        unlocked: new Set(mine.filter((x) => x.unlocked).map((x) => x.id)).size,
        picture: n === own ? me.picture : undefined,
        me: n === own
      }
    }),
    ...friends.map((f) => ({ key: `f-${f.id}`, name: f.name, points: f.points, unlocked: f.unlocked, picture: f.picture || undefined, friend: true }))
  ]
  const fresh = list.filter((a) => isNew(a, seenAt)).length
  // Unlocked first (newest first), then by progress
  const sorted = [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    if (a.unlocked) return (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0)
    return (b.progress ?? 0) / (b.target ?? 1) - (a.progress ?? 0) / (a.target ?? 1)
  })

  return (
    <div className="pt-4 md:pt-10">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h1 className="text-headline-md">{t.title}</h1>
        <p className="meta tabular">
          {t.countOf(unlocked, list.length)}
          {fresh > 0 && <span className="ml-2 text-md-primary font-medium">· {t.newCount(fresh)}</span>}
        </p>
      </div>

      <div className="space-y-6 mb-6">
        <RankCard points={points} />
        {board.length > 1 && <PointsBoard entries={board} selected={who} onSelect={setWho} hasFriends={friends.length > 0} />}
      </div>

      {board.length > 1 && <h2 className="text-title-lg mb-3">{t.ofPerson(who)}</h2>}

      <ul className="grid gap-3 sm:grid-cols-2" key={who}>
          {sorted.map((a, i) => (
            <m.li
              key={a.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.spatialDefault, delay: Math.min(i, 10) * 0.025 }}
              className={`flex items-center gap-4 p-4 rounded-m3-lg ${a.unlocked ? 'bg-md-tertiary-container text-md-on-tertiary-container' : 'bg-md-surface-container-low'}`}
            >
              <ProgressRing value={a.progress ?? 0} max={a.target ?? 1} done={a.unlocked} size={52}>
                <span className={a.unlocked ? '' : 'opacity-50'} aria-hidden="true">
                  <Icon name={achievementIcon(a.id)} size={26} />
                </span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-title-md flex items-center gap-2">
                  <span className="min-w-0">{achievementName(a.id)}</span>
                  {isNew(a, seenAt) && (
                    <m.span
                      className="shrink-0 rounded-m3-full bg-md-primary text-md-on-primary px-2 text-label-sm"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ ...spring.spatialFast, delay: 0.35 + Math.min(i, 10) * 0.025 }}
                    >
                      {t.isNew}
                    </m.span>
                  )}
                  <span
                    className={`ml-auto shrink-0 rounded-m3-full px-2 text-label-md tabular ${a.unlocked ? 'bg-md-on-tertiary-container/10' : 'bg-md-surface-container-highest text-md-on-surface-variant'}`}
                  >
                    {a.unlocked ? t.plusPoints(pointsFor(a.id)) : t.worth(pointsFor(a.id))}
                  </span>
                </p>
                <p className={`text-body-sm ${a.unlocked ? 'opacity-90' : 'text-md-on-surface-variant'}`}>{achievementDescription(a.id)}</p>
                <p className={`mt-1 text-label-md tabular ${a.unlocked ? 'opacity-90' : 'text-md-on-surface-variant'}`}>
                  {a.unlocked
                    ? a.unlockedAt
                      ? t.reachedOn(formatDay(a.unlockedAt))
                      : t.reached
                    : a.target
                      ? t.progress(a.progress ?? 0, a.target)
                      : t.open}
                </p>
              </div>
            </m.li>
          ))}
        </ul>
    </div>
  )
}
