/**
 * Every rank with the points it starts at — the content of the dialog behind
 * the info button on the rank card. Ranks already reached carry a tick, the
 * current one is marked.
 */
import { Icon } from '@/components/ui/Icon'
import { MAX_POINTS, RANKS, rankFor } from '@/game/achievementPoints'
import { useMessages } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'

export function RankList({ points }: { points: number }) {
  const t = useMessages(achievementText)
  const tt = t as unknown as Record<string, string>
  const current = rankFor(points).rank.id
  return (
    <div>
      <p className="text-body-md text-md-on-surface-variant mb-4">{t.rankInfoText}</p>
      <ol className="space-y-2">
        {RANKS.map((r) => {
          const reached = points >= r.min
          const isCurrent = r.id === current
          return (
            <li
              key={r.id}
              data-rank={r.id}
              aria-current={isCurrent ? 'true' : undefined}
              className={`flex items-center gap-3 rounded-m3-lg px-3 py-2 ${isCurrent ? 'bg-md-secondary-container text-md-on-secondary-container' : 'bg-md-surface-container-high'}`}
            >
              <span
                className={`grid place-items-center w-10 h-10 shrink-0 rounded-m3-full ${reached ? 'bg-md-tertiary-container text-md-on-tertiary-container' : 'bg-md-surface-container-highest text-md-on-surface-variant'}`}
                aria-hidden="true"
              >
                <Icon name={r.icon} size={22} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-title-md truncate">{tt[`rank_${r.id}`]}</span>
                  {isCurrent && <span className="shrink-0 rounded-m3-full bg-md-primary text-md-on-primary px-2 text-label-sm">{t.currentRank}</span>}
                </span>
                <span className={`block text-body-sm num-poster ${isCurrent ? '' : 'text-md-on-surface-variant'}`}>{t.fromPoints(r.min)}</span>
              </span>
              {reached && <Icon name="check" size={20} className="shrink-0" />}
            </li>
          )
        })}
      </ol>
      <p className="mt-4 meta num-poster">{t.shareOfAll(Math.round((points / MAX_POINTS) * 100), MAX_POINTS)}</p>
    </div>
  )
}
