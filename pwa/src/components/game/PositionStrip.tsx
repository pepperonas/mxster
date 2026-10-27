/**
 * Where a card sits, at a glance: a three-part mini timeline in the poster
 * type of the home screen — the year before, the slot, the year after
 * ("früher"/"später" at the ends). Shown in the dock while a card waits in a
 * gap, so "zwischen 1984 und 2013" reads as a picture, not a sentence.
 * The slot pops on every gap change (spatial spring); years respect "Jahre
 * verdecken". The sentence stays as the accessible name.
 */
import { m } from 'motion/react'
import type { Song } from '@/types'
import { useSettings } from '@/contexts'
import { gapLabel } from '@/game/placement'
import { spring } from '@/motion/springs'
import { prefersReducedMotion } from '@/motion/policy'
import { useMessages } from '@/i18n'
import { gameText } from '@/i18n/messages/game'

type Tone = 'primary' | 'tertiary'

const SLOT: Record<Tone, string> = {
  primary: 'bg-md-primary text-md-on-primary',
  tertiary: 'bg-md-tertiary text-md-on-tertiary'
}
const LINE: Record<Tone, string> = {
  primary: 'bg-md-primary/50',
  tertiary: 'bg-md-tertiary/50'
}

export function PositionStrip({ timeline, gap, tone = 'primary' }: { timeline: Song[]; gap: number; tone?: Tone }) {
  const t = useMessages(gameText)
  const { settings } = useSettings()
  const blur = settings.hideYearsInTimeline
  const label = gapLabel(timeline, gap)
  const before = gap > 0 ? timeline[gap - 1] : null
  const after = gap < timeline.length ? timeline[gap] : null
  const still = prefersReducedMotion()

  if (timeline.length === 0) {
    return (
      <p className="text-poster text-md-on-surface" style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}>
        {t.firstCard}
      </p>
    )
  }

  const end = (song: Song | null, word: string) =>
    song ? (
      <span
        className={`text-poster tabular-nums text-md-on-surface ${blur ? 'blur-[6px] select-none' : ''}`}
        style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
        aria-hidden
      >
        {song.year}
      </span>
    ) : (
      <span className="text-label-lg text-md-on-surface-variant" aria-hidden>
        {word}
      </span>
    )

  return (
    <div className="flex items-center gap-2 min-w-0" role="img" aria-label={label}>
      <span className="shrink-0 min-w-[3.5rem] text-right">{end(before, t.earlier)}</span>
      <span className={`h-[3px] flex-1 min-w-[1rem] max-w-[3rem] rounded-full ${LINE[tone]}`} aria-hidden />
      <m.span
        key={gap}
        initial={still ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.spatialFast}
        className={`shrink-0 grid place-items-center w-12 h-12 rounded-m3-lg text-poster ${SLOT[tone]}`}
        style={{ fontSize: '1.75rem' }}
        aria-hidden
      >
        ?
      </m.span>
      <span className={`h-[3px] flex-1 min-w-[1rem] max-w-[3rem] rounded-full ${LINE[tone]}`} aria-hidden />
      <span className="shrink-0 min-w-[3.5rem]">{end(after, t.later)}</span>
    </div>
  )
}
