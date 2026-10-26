/**
 * Game — orchestration only. Rules and turn order live in useTurnFlow.
 *
 * Layout: a slim bar (leave, mode), the players, the turntable, then the
 * mode's own part — the guess (hardcore) or the timeline with its placement
 * dock. On wide screens turntable and board sit side by side.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useGame, useUI } from '@/contexts'
import { GuessForm, GameBoards, GuessResult, PlacementDock, FeedbackLayer, ScoreOverview, type DockState } from '@/components/game'
import { Turntable } from '@/components/game/Turntable'
import { PlayerStrip } from '@/components/game/PlayerStrip'
import { GameOver } from '@/components/game/GameOver'
import { Icon } from '@/components/ui/Icon'
import { useTurnFlow, type SkipNotice } from '@/game/useTurnFlow'
import { MODE_COPY } from '@/game/modeCopy'
import { getPreviewPlayer } from '@/services/PreviewPlayerService'
import { spring } from '@/motion/springs'
import type { Player } from '@/types'

/** Set while we leave on purpose, so the "nothing to play" guard stays quiet. */
let leaving = false

export function GameScreen() {
  const navigate = useAppNavigate()
  const { gameMode, players, isGameStarted } = useGame()
  const [round, setRound] = useState(0)

  // Nothing to play (reload, deep link): back to the setup.
  useEffect(() => {
    leaving = false
  }, [])
  useEffect(() => {
    if (leaving) return
    if (!gameMode || players.length === 0 || !isGameStarted) navigate('/neu', { replace: true })
  }, [gameMode, players.length, isGameStarted, navigate])

  // A reload would lose the running game — let the browser ask first.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  if (!gameMode || players.length === 0 || !isGameStarted) return null
  return <GameRound key={round} onRematch={() => setRound((r) => r + 1)} />
}

function GameRound({ onRematch }: { onRematch: () => void }) {
  const navigate = useAppNavigate()
  const { showModal, closeModal } = useUI()
  const { gameMode, players, currentPlayer, currentSong, resetGame, rematch } = useGame()

  const [previewGap, setPreviewGap] = useState<number | null>(null)
  const [hoverGap, setHoverGap] = useState<number | null>(null)
  const [result, setResult] = useState<{ winner: Player; players: Player[] } | null>(null)
  const boardRef = useRef<HTMLOListElement>(null)

  const leaveGame = useCallback(async () => {
    leaving = true
    getPreviewPlayer().stop()
    await closeModal()
    resetGame()
    navigate('/', { replace: true })
  }, [closeModal, resetGame, navigate])

  const showSkipNotice = useCallback(
    (notice: SkipNotice, acknowledge: () => void) => {
      if (notice.kind === 'penalty') {
        showModal(
          'Zu oft übersprungen',
          <div className="space-y-4">
            <p className="text-body-lg">Alle haben diesen Song schon mehrfach übersprungen. Das kostet 3 Punkte.</p>
            <div className="p-4 rounded-m3-lg bg-md-error-container text-md-on-error-container">
              <p className="text-label-md">Neuer Punktestand</p>
              <p className="text-display-sm tabular">{notice.newScore}</p>
            </div>
          </div>,
          [{ text: 'Neuen Song ziehen', variant: 'primary', onClick: acknowledge }],
          { required: true }
        )
      } else {
        showModal(
          'Vorsicht beim Überspringen',
          <p className="text-body-lg">
            Alle haben diesen Song schon übersprungen. Der nächste Skip kostet mit{' '}
            <strong>{Math.round((notice.nextPenaltyProbability ?? 0) * 100)} %</strong> Wahrscheinlichkeit 3 Punkte. Lieber raten!
          </p>,
          [{ text: 'Verstanden', variant: 'primary', onClick: acknowledge }],
          { required: true }
        )
      }
    },
    [showModal]
  )

  const flow = useTurnFlow({
    onGameOver: (winner, finalPlayers) => {
      getPreviewPlayer().stop()
      setResult({ winner, players: finalPlayers })
    },
    onSkipNotice: showSkipNotice
  })
  const { phase, reveal, activePlayer, activeTimeline, isBotThinking } = flow

  useEffect(() => {
    setPreviewGap(null)
    setHoverGap(null)
  }, [currentSong, currentPlayer])

  if (!gameMode || !activePlayer) return null

  const isTimelineMode = gameMode !== 'hardcore'
  const humanTurn = !activePlayer.isBot
  const humanPlacing = isTimelineMode && phase === 'placing' && humanTurn

  const placementReveal = reveal?.kind === 'placement' ? reveal : null
  const dockState: DockState | null = !isTimelineMode
    ? null
    : placementReveal
      ? {
          kind: 'revealed',
          song: placementReveal.song,
          isCorrect: placementReveal.isCorrect,
          isFirstCard: placementReveal.isFirstCard,
          cards: placementReveal.cardsAfter,
          playerName: players[placementReveal.playerIndex]?.name ?? ''
        }
      : phase === 'placing' && currentSong
        ? humanTurn
          ? { kind: 'placing', song: currentSong, previewGap, timeline: activeTimeline }
          : { kind: 'bot', playerName: activePlayer.name }
        : null

  const revealYear = reveal ? reveal.song.year : null
  const revealCorrect = !reveal
    ? null
    : reveal.kind === 'placement'
      ? reveal.isFirstCard ? null : reveal.isCorrect
      : reveal.breakdown.total >= 10
        ? true
        : reveal.breakdown.total === 0
          ? false
          : null

  const confirmLeave = () =>
    showModal('Spiel beenden?', <p className="text-body-lg">Der Spielstand dieser Runde geht verloren.</p>, [
      { text: 'Weiterspielen' },
      { text: 'Beenden', variant: 'danger', closeOnClick: false, onClick: () => void leaveGame() }
    ])

  const drawLabel = activePlayer.isBot ? `Song für ${activePlayer.name} ziehen` : `Song für ${activePlayer.name}`

  return (
    <div className={`min-h-dvh ${dockState ? 'pb-56' : 'pb-12'} ${gameMode === 'hardcore' ? 'hardcore-theme' : ''}`}>
      <header className="sticky top-0 z-30 bg-md-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl h-16 px-2 sm:px-4 flex items-center gap-1">
          <button type="button" className="icon-btn m3-state-layer" onClick={confirmLeave} aria-label="Spiel beenden">
            <Icon name="close" />
          </button>
          <span className="flex items-center gap-2 text-title-md">
            <Icon name={MODE_COPY[gameMode].icon} size={20} className="text-md-primary" />
            {MODE_COPY[gameMode].name}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 space-y-6">
        <PlayerStrip thinking={isBotThinking} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
          <div className="space-y-6 lg:sticky lg:top-20">
            <Turntable
              song={currentSong}
              revealYear={revealYear}
              revealCorrect={revealCorrect}
              onDraw={phase === 'idle' ? () => void flow.drawSong() : undefined}
              drawLabel={drawLabel}
            />

            {gameMode === 'hardcore' && (
              <AnimatePresence mode="wait" initial={false}>
                {reveal?.kind === 'guess' ? (
                  <GuessResult
                    key="result"
                    song={reveal.song}
                    check={reveal.check}
                    breakdown={reveal.breakdown}
                    playerName={players[reveal.playerIndex]?.name ?? ''}
                    onContinue={flow.continueTurn}
                  />
                ) : phase === 'guessing' && humanTurn ? (
                  <m.div
                    key={`form-${currentPlayer}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12, transition: spring.effectsDefault }}
                    transition={spring.spatialDefault}
                  >
                    <GuessForm onSubmit={flow.submitGuess} onSkip={flow.skip} />
                  </m.div>
                ) : null}
              </AnimatePresence>
            )}
          </div>

          <div className="space-y-6">
            {gameMode === 'hardcore' && <ScoreOverview />}
            <GameBoards
              interactive={humanPlacing}
              previewGap={previewGap}
              hoverGap={hoverGap}
              reveal={
                placementReveal
                  ? { song: placementReveal.song, gapIndex: placementReveal.gapIndex, isCorrect: placementReveal.isCorrect }
                  : null
              }
              revealPlayerIndex={placementReveal?.playerIndex ?? null}
              onGapSelect={(gap) => humanPlacing && setPreviewGap(gap)}
              boardRef={boardRef}
            />
          </div>
        </div>
      </main>

      {isTimelineMode && (
        <PlacementDock
          state={dockState}
          boardRef={boardRef}
          onHoverGap={setHoverGap}
          onPreview={setPreviewGap}
          onConfirm={() => {
            if (previewGap === null) return
            flow.placeCard(previewGap)
            setPreviewGap(null)
          }}
          onContinue={flow.continueTurn}
        />
      )}

      <FeedbackLayer reveal={reveal} />

      <AnimatePresence>
        {result && (
          <GameOver
            winner={result.winner}
            players={result.players}
            mode={gameMode}
            onRematch={() => {
              rematch()
              onRematch()
            }}
            onHome={() => void leaveGame()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
