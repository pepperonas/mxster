/**
 * Erfolge — per player name (achievements belong to whoever played). The
 * account holder is shown first; other names from past rounds can be picked.
 */
import { Icon } from '@/components/ui/Icon'
import { achievementDescription, achievementIcon, achievementName } from '@/types/achievements'
import { useMessages } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'
import { useMemo, useState } from 'react'
import { m } from 'motion/react'
import { useMe } from '@/auth/AuthContext'
import { useAchievements, useSettings } from '@/contexts'
import { useSearchParams } from 'react-router-dom'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ownPlayerName } from '@/game/owner'
import { spring } from '@/motion/springs'
import { formatDay } from '@/utils/format'
import { ACHIEVEMENT_DEFINITIONS, type Achievement } from '@/types/achievements'

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

  const stored = getPlayerAchievements(who)
  // Nobody played under this name yet: show every achievement as still open.
  const list: Achievement[] = stored.length
    ? stored
    : Object.values(ACHIEVEMENT_DEFINITIONS).map((d) => ({ ...d, unlocked: false, progress: d.target ? 0 : undefined }))
  const unlocked = list.filter((a) => a.unlocked).length
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
        </p>
      </div>

      {names.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-5" role="radiogroup" aria-label={t.players}>
          {names.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={who === n} data-selected={who === n} className="chip m3-state-layer shrink-0" onClick={() => setWho(n)}>
              {n}
            </button>
          ))}
        </div>
      )}

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
                <p className="text-title-md">{achievementName(a.id)}</p>
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
