/**
 * Virtual mode song source — "draw a song".
 * The button squashes on press and springs back (spatial-fast); the remaining
 * count ticks down with a spring.
 */
import { m } from 'motion/react'
import { useGame } from '@/contexts'
import { songs } from '@/data/songs'
import { spring } from '@/motion/springs'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

interface VirtualButtonProps {
  onClick: () => void
}

export function VirtualButton({ onClick }: VirtualButtonProps) {
  const { playedSongs } = useGame()
  const available = songs.length - playedSongs.length
  const empty = available <= 0

  return (
    <section className="rounded-m3-xl bg-md-surface-container border border-md-outline-variant/50 p-5 sm:p-6 text-center">
      <m.button
        type="button"
        onClick={onClick}
        disabled={empty}
        whileTap={empty ? undefined : { scale: 0.94, borderRadius: 'var(--m3-shape-lg)' }}
        transition={spring.spatialFast}
        className="btn btn-accent w-full min-h-[72px] text-title-lg rounded-m3-xl"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" />
          <circle cx="15" cy="15" r="1.2" fill="currentColor" />
          <circle cx="15" cy="9" r="1.2" fill="currentColor" />
          <circle cx="9" cy="15" r="1.2" fill="currentColor" />
        </svg>
        Song ziehen
      </m.button>
      <p className="mt-3 text-body-sm text-md-on-surface-variant">
        {empty ? (
          <span className="text-md-error">Alle Songs wurden bereits gespielt</span>
        ) : (
          <>
            Noch <AnimatedNumber value={available} className="text-text-primary" /> von {songs.length} Songs
          </>
        )}
      </p>
    </section>
  )
}
