/**
 * A person's standing: rank (named like a record's certification), the
 * achievement points, and how far it is to the next rank.
 */
import { m } from 'motion/react'
import { Icon } from '@/components/ui/Icon'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { MAX_POINTS, rankFor } from '@/game/achievementPoints'
import { spring } from '@/motion/springs'
import { useMessages } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'

export function RankCard({ points }: { points: number }) {
  const t = useMessages(achievementText)
  const tt = t as unknown as Record<string, string>
  const { rank, next, toNext, progress } = rankFor(points)
  const rankName = (id: string) => tt[`rank_${id}`]
  const share = Math.round((points / MAX_POINTS) * 100)
  return (
    <section className="surface p-5" aria-label={t.pointsName} data-rank={rank.id}>
      <div className="flex items-center gap-4">
        <m.span
          key={rank.id}
          className="grid place-items-center w-14 h-14 shrink-0 rounded-m3-full bg-md-tertiary-container text-md-on-tertiary-container"
          initial={{ scale: 0.5, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring.spatialFast}
          aria-hidden="true"
        >
          <Icon name={rank.icon} size={28} />
        </m.span>
        <div className="min-w-0 flex-1">
          <p className="meta">{t.rankLabel}</p>
          <p className="text-title-lg truncate">{rankName(rank.id)}</p>
        </div>
        <p className="text-right">
          <AnimatedNumber value={points} from={0} className="text-headline-sm" />
          <span className="ml-1 text-label-lg text-md-on-surface-variant">{t.pointsUnit}</span>
        </p>
      </div>
      <div
        className="mt-4 h-2 rounded-m3-full bg-md-surface-container-highest overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={next ? t.toNext(toNext, rankName(next.id)) : t.topRank}
      >
        <m.div
          className="h-full rounded-m3-full bg-md-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={spring.spatialSlow}
        />
      </div>
      <p className="mt-2 flex justify-between gap-3 meta">
        <span>{next ? t.toNext(toNext, rankName(next.id)) : t.topRank}</span>
        <span className="tabular shrink-0">{t.shareOfAll(share, MAX_POINTS)}</span>
      </p>
    </section>
  )
}
