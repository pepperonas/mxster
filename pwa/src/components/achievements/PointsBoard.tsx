/**
 * Leaderboard by achievement points: everyone on this account (from the
 * account's achievements) and the account holder's friends (their own totals
 * from the server). Tapping someone on this account shows their achievements.
 */
import { m } from 'motion/react'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { rankBoard, rankFor, type BoardEntry } from '@/game/achievementPoints'
import { spring } from '@/motion/springs'
import { useMessages } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'

export function PointsBoard({
  entries,
  selected,
  onSelect,
  hasFriends
}: {
  entries: BoardEntry[]
  selected: string
  onSelect: (name: string) => void
  hasFriends: boolean
}) {
  const t = useMessages(achievementText)
  const tt = t as unknown as Record<string, string>
  const ranked = rankBoard(entries)
  const top = ranked[0]?.points ?? 0
  return (
    <section aria-labelledby="points-board">
      <h2 id="points-board" className="text-title-lg">{t.board}</h2>
      <p className="meta mt-1 mb-3">{t.boardText}</p>
      <ol className="space-y-2">
        {ranked.map((e, i) => {
          const rank = rankFor(e.points).rank
          const local = !e.friend
          const active = local && e.name === selected
          const body = (
            <>
              <span className={`w-6 shrink-0 text-title-md num-poster ${e.place === 1 ? 'text-md-primary' : 'text-md-on-surface-variant'}`}>{e.place}.</span>
              {/* Below 360 px the name needs the room more than the picture */}
              <span className="hidden min-[360px]:block shrink-0">
                <Avatar name={e.name} picture={e.picture} size={40} />
              </span>
              <span className="flex-1 min-w-0 text-left">
                <span className="flex items-center gap-2">
                  <span className="text-title-md truncate">{e.name}</span>
                  {e.me && <span className="shrink-0 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container px-2 text-label-md">{t.you}</span>}
                  {e.friend && <span className="shrink-0 rounded-m3-full bg-md-surface-container-highest text-md-on-surface-variant px-2 text-label-md">{t.friend}</span>}
                </span>
                <span className="flex items-center gap-1 meta min-w-0">
                  <Icon name={rank.icon} size={14} className="shrink-0" />
                  <span className="truncate">
                    {tt[`rank_${rank.id}`]} · {t.boardRow(e.unlocked)}
                  </span>
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-title-md num-poster">
                  {e.points}
                  <span className="ml-1 text-label-md text-md-on-surface-variant">{t.pointsUnit}</span>
                </span>
                {e.place > 1 && top > e.points && (
                  <span className="block text-label-md tabular text-md-on-surface-variant">
                    <span aria-hidden="true">−{top - e.points}</span>
                    <span className="sr-only">{t.behind(top - e.points)}</span>
                  </span>
                )}
              </span>
            </>
          )
          return (
            <m.li
              key={e.key}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.spatialDefault, delay: Math.min(i, 8) * 0.04 }}
            >
              {local ? (
                <button
                  type="button"
                  className={`row !gap-3 m3-state-layer ${active ? '!bg-md-secondary-container !text-md-on-secondary-container' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onSelect(e.name)}
                >
                  {body}
                </button>
              ) : (
                <div className="row !gap-3">{body}</div>
              )}
            </m.li>
          )
        })}
      </ol>
      {!hasFriends && <p className="meta mt-3">{t.boardFriends}</p>}
    </section>
  )
}
