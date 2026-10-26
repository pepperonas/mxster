/**
 * GameBoards — which timeline boards a mode shows.
 *  - global:   one shared board; every card carries who placed it.
 *  - personal: the active player's board large (interactive while placing),
 *              the others as compact summaries.
 *  - hardcore: every player's board, read-only (cards are placed by the rules).
 * Progress bars animate scaleX (not width) on the spatial spring.
 */
import type { Ref } from 'react'
import { m } from 'motion/react'
import { useGame, useSettings } from '@/contexts'
import type { Player } from '@/types'
import { spring } from '@/motion/springs'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { TimelineBoard, type BoardReveal } from './TimelineBoard'

export const CARDS_TO_WIN = 10

interface GameBoardsProps {
  interactive: boolean
  previewGap: number | null
  hoverGap: number | null
  reveal: BoardReveal | null
  revealPlayerIndex: number | null
  onGapSelect: (gap: number) => void
  boardRef: Ref<HTMLOListElement>
}

export function GameBoards({ interactive, previewGap, hoverGap, reveal, revealPlayerIndex, onGapSelect, boardRef }: GameBoardsProps) {
  const { players, currentPlayer, gameMode, globalTimeline, currentSong } = useGame()
  const { settings } = useSettings()
  const hideYears = Boolean(settings.hideYearsInTimeline)

  if (gameMode === 'timeline_global') {
    const total = players.reduce((sum, p) => sum + p.cards, 0)
    return (
      <BoardCard title="Globale Zeitleiste" cards={total}>
        <ul className="flex flex-wrap gap-2 mb-4" aria-label="Karten je Spieler">
          {players.map((p, i) => (
            <li
              key={p.name}
              className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-m3-full text-label-md ${
                i === currentPlayer ? 'bg-md-primary-container text-md-on-primary-container' : 'bg-md-surface-container-high text-md-on-surface-variant'
              }`}
            >
              <span className="w-6 h-6 grid place-items-center rounded-m3-full bg-md-secondary-container text-md-on-secondary-container">
                {p.name.charAt(0).toUpperCase()}
              </span>
              {p.name} · <AnimatedNumber value={p.cards} />
            </li>
          ))}
        </ul>
        <TimelineBoard
          label="Globale Zeitleiste"
          boardRef={boardRef}
          cards={globalTimeline.map((c) => ({ song: c.song, owner: players[c.playerId]?.name }))}
          interactive={interactive}
          pendingSong={currentSong}
          previewGap={previewGap}
          hoverGap={hoverGap}
          reveal={reveal}
          onGapSelect={onGapSelect}
          hideYears={hideYears}
        />
      </BoardCard>
    )
  }

  // Personal + hardcore: the active player's board first and large
  const focusIndex = revealPlayerIndex ?? currentPlayer
  const focus = players[focusIndex]
  const others = players.map((p, i) => ({ p, i })).filter(({ i }) => i !== focusIndex)
  if (!focus) return null

  return (
    <div className="space-y-4">
      <BoardCard title={`Zeitleiste von ${focus.name}`} cards={focus.cards}>
        <TimelineBoard
          label={`Zeitleiste von ${focus.name}`}
          boardRef={boardRef}
          cards={focus.timeline.map((song) => ({ song }))}
          interactive={gameMode !== 'hardcore' && interactive}
          pendingSong={currentSong}
          previewGap={previewGap}
          hoverGap={hoverGap}
          reveal={reveal}
          onGapSelect={onGapSelect}
          hideYears={hideYears}
        />
      </BoardCard>
      {others.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Weitere Spieler">
          {others.map(({ p }) => (
            <PlayerSummary key={p.name} player={p} hideYears={hideYears} />
          ))}
        </ul>
      )}
    </div>
  )
}

function BoardCard({ title, cards, children }: { title: string; cards: number; children: React.ReactNode }) {
  return (
    <section className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-title-lg text-md-on-surface truncate">{title}</h3>
        <span className="flex-shrink-0 text-label-lg px-3 py-1 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container tabular-nums">
          <AnimatedNumber value={cards} />/{CARDS_TO_WIN}
        </span>
      </div>
      <ProgressBar value={cards / CARDS_TO_WIN} />
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-m3-full bg-md-surface-container-highest overflow-hidden" role="presentation">
      <m.div
        className="h-full rounded-m3-full bg-md-primary origin-left"
        initial={false}
        animate={{ scaleX: Math.max(0, Math.min(1, value)) }}
        transition={spring.spatialDefault}
      />
    </div>
  )
}

function PlayerSummary({ player, hideYears }: { player: Player; hideYears: boolean }) {
  return (
    <m.li layout transition={spring.spatialDefault} className="rounded-m3-lg bg-md-surface-container-low p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-title-sm text-md-on-surface truncate">{player.name}</p>
        <span className="text-label-md text-md-on-surface-variant tabular-nums">
          <AnimatedNumber value={player.cards} />/{CARDS_TO_WIN}
        </span>
      </div>
      <ProgressBar value={player.cards / CARDS_TO_WIN} />
      {player.timeline.length > 0 && (
        <ol className="flex flex-wrap gap-1 mt-2" aria-label={`Jahre von ${player.name}`}>
          {player.timeline.map((song) => (
            <m.li
              key={song.id}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.spatialFast}
              className={`px-2 py-0.5 rounded-m3-sm bg-md-surface-container-highest text-label-sm tabular-nums ${hideYears ? 'blur-[4px] select-none' : ''}`}
            >
              {song.year}
            </m.li>
          ))}
        </ol>
      )}
    </m.li>
  )
}
