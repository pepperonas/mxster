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
import { turnName } from '@/game/teams'
import { coverSrc } from '@/utils/cover'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { prefersReducedMotion } from '@/motion/policy'
import { getPreviewPlayer } from '@/services/PreviewPlayerService'
import { spring } from '@/motion/springs'
import type { Player, Song } from '@/types'
import { correctGapIndices, gapLabel } from '@/game/placement'
import { useRoom } from '@/online/RoomContext'
import { useAuth } from '@/auth/AuthContext'
import { useRemoteTurnFlow } from '@/online/useRemoteTurnFlow'
import { useHostBridge } from '@/online/useHostBridge'
import { useHostPresence, usePresenceNotices } from '@/online/usePresence'
import { mayAct } from '@/online/rules'
import { roomApi } from '@/online/roomApi'
import type { Intent } from '@/online/protocol'
import { useMessages } from '@/i18n'
import { gameText } from '@/i18n/messages/game'

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
    if (!gameMode || players.length === 0 || !isGameStarted) navigate('/new', { replace: true })
  }, [gameMode, players.length, isGameStarted, navigate])

  // No reload warning any more: the round is saved on this device and
  // resumes where it stood (contexts/GameContext + game/savedGame).

  if (!gameMode || players.length === 0 || !isGameStarted) return null
  return <GameRound key={round} onRematch={() => setRound((r) => r + 1)} />
}

const noop = () => {}

/**
 * One round on screen. Offline it drives the local flow; in an online room
 * the host's device does the same and shares it (useHostBridge), a player's
 * device mirrors the host and sends intents (useRemoteTurnFlow). Every control
 * asks `can()` whether this device may use it right now.
 */
export function GameRound({ onRematch }: { onRematch: () => void }) {
  const navigate = useAppNavigate()
  const t = useMessages(gameText)
  const { showModal, closeModal, addToast } = useUI()
  const { gameMode, players, currentPlayer, currentSong, resetGame, rematch, tiebreak, goal } = useGame()
  const room = useRoom()
  const online = Boolean(room && room.seat !== null)
  const onlineHost = online && room!.role === 'host'
  const onlinePlayer = online && room!.role === 'player'
  // A guest without any account on this device: offered one when the round ends
  const { state: auth } = useAuth()
  const guestName = onlinePlayer && auth.kind === 'anonymous' ? (room!.members.find((m) => m.seat === room!.seat)?.name ?? '') : undefined

  const [previewGap, setPreviewGap] = useState<number | null>(null)
  const [hoverGap, setHoverGap] = useState<number | null>(null)
  const [result, setResult] = useState<{ winner: Player; players: Player[] } | null>(null)
  const boardRef = useRef<HTMLOListElement>(null)

  const leaveGame = useCallback(async () => {
    leaving = true
    getPreviewPlayer().stop()
    await closeModal()
    // The host ends the room for everyone; a player leaves it (out of this round for good)
    if (onlineHost && room) await roomApi.setStatus(room.code, 'closed').catch(() => {})
    else if (onlinePlayer && room && !room.result) await roomApi.leave(room.code).catch(() => {})
    resetGame()
    navigate('/', { replace: true })
  }, [closeModal, resetGame, navigate, onlineHost, onlinePlayer, room])

  const showSkipNotice = useCallback(
    (notice: SkipNotice, acknowledge: () => void) => {
      if (notice.kind === 'penalty') {
        showModal(
          t.skippedTooOften,
          <div className="space-y-4">
            <p className="text-body-lg">{t.skipPenaltyBody}</p>
            <div className="p-4 rounded-m3-lg bg-md-error-container text-md-on-error-container">
              <p className="text-label-md">{t.newScore}</p>
              <p className="text-display-sm tabular">{notice.newScore}</p>
            </div>
          </div>,
          [{ text: t.drawNewSong, variant: 'primary', onClick: acknowledge }],
          { required: true }
        )
      } else {
        showModal(
          t.skipCarefully,
          <p className="text-body-lg">
            {t.skipWarnBefore}
            <strong>{t.skipWarnPercent(Math.round((notice.nextPenaltyProbability ?? 0) * 100))}</strong>
            {t.skipWarnAfter}
          </p>,
          [{ text: t.understood, variant: 'primary', onClick: acknowledge }],
          { required: true }
        )
      }
    },
    [showModal, t]
  )

  const localFlow = useTurnFlow({
    onGameOver: (winner, finalPlayers) => {
      getPreviewPlayer().stop()
      setResult({ winner, players: finalPlayers })
    },
    // Online the skip is someone else's: no dialog on the host's device
    onSkipNotice: online
      ? (notice, acknowledge) => {
          if (notice.kind === 'penalty') addToast(t.skipPenaltyToast(notice.newScore), 'warning')
          acknowledge()
        }
      : showSkipNotice
  })
  const remoteFlow = useRemoteTurnFlow(room?.sendIntent ?? (noop as (i: Intent) => void))
  const flow = onlinePlayer ? remoteFlow : localFlow
  useHostBridge(localFlow, result ? { ...result, effects: [] } : null)
  useHostPresence(localFlow, onlineHost)
  usePresenceNotices(online)
  // Players see the end of the round when the host's snapshot says so
  const shownResult = onlinePlayer ? (room?.result ?? null) : result
  useEffect(() => {
    if (onlinePlayer && room?.result) getPreviewPlayer().stop()
  }, [onlinePlayer, room?.result])

  const { phase, reveal, pending, activePlayer, activeTimeline, isBotThinking } = flow
  /** May this device do that now? Always yes on a single device. */
  const can = (action: Intent['action']) =>
    !online || mayAct({ phase, players, currentPlayer, pending, reveal }, room!.seat!, action, onlineHost)
  // Players' devices: the host (who runs the round) lost the connection
  const hostMember = room?.members.find((m) => m.host)
  const hostAway = onlinePlayer && room?.connection === 'open' && Boolean(hostMember) && !hostMember!.online && !shownResult
  const isMine = (index: number) => !online || players[index]?.seat === room!.seat
  const choosing = phase === 'challenge' && pending?.choosing != null ? pending.choosing : null

  // Phones: while a song is on the platter the player shrinks into a sticky
  // bar, so the board (where the action is) gets the screen.
  const narrow = useMediaQuery('(max-width: 1023px)')
  const compactPlayer = narrow && Boolean(currentSong)
  const playerBarRef = useRef<HTMLDivElement>(null)

  // When it is time to place (or to object), bring the board into view just
  // below the sticky bar — no hunting for the timeline under the record.
  const placingKey = (phase === 'placing' || choosing !== null) && narrow ? `${currentSong?.id}-${currentPlayer}-${choosing}` : null
  useEffect(() => {
    if (!placingKey) return
    const id = requestAnimationFrame(() => {
      const board = boardRef.current?.closest('section') ?? boardRef.current
      const bar = playerBarRef.current
      if (!board) return
      // Where the bar sits once it sticks: under the 64 px header
      const stickyBottom = 64 + (bar ? bar.getBoundingClientRect().height : 0)
      const top = board.getBoundingClientRect().top + window.scrollY - stickyBottom - 12
      if (Math.abs(top - window.scrollY) < 24) return
      window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [placingKey])

  useEffect(() => {
    setPreviewGap(null)
    setHoverGap(null)
  }, [currentSong, currentPlayer, choosing])

  if (!gameMode || !activePlayer) return null

  const isTimelineMode = gameMode !== 'hardcore'
  const humanTurn = !activePlayer.isBot
  const humanPlacing = isTimelineMode && phase === 'placing' && humanTurn && can('place')
  const challengeChoosing = choosing !== null && can('claim')
  const who = turnName(activePlayer)
  const nameAt = (index: number | null | undefined) => (index == null ? '' : (players[index]?.name ?? ''))

  const placementReveal = reveal?.kind === 'placement' ? reveal : null
  const challenge = placementReveal?.challenge ?? null
  // A wrong card leaves the placer's timeline unchanged, so the gaps still match
  const rightPlaceFor = (correct: boolean, song: Song) => {
    if (correct) return undefined
    const gap = correctGapIndices(activeTimeline, song)[0]
    return gap === undefined ? undefined : gapLabel(activeTimeline, gap)
  }
  const dockState: DockState | null = !isTimelineMode
    ? null
    : placementReveal
      ? {
          kind: 'revealed',
          song: placementReveal.song,
          isCorrect: placementReveal.isCorrect,
          isFirstCard: placementReveal.isFirstCard,
          cards: placementReveal.cardsAfter,
          playerName: players[placementReveal.playerIndex]?.name ?? '',
          challenge: challenge ? { name: players[challenge.playerIndex]?.name ?? '', won: challenge.won } : null,
          rightPlace: rightPlaceFor(placementReveal.isCorrect, placementReveal.song),
          continueBy: can('continue') ? undefined : nameAt(placementReveal.playerIndex)
        }
      : phase === 'challenge' && pending
        ? choosing !== null
          ? challengeChoosing
            ? { kind: 'challenge-choose', challengerName: nameAt(choosing), previewGap, timeline: activeTimeline }
            : { kind: 'waiting', text: t.objectingWaiting(nameAt(choosing)) }
          : {
              kind: 'challenge-offer',
              placerName: turnName(players[pending.playerIndex] ?? activePlayer),
              // Online every device offers only its own objection
              challengers: pending.challengers
                .filter((seat) => isMine(seat))
                .map((seat) => ({
                  seat,
                  name: players[seat]?.name ?? '',
                  left: players[seat]?.challenges ?? 0
                })),
              timeline: activeTimeline,
              gap: pending.gapIndex,
              revealBy: can('reveal') ? undefined : turnName(players[pending.playerIndex] ?? activePlayer),
              online,
              ownCard: online && isMine(pending.playerIndex)
            }
        : phase === 'placing' && currentSong
          ? !humanTurn
            ? { kind: 'bot', playerName: activePlayer.name }
            : humanPlacing
              ? { kind: 'placing', song: currentSong, previewGap, timeline: activeTimeline }
              : { kind: 'waiting', text: t.placingOwnDevice(who) }
          : null

  // Shared timeline: a won objection puts the card on the board — show it there
  const boardReveal = placementReveal
    ? challenge?.won && gameMode === 'timeline_global'
      ? { song: placementReveal.song, gapIndex: challenge.gapIndex, isCorrect: true }
      : { song: placementReveal.song, gapIndex: placementReveal.gapIndex, isCorrect: placementReveal.isCorrect }
    : null

  const revealYear = reveal ? reveal.song.year : null
  const revealCorrect = !reveal
    ? null
    : reveal.kind === 'placement'
      ? reveal.isFirstCard
        ? null
        : reveal.isCorrect || Boolean(reveal.challenge?.won)
      : reveal.breakdown.total >= 10
        ? true
        : reveal.breakdown.total === 0
          ? false
          : null

  const confirmLeave = () =>
    onlinePlayer
      ? showModal(t.leaveRoom, <p className="text-body-lg">{t.leaveRoomBody}</p>, [
          { text: t.stay },
          { text: t.leave, variant: 'danger', closeOnClick: false, onClick: () => void leaveGame() }
        ])
      : showModal(
          onlineHost ? t.endForAll : t.endGame,
          <p className="text-body-lg">{onlineHost ? t.endForAllBody : t.endGameBody}</p>,
          [
            { text: t.keepPlaying },
            { text: t.end, variant: 'danger', closeOnClick: false, onClick: () => void leaveGame() }
          ]
        )

  const drawLabel = activePlayer.isBot
    ? t.drawFor(who)
    : activePlayer.members
      ? t.drawForMember(who, activePlayer.name)
      : t.songFor(who)

  return (
    <div className={`min-h-dvh ${dockState ? 'pb-56' : 'pb-12'} ${gameMode === 'hardcore' ? 'hardcore-theme' : ''}`}>
      <header className="sticky top-0 z-30 bg-md-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl h-16 px-2 sm:px-4 flex items-center gap-1">
          <button type="button" className="icon-btn m3-state-layer" onClick={confirmLeave} aria-label={t.endGameLabel}>
            <Icon name="close" />
          </button>
          <span className="flex items-center gap-2 text-title-md">
            <Icon name={MODE_COPY[gameMode].icon} size={20} className="text-md-primary" />
            {MODE_COPY[gameMode].name}
          </span>
          {tiebreak && (
            <span className="chip ml-auto bg-md-tertiary-container text-md-on-tertiary-container" role="status">
              {tiebreak.round > 1 ? t.tiebreakRound(tiebreak.round) : t.tiebreak}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 space-y-6">
        <PlayerStrip thinking={isBotThinking} />
        {hostAway && (
          <p role="status" className="flex items-center gap-2 rounded-m3-lg bg-md-error-container text-md-on-error-container px-4 py-3 text-body-md">
            <Icon name="hourglass" size={18} />
            {t.hostAway}
          </p>
        )}

        <div className="grid gap-5 lg:gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
          {/* On phones this column dissolves (contents), so the player bar can stick across the board */}
          <div className="min-w-0 max-lg:contents lg:space-y-6 lg:sticky lg:top-20">
            <div ref={playerBarRef} data-player-bar className={compactPlayer ? 'sticky top-16 z-20' : ''}>
            <Turntable
              compact={compactPlayer}
              caption={activePlayer.isBot || (online && !isMine(currentPlayer)) ? t.theirTurn(who) : t.yourTurn(who)}
              song={currentSong}
              revealYear={revealYear}
              revealCorrect={revealCorrect}
              revealCover={reveal ? coverSrc(reveal.song) : null}
              onDraw={phase === 'idle' && can('draw') ? () => void flow.drawSong() : undefined}
              drawLabel={drawLabel}
              audioRole={!online ? 'local' : onlineHost ? 'host' : room!.info?.music === 'everyone' ? 'follow' : 'silent'}
              cue={room?.cue ?? null}
              clockOffset={room?.clockOffset}
              onCue={onlineHost ? room!.sendAudio : undefined}
            />
            {online && phase === 'idle' && !can('draw') && (
              <p className="text-center text-body-md text-md-on-surface-variant" role="status">
                {t.drawsNext(who)}
              </p>
            )}
            </div>

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
                    continueBy={can('continue') ? undefined : nameAt(reveal.playerIndex)}
                  />
                ) : phase === 'guessing' && online && !can('guess') ? (
                  <p key="waiting" className="surface p-5 text-center text-body-lg text-md-on-surface-variant" role="status">
                    {t.guessesOwnDevice(who)}
                  </p>
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

          <div className="min-w-0 space-y-6">
            {gameMode === 'hardcore' && <ScoreOverview />}
            <GameBoards
              interactive={humanPlacing || challengeChoosing}
              previewGap={previewGap}
              hoverGap={hoverGap}
              reveal={boardReveal}
              revealPlayerIndex={placementReveal?.playerIndex ?? null}
              onGapSelect={(gap) => (humanPlacing || challengeChoosing) && setPreviewGap(gap)}
              onHoverGap={setHoverGap}
              boardRef={boardRef}
              placedGap={phase === 'challenge' ? (pending?.gapIndex ?? null) : null}
              placedBy={pending ? turnName(players[pending.playerIndex] ?? activePlayer) : undefined}
              previewIsChallenge={challengeChoosing}
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
            if (challengeChoosing) flow.claimGap(previewGap)
            else flow.placeCard(previewGap)
            setPreviewGap(null)
          }}
          onContinue={flow.continueTurn}
          onChallenge={flow.startChallenge}
          onCancelChallenge={flow.cancelChallenge}
          onReveal={flow.revealPlacement}
          goal={goal}
        />
      )}

      <FeedbackLayer reveal={reveal} />

      <AnimatePresence>
        {shownResult && (
          <GameOver
            winner={shownResult.winner}
            players={shownResult.players}
            mode={gameMode}
            onRematch={
              onlinePlayer
                ? undefined
                : () => {
                    rematch()
                    onRematch()
                  }
            }
            rematchBy={onlinePlayer ? (room?.members.find((m) => m.host)?.name ?? t.theHost) : undefined}
            onHome={() => void leaveGame()}
            homeLabel={onlineHost ? t.closeRoom : onlinePlayer ? t.leaveRoomButton : undefined}
            signUpName={guestName}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
