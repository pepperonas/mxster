/**
 * Game Screen — orchestration only.
 *
 * Rules and turn order live in useTurnFlow (src/game). This screen renders the
 * current phase: song source → music → (hardcore) guess / result, the boards,
 * and (timeline modes) the placement dock at the bottom. Dialogs are kept for
 * real decisions only: skip penalty / danger zone, leaving, game end.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useGame, useUI, useAuth } from '@/contexts'
import {
  PlayerInfo,
  QRScanner,
  VirtualButton,
  GuessForm,
  ScoreOverview,
  MusicPlayer,
  GameBoards,
  GuessResult,
  PlacementDock,
  FeedbackLayer,
  type DockState
} from '@/components/game'
import { GameEndStatsDialog } from '@/components'
import { getMusicPlayer } from '@/services/MusicPlayerService'
import { useTurnFlow, type SkipNotice } from '@/game/useTurnFlow'
import { spring } from '@/motion/springs'
import type { Player } from '@/types'

export function GameScreen() {
  const navigate = useAppNavigate()
  const { accessToken, isLoggedIn } = useAuth()
  const { showModal, closeModal, addToast } = useUI()
  const { gameMode, gameVariant, players, currentPlayer, currentSong, resetGame, setGameMode, setGameVariant } = useGame()

  const [previewGap, setPreviewGap] = useState<number | null>(null)
  const [hoverGap, setHoverGap] = useState<number | null>(null)
  const boardRef = useRef<HTMLOListElement>(null)
  /** Set when we leave on purpose, so the "not initialised" redirect stays quiet. */
  const leaving = useRef(false)

  // ── Guards ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (leaving.current) return
    if (!gameMode || !gameVariant || players.length === 0) {
      navigate('/mode-selection')
      return
    }
    if (localStorage.getItem('audio_mode_preference') === 'spotify' && (!accessToken || !isLoggedIn)) {
      addToast('Bitte melde dich bei Spotify an, um im Premium-Modus zu spielen', 'error')
      navigate('/')
    }
  }, [gameMode, gameVariant, players.length, accessToken, isLoggedIn, navigate, addToast])

  // ── Leaving ──────────────────────────────────────────────────────────────
  const leaveGame = useCallback(
    async (to: '/' | '/player-setup') => {
      leaving.current = true
      try {
        getMusicPlayer().stop()
      } catch (error) {
        console.error('❌ Error stopping music:', error)
      }
      await closeModal()
      if (to === '/') {
        setGameMode(null)
        setGameVariant(null)
      }
      resetGame()
      navigate(to, { replace: true })
    },
    [closeModal, setGameMode, setGameVariant, resetGame, navigate]
  )

  // ── Dialogs for real decisions ───────────────────────────────────────────
  const showGameEnd = useCallback(
    (winner: Player, finalPlayers: Player[]) => {
      showModal(
        '🏆 Spiel beendet!',
        <GameEndStatsDialog
          winner={winner}
          allPlayers={finalPlayers}
          gameMode={gameMode ?? ''}
          onClose={() => void leaveGame('/')}
          onNewRound={() => void leaveGame('/player-setup')}
        />,
        [],
        { required: true }
      )
    },
    [showModal, gameMode, leaveGame]
  )

  const showSkipNotice = useCallback(
    (notice: SkipNotice, acknowledge: () => void) => {
      if (notice.kind === 'penalty') {
        showModal(
          '💀 Zu oft übersprungen!',
          <div className="text-center py-2 space-y-4">
            <p className="text-headline-sm text-md-error">−3 Punkte Strafe</p>
            <p className="text-body-lg">Dieser Song wurde von allen bereits mehrfach übersprungen.</p>
            <div className="p-4 rounded-m3-lg bg-md-error-container text-md-on-error-container">
              <p className="text-label-md">Neuer Punktestand</p>
              <p className="text-display-sm tabular-nums">{notice.newScore}</p>
            </div>
            <p className="text-body-sm">Ein neuer Song wird automatisch gezogen.</p>
          </div>,
          [{ text: 'Neuen Song ziehen', variant: 'primary', onClick: acknowledge }],
          { required: true }
        )
      } else {
        showModal(
          '⚠️ Gefährliche Zone!',
          <div className="text-center py-2 space-y-4">
            <p className="text-title-lg text-md-warning">Alle haben diesen Song schon übersprungen.</p>
            <p className="text-body-lg">
              Der nächste Skip kostet mit{' '}
              <strong className="text-md-warning">{Math.round((notice.nextPenaltyProbability ?? 0) * 100)} %</strong>{' '}
              Wahrscheinlichkeit <strong className="text-md-error">3 Punkte</strong>.
            </p>
            <p className="text-body-sm">Tipp: Lieber raten als überspringen!</p>
          </div>,
          [{ text: 'Verstanden', variant: 'primary', onClick: acknowledge }],
          { required: true }
        )
      }
    },
    [showModal]
  )

  const flow = useTurnFlow({ onGameOver: showGameEnd, onSkipNotice: showSkipNotice })
  const { phase, reveal, activePlayer, activeTimeline, isBotThinking } = flow

  // A new song or a new player starts placement from scratch
  useEffect(() => {
    setPreviewGap(null)
    setHoverGap(null)
  }, [currentSong, currentPlayer])

  if (!gameMode || !gameVariant || players.length === 0 || !activePlayer) return null

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

  const confirmPlacement = () => {
    if (previewGap === null) return
    flow.placeCard(previewGap)
    setPreviewGap(null)
  }

  const confirmLeave = () =>
    showModal('Spiel beenden?', <p className="text-body-lg text-center py-2">Der Spielstand geht verloren.</p>, [
      { text: 'Abbrechen' },
      { text: 'Spiel beenden', variant: 'danger', closeOnClick: false, onClick: () => void leaveGame('/') }
    ])

  return (
    <div className={`min-h-screen pt-24 relative z-10 ${dockState ? 'pb-48' : 'pb-10'} ${gameMode === 'hardcore' ? 'hardcore-theme' : ''}`}>
      <main className="mx-auto max-w-6xl px-4 space-y-6">
        <PlayerInfo isBotExecuting={isBotThinking} />

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left: song source, music, guess */}
          <div className="space-y-6">
            <AnimatePresence initial={false} mode="popLayout">
              {phase === 'idle' && (
                <m.div
                  key="source"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: spring.effectsDefault }}
                  transition={spring.spatialDefault}
                >
                  {gameVariant === 'physical' ? <QRScanner /> : <VirtualButton onClick={() => void flow.drawSong()} />}
                </m.div>
              )}
            </AnimatePresence>

            <MusicPlayer song={currentSong} />

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

          {/* Right: score + boards */}
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

        <div className="text-center pt-2">
          <button type="button" onClick={confirmLeave} className="btn btn-txt mx-auto">
            Spiel beenden
          </button>
        </div>
      </main>

      {isTimelineMode && (
        <PlacementDock
          state={dockState}
          boardRef={boardRef}
          onHoverGap={setHoverGap}
          onPreview={setPreviewGap}
          onConfirm={confirmPlacement}
          onContinue={flow.continueTurn}
        />
      )}

      <FeedbackLayer reveal={reveal} />
    </div>
  )
}
