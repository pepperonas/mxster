/**
 * TimelineBoard — one chronological board for every mode (replaces the two
 * near-identical 10-slot grids).
 *
 * The board is a vertical list, oldest at the top. While the active (human)
 * player is placing, real insertion gaps appear between the cards; each gap is
 * a <button> with a spoken label ("Zwischen 1985 und 1992"), so placing works
 * by drag (PlacementDock), tap and keyboard alike.
 *
 * Motion:
 * - gaps spring in/out and the cards reflow with layout springs;
 * - the card being placed shares layoutId "pending-card" with the dock card,
 *   so it travels from the dock into the gap, and from the gap to its final
 *   slot when revealed;
 * - the year flips in like a split-flap display on reveal; a wrong card
 *   shakes (damped) and stays as a ghost until the turn continues.
 * Gap highlight during a drag uses transform/colour only — the layout must
 * not change while the drag measures it.
 */
import type { Ref } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { Song } from '@/types'
import { gapLabel } from '@/game/placement'
import { spring } from '@/motion/springs'

export const PENDING_CARD_LAYOUT_ID = 'pending-card'

export interface BoardCard {
  song: Song
  /** Global mode: who placed the card. */
  owner?: string
}

export interface BoardReveal {
  song: Song
  gapIndex: number
  isCorrect: boolean
}

interface TimelineBoardProps {
  cards: BoardCard[]
  /** Show insertion gaps (active human player is placing). */
  interactive?: boolean
  pendingSong?: Song | null
  /** Gap where the pending card waits for confirmation. */
  previewGap?: number | null
  /** Gap under the dragged card. */
  hoverGap?: number | null
  reveal?: BoardReveal | null
  onGapSelect?: (gap: number) => void
  hideYears?: boolean
  label: string
  boardRef?: Ref<HTMLOListElement>
}

export function TimelineBoard({
  cards,
  interactive = false,
  pendingSong = null,
  previewGap = null,
  hoverGap = null,
  reveal = null,
  onGapSelect,
  hideYears = false,
  label,
  boardRef
}: TimelineBoardProps) {
  const songs = cards.map((c) => c.song)
  const items: React.ReactNode[] = []

  const renderGap = (gap: number) => {
    if (interactive && pendingSong && previewGap === gap) {
      items.push(
        <BoardRow key={`preview-${gap}`} layoutId={PENDING_CARD_LAYOUT_ID} tone="preview">
          <CardContent song={pendingSong} yearHidden />
        </BoardRow>
      )
      return
    }
    if (reveal && !reveal.isCorrect && reveal.gapIndex === gap) {
      items.push(
        <BoardRow key={`ghost-${reveal.song.id}`} layoutId={PENDING_CARD_LAYOUT_ID} tone="wrong" shake>
          <CardContent song={reveal.song} revealYear />
        </BoardRow>
      )
      return
    }
    if (interactive) {
      items.push(
        <GapButton
          key={`gap-${gap}`}
          gap={gap}
          label={gapLabel(songs, gap)}
          highlighted={hoverGap === gap}
          large={songs.length === 0}
          onSelect={onGapSelect}
        />
      )
    }
  }

  cards.forEach((card, i) => {
    renderGap(i)
    const isRevealed = Boolean(reveal?.isCorrect && reveal.song.id === card.song.id)
    items.push(
      <BoardRow
        key={card.song.id}
        layoutId={isRevealed ? PENDING_CARD_LAYOUT_ID : undefined}
        tone={isRevealed ? 'correct' : 'default'}
      >
        <CardContent song={card.song} owner={card.owner} blurYear={hideYears && !isRevealed} revealYear={isRevealed} />
      </BoardRow>
    )
  })
  renderGap(cards.length)

  return (
    <ol ref={boardRef} aria-label={label} className="flex flex-col gap-2">
      <AnimatePresence initial={false} mode="popLayout">
        {items}
      </AnimatePresence>
      {items.length === 0 && (
        <li className="py-8 text-center text-body-md text-md-on-surface-variant">Noch keine Karten</li>
      )}
    </ol>
  )
}

// ─── rows ──────────────────────────────────────────────────────────────────

type Tone = 'default' | 'preview' | 'correct' | 'wrong'

const TONE_CLASS: Record<Tone, string> = {
  default: 'bg-md-surface-container-high border-transparent',
  preview: 'bg-md-primary-container text-md-on-primary-container border-md-primary shadow-m3-2',
  correct: 'bg-md-surface-container-high border-md-success',
  wrong: 'bg-md-error-container text-md-on-error-container border-md-error'
}

interface BoardRowProps {
  /** popLayout needs a ref on the presence child (React 19: ref is a prop). */
  ref?: Ref<HTMLLIElement>
  children: React.ReactNode
  layoutId?: string
  tone: Tone
  shake?: boolean
}

function BoardRow({ ref, children, layoutId, tone, shake }: BoardRowProps) {
  return (
    <m.li
      ref={ref}
      layout="position"
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={shake ? { opacity: 1, scale: 1, x: [0, -14, 11, -7, 4, 0] } : { opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: spring.effectsDefault }}
      transition={
        shake
          ? { default: spring.spatialDefault, x: { duration: 0.55, ease: [0.36, 0.07, 0.19, 0.97] } }
          : spring.spatialDefault
      }
      className={`relative flex items-center gap-3 min-h-[56px] px-3 py-2 rounded-m3-lg border-2 transition-colors duration-m3-effects-slow ease-m3-effects-slow ${TONE_CLASS[tone]}`}
    >
      {children}
    </m.li>
  )
}

interface CardContentProps {
  song: Song
  owner?: string
  yearHidden?: boolean
  revealYear?: boolean
  blurYear?: boolean
}

function CardContent({ song, owner, yearHidden, revealYear, blurYear }: CardContentProps) {
  return (
    <>
      <span
        className="flex-shrink-0 w-[4.25rem] h-10 grid place-items-center rounded-m3-md bg-md-surface-container-highest text-title-md tabular-nums"
        style={{ perspective: 400 }}
      >
        {yearHidden ? (
          <span aria-label="Jahr verdeckt" className="text-md-on-surface-variant">
            ????
          </span>
        ) : revealYear ? (
          <m.span
            key={song.year}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ ...spring.spatialFast, delay: 0.18 }}
            className="block"
          >
            {song.year}
          </m.span>
        ) : (
          <span className={blurYear ? 'blur-[6px] select-none' : undefined} aria-hidden={blurYear || undefined}>
            {song.year}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-sm truncate">{song.title}</span>
        <span className="block text-body-sm opacity-80 truncate">{song.artist}</span>
      </span>
      {owner && (
        <span
          className="flex-shrink-0 w-8 h-8 grid place-items-center rounded-m3-full bg-md-secondary-container text-md-on-secondary-container text-label-md"
          title={`Platziert von ${owner}`}
        >
          {owner.charAt(0).toUpperCase()}
        </span>
      )}
    </>
  )
}

interface GapButtonProps {
  ref?: Ref<HTMLLIElement>
  gap: number
  label: string
  highlighted: boolean
  large: boolean
  onSelect?: (gap: number) => void
}

function GapButton({ ref, gap, label, highlighted, large, onSelect }: GapButtonProps) {
  return (
    <m.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0, scaleY: 0.4 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.4, transition: spring.effectsDefault }}
      transition={spring.spatialDefault}
      className="origin-center"
    >
      <m.button
        type="button"
        data-gap-index={gap}
        onClick={() => onSelect?.(gap)}
        animate={{ scale: highlighted ? 1.03 : 1 }}
        transition={spring.spatialFast}
        aria-label={`Hier einfügen: ${label}`}
        className={`m3-state-layer w-full flex items-center justify-center gap-2 rounded-m3-md border-2 border-dashed text-label-lg transition-colors duration-m3-effects ease-m3-effects ${
          large ? 'min-h-[88px]' : 'min-h-[44px]'
        } ${
          highlighted
            ? 'border-md-primary bg-md-primary-container text-md-on-primary-container'
            : 'border-md-outline-variant text-md-on-surface-variant'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>{label}</span>
      </m.button>
    </m.li>
  )
}
