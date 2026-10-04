/**
 * Game Screen
 * Main game interface with all game components
 */

import { useState, useEffect, useRef } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useGame, useUI, useAuth, useAchievements } from '@/contexts'
import { useGameHistory } from '@/hooks'
import {
  PlayerInfo,
  QRScanner,
  VirtualButton,
  GuessForm,
  TimelineDisplay,
  TimelinePersonalView,
  ScoreOverview,
  MusicPlayer
} from '@/components/game'
import { GameEndStatsDialog } from '@/components'
import { getMusicPlayer } from '@/services/MusicPlayerService'
import {
  validateGuess,
  placeCardInTimeline,
  checkWinCondition,
  selectRandomSong,
  addToPlayedSongs,
  calculatePoints
} from '@/services'
import { BotPlayer } from '@/services/botPlayer'
import type { BotAction } from '@/services/botStrategies/types'
import { songs } from '@/data/songs'
import type { Player } from '@/types'
import { evaluatePlacement, timelineSongsFor } from '@/game/placement'
import { endOfGameAchievements, realtimeScoreAchievements, type AchievementEffect } from '@/game/achievementRules'
import { evaluateSkip, SKIP_PENALTY_POINTS } from '@/game/skipRules'
import {
  triggerCorrectPlacementAnimation,
  triggerIncorrectPlacementAnimation,
  triggerFirstCardAnimation
} from '@/utils/placementAnimations'
import {
  triggerPerfectGuessAnimation,
  triggerGreatGuessAnimation,
  triggerGoodGuessAnimation,
  triggerPartialGuessAnimation,
  triggerWrongGuessAnimation
} from '@/utils/guessAnimations'

export function GameScreen() {
  const navigate = useAppNavigate()
  const { accessToken, isLoggedIn } = useAuth()

  // Timeline Mode: Track which song we already showed modal for
  const lastSongIdShown = useRef<string | null>(null)

  // Game Duration Tracking (for LIGHTNING_FAST achievement)
  const gameStartTime = useRef<number | null>(null)

  // Game Over flag to prevent duplicate winner modals and history entries
  const [gameOver, setGameOver] = useState(false)

  // Player Rankings History (for COMEBACK_KING achievement)
  // Array of snapshots: [{turn: number, rankings: [playerName, playerName, ...]}, ...]
  const rankingsHistory = useRef<Array<{ turn: number; rankings: string[] }>>([])

  // Bot Execution State
  const [isBotExecuting, setIsBotExecuting] = useState(false)
  const botExecutionRef = useRef(false) // Prevent duplicate executions
  const lastBotSongRef = useRef<string | null>(null) // Track last song bot played

  const {
    gameMode,
    gameVariant,
    players,
    currentPlayer,
    currentSong,
    playedSongs,
    globalTimeline,
    currentSongSkips,
    updatePlayer,
    setCurrentSong,
    addToGlobalTimeline,
    addToPlayedSongs: contextAddToPlayedSongs,
    incrementSkipCount,
    resetSkipCounts,
    nextTurn,
    nextPlayerOnly,
    resetGame,
    setGameMode,
    setGameVariant
  } = useGame()
  const { showModal, closeModal, addToast } = useUI()
  const { unlockAchievement, updateProgress, checkAchievements, getPlayerAchievements } = useAchievements()
  const { saveGame, history } = useGameHistory()

  const applyAchievementEffects = (effects: AchievementEffect[]) => {
    for (const fx of effects) {
      if (fx.type === 'unlock') unlockAchievement(fx.player, fx.id)
      else updateProgress(fx.player, fx.id, fx.value)
    }
  }

  // ============================================================================
  // Redirect if game not properly initialized or not logged in
  // ============================================================================

  useEffect(() => {
    // Check if game is properly initialized
    if (!gameMode || !gameVariant || players.length === 0) {
      console.log('⚠️ Game not properly initialized, redirecting to mode selection')
      navigate('/mode-selection')
      return
    }

    // Check audio mode preference
    const audioModePreference = localStorage.getItem('audio_mode_preference')

    // Only require Spotify login if user selected Spotify mode
    if (audioModePreference === 'spotify' && (!accessToken || !isLoggedIn)) {
      console.log('⚠️ Spotify mode selected but no access token found')
      addToast('Bitte melde dich bei Spotify an, um im Premium-Modus zu spielen', 'error')
      navigate('/')
      return
    }

    // Preview mode needs no authentication
    console.log(`✅ Audio mode: ${audioModePreference || 'preview'} - Starting game`)

    // Start game timer (for LIGHTNING_FAST achievement)
    if (gameStartTime.current === null) {
      gameStartTime.current = Date.now()
      console.log('⏱️ Game timer started')
    }
  }, [gameMode, gameVariant, players.length, accessToken, isLoggedIn, navigate, addToast])

  // ============================================================================
  // Timeline Mode: Show placement modal for all cards
  // ============================================================================

  useEffect(() => {
    console.log('🔷 useEffect triggered - currentSong:', currentSong?.title || 'null', 'gameMode:', gameMode)

    // Only in Timeline Modes (not Guess Mode)
    if (currentSong && gameMode !== 'hardcore') {
      const songId = currentSong.spotifyId || currentSong.id
      console.log('🔷 In Timeline Mode, songId:', songId, 'lastSongIdShown:', lastSongIdShown.current)

      // Only process once per song
      if (lastSongIdShown.current !== songId) {
        console.log('🔷 New song detected - showing placement modal')
        lastSongIdShown.current = songId

        // Always show modal (even for first card)
        showManualPlacementModal()
      } else {
        console.log('🔷 Song already shown, skipping')
      }
    } else {
      console.log('🔷 Not in Timeline Mode or no currentSong, skipping')
    }
  }, [currentSong, gameMode])

  // ============================================================================
  // Bot Turn Detection & Execution
  // ============================================================================

  useEffect(() => {
    const currentPlayerObj = players[currentPlayer]
    const songId = currentSong?.spotifyId || currentSong?.id

    // Only execute bot turns if:
    // 1. Current player is a bot
    // 2. There's a current song to play
    // 3. Game is not over
    // 4. Bot is not already executing
    // 5. In Virtual Mode (bots only available in Virtual Mode)
    // 6. This song hasn't been played by this bot yet (prevent duplicate executions)
    if (!currentPlayerObj?.isBot || !currentSong || gameOver || isBotExecuting || botExecutionRef.current || gameVariant !== 'virtual' || lastBotSongRef.current === songId) {
      return
    }

    console.log('🤖 Bot turn detected:', currentPlayerObj.name, 'Difficulty:', currentPlayerObj.botDifficulty)

    // Mark this song as played by this bot to prevent duplicate executions
    lastBotSongRef.current = songId ?? null

    // Mark as executing to prevent duplicate calls
    botExecutionRef.current = true
    setIsBotExecuting(true)

    // Execute bot turn asynchronously
    const executeBotTurn = async () => {
      try {
        const botPlayer = new BotPlayer(currentPlayerObj)

        // Get current timeline (mode-specific)
        const timeline = gameMode === 'timeline_global'
          ? globalTimeline.map(card => card.song)
          : currentPlayerObj.timeline

        // Execute bot turn with callback
        await botPlayer.executeTurn(
          gameMode!,
          currentSong,
          timeline,
          (action: BotAction) => {
            console.log('🤖 Bot action received:', action.type, action.data)

            if (action.type === 'guess') {
              // Hardcore Mode: Submit guess
              const { title, artist, year } = action.data
              console.log('🤖 Bot guessing:', { title, artist, year })

              // Simulate guess submission (same flow as human player)
              handleGuessSubmit(title, artist, year)
            } else if (action.type === 'place') {
              // Timeline Mode: Place card
              const { position } = action.data
              console.log('🤖 Bot placing card at position:', position)

              // Simulate manual placement (same flow as human player)
              handleManualPlacement(position)
            }
          }
        )
      } catch (error) {
        console.error('❌ Bot execution error:', error)
        addToast('Bot-Fehler aufgetreten', 'error')

        // Skip bot turn on error
        nextTurn()
      } finally {
        // Reset execution flag
        botExecutionRef.current = false
        setIsBotExecuting(false)
      }
    }

    executeBotTurn()
  }, [currentPlayer, currentSong, gameOver, isBotExecuting, gameVariant, gameMode])

  // Reset lastBotSongRef when player changes (allow next bot to execute)
  useEffect(() => {
    lastBotSongRef.current = null
  }, [currentPlayer])

  // Debug logging
  console.log('🔵 GameScreen render - currentPlayer:', currentPlayer, 'currentSong:', currentSong?.title || 'null')

  // Don't render if not initialized
  if (!gameMode || !gameVariant || players.length === 0) {
    return null
  }

  // ============================================================================
  // Virtual Mode: Select Random Song
  // ============================================================================

  const handleVirtualSong = () => {
    console.log('🎲 handleVirtualSong called - drawing random song')
    const song = selectRandomSong(songs, playedSongs)

    if (!song) {
      console.log('🎲 No songs available')
      addToast('Alle Songs wurden bereits gespielt!', 'warning')
      return
    }

    console.log('🎲 Song selected:', song.title)

    // Mark song as played
    const newPlayedSongs = addToPlayedSongs(playedSongs, song)
    contextAddToPlayedSongs(song.spotifyId || song.id)

    // Set current song
    setCurrentSong(song)

    console.log('🎵 Virtual Song Selected:', {
      title: song.title,
      artist: song.artist,
      year: song.year,
      remaining: songs.length - newPlayedSongs.length
    })
  }

  // ============================================================================
  // Guess Validation & Scoring
  // ============================================================================

  const handleGuessSubmit = (title: string, artist: string, year: string) => {
    if (!currentSong) return

    const player = players[currentPlayer]

    // Validate guess
    const result = validateGuess(title, artist, year, currentSong)

    console.log('🎯 Guess Result:', {
      player: player.name,
      titleMatch: result.titleMatch,
      artistMatch: result.artistMatch,
      yearMatch: result.yearMatch,
      correctCount: result.correctCount
    })

    // Show evaluation modal with result
    showEvaluationModal(result, currentSong)
  }

  // ============================================================================
  // Skip Guess (with Progressive Penalty Logic)
  // ============================================================================

  const handleSkip = () => {
    if (!currentSong) return

    const player = players[currentPlayer]

    // Increment skip count for current player
    incrementSkipCount(currentPlayer)

    const skip = evaluateSkip(currentSongSkips, currentPlayer, players.length, gameMode === 'hardcore')
    const penaltyApplied = skip.penaltyApplied
    const newScore = penaltyApplied ? player.score - SKIP_PENALTY_POINTS : player.score

    // If penalty was applied, draw a new song immediately
    if (penaltyApplied) {
      // Update player score
      updatePlayer(currentPlayer, { score: newScore })

      // Show penalty modal
      showModal(
        '💀 Zu oft übersprungen!',
        <div className="text-center py-6">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-2xl font-bold mb-4 text-md-error">-3 Punkte Strafe!</div>
          <p className="text-lg text-text-secondary mb-6">
            Dieser Song wurde von allen Spielern bereits mehrfach übersprungen.
          </p>
          <div className="p-6 bg-red-900/30 border-2 border-red-500/50 rounded-m3-lg mb-6">
            <div className="text-sm text-text-secondary mb-2">Neuer Punktestand</div>
            <div className="text-4xl font-bold">{newScore} Punkte</div>
          </div>
          <div className="p-4 glass border border-accent/30 rounded-m3-md text-sm text-text-secondary">
            <p>🎲 Ein neuer Song wird automatisch gezogen.</p>
          </div>
        </div>,
        [
          {
            text: 'Neuen Song ziehen',
            onClick: () => {
              // Reset skip counts for new song
              resetSkipCounts()

              // Draw new song
              const newSong = selectRandomSong(songs, playedSongs)
              if (newSong) {
                contextAddToPlayedSongs(newSong.spotifyId || newSong.id)
                setCurrentSong(newSong)
              }

              // Next player
              nextTurn()
            }
          }
        ]
      )
    } else {
      // No penalty - next player tries the same song
      console.log('⏭️ Skip confirmed - next player gets the same song')

      // Show warning dialog if all players have skipped at least once
      if (skip.dangerZone) {
        const nextPenaltyProbability = skip.nextPenaltyProbability

        showModal(
          '⚠️ Gefährliche Zone!',
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎲</div>
            <div className="text-xl font-bold mb-4 text-yellow-400">
              Alle Spieler haben diesen Song bereits übersprungen!
            </div>
            <p className="text-lg text-text-secondary mb-6">
              Der nächste Skip hat eine <span className="text-yellow-400 font-bold">{(nextPenaltyProbability * 100).toFixed(0)}% Chance</span> auf eine <span className="text-md-error font-bold">-3 Punkte Strafe</span>!
            </p>
            <div className="p-4 glass border-2 border-yellow-500/50 rounded-m3-md text-sm">
              <p className="text-text-secondary">
                💡 Tipp: Versuche es zu raten, anstatt zu überspringen!
              </p>
            </div>
          </div>,
          [
            {
              text: 'Verstanden',
              onClick: () => {
                // Switch to next player but KEEP the song!
                nextPlayerOnly()
              }
            }
          ]
        )
      } else {
        // No warning needed - just switch player
        nextPlayerOnly()
      }
    }
  }

  // ============================================================================
  // Evaluation Modal (Show checkmarks + points)
  // ============================================================================

  const showEvaluationModal = (
    result: ReturnType<typeof validateGuess>,
    song: typeof currentSong
  ) => {
    if (!song) return

    // Calculate points using new system
    const earnedPoints = calculatePoints(
      result.titleMatch,
      result.artistMatch,
      result.yearDifference
    )

    // Trigger animation based on points (async, non-blocking)
    if (earnedPoints === 15) {
      triggerPerfectGuessAnimation()
    } else if (earnedPoints >= 10) {
      triggerGreatGuessAnimation()
    } else if (earnedPoints >= 5) {
      triggerGoodGuessAnimation()
    } else if (earnedPoints > 0) {
      triggerPartialGuessAnimation(earnedPoints)
    } else {
      triggerWrongGuessAnimation()
    }

    // Modal title based on points
    const title =
      earnedPoints === 15
        ? '🏆 Perfekt! Maximale Punktzahl!'
        : earnedPoints >= 10
          ? '👍 Gut gemacht!'
          : earnedPoints >= 5
            ? '🤷 Teilweise richtig'
            : '❌ Leider alles falsch'

    showModal(
      title,
      <div className="text-center py-4">
        {/* Checkmarks with individual point values */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center gap-3 text-lg">
            <span className="text-2xl">{result.titleMatch ? '✅' : '❌'}</span>
            <span>Titel: "{song.title}"</span>
            {gameMode === 'hardcore' && (
              <span className="text-sm text-secondary font-bold">
                {result.titleMatch ? '+5P' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 text-lg text-text-secondary">
            <span className="text-2xl">{result.artistMatch ? '✅' : '❌'}</span>
            <span>Artist: {song.artist}</span>
            {gameMode === 'hardcore' && (
              <span className="text-sm text-secondary font-bold">
                {result.artistMatch ? '+5P' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">
              {result.yearDifference === 0 ? '✅' : result.yearDifference <= 2 ? '🟡' : '❌'}
            </span>
            <div className="inline-block px-6 py-2 glass border-2 border-accent/30 rounded-m3-md text-xl font-bold">
              {song.year}
            </div>
            {gameMode === 'hardcore' && (
              <span className="text-sm text-secondary font-bold">
                {result.yearDifference === 0
                  ? '+5P'
                  : result.yearDifference === 1
                    ? '+2P'
                    : result.yearDifference === 2
                      ? '+1P'
                      : ''}
              </span>
            )}
          </div>
        </div>

        {/* Year difference (if wrong) */}
        {result.yearDifference > 0 && result.yearDifference <= 2 && (
          <div className="mb-4 p-3 glass border border-accent/30 rounded-m3-md">
            <p className="text-sm text-text-secondary">
              {result.yearDifference} {result.yearDifference === 1 ? 'Jahr' : 'Jahre'} daneben
            </p>
          </div>
        )}

        {/* Points in Hardcore Mode */}
        {gameMode === 'hardcore' && (
          <div className="p-4 bg-gradient-to-r from-secondary/30 to-accent/30 rounded-m3-md border-2 border-accent/50">
            <p className="text-2xl font-bold text-gradient">
              +{earnedPoints} {earnedPoints === 1 ? 'Punkt' : 'Punkte'}
            </p>
          </div>
        )}
      </div>,
      [
        {
          text: gameMode === 'hardcore' ? 'Weiter' : 'Karte platzieren',
          variant: 'primary',
          onClick: () => {
            console.log('🟡 EVALUATION MODAL - BUTTON CLICKED! gameMode:', gameMode)
            console.log('🟡 result from closure:', result)

            // Fix 1: Close evaluation modal first to prevent blocking winner modal
            closeModal()

            // Small delay for clean modal transition
            setTimeout(() => {
              if (gameMode === 'hardcore') {
                console.log('🟡 Calling placeCardAndContinue() with result:', result.correctCount)
                placeCardAndContinue(result)
              } else {
                console.log('🟡 Calling showManualPlacementModal()')
                showManualPlacementModal()
              }
            }, 100)
          }
        }
      ]
    )
  }

  // ============================================================================
  // Guess Mode: Auto-place card in timeline & check win
  // ============================================================================

  const placeCardAndContinue = (guessResult?: ReturnType<typeof validateGuess>) => {
    console.log('🔥 placeCardAndContinue START')
    console.log('🔥 gameMode:', gameMode)
    console.log('🔥 guessResult param:', guessResult)

    if (!currentSong) return

    const player = players[currentPlayer]
    console.log('🔥 Current player:', player.name, 'Current score:', player.score)

    // Calculate points using new system (Hardcore Mode only)
    let earnedPoints = 0
    let guessDetails = undefined
    if (gameMode === 'hardcore' && guessResult) {
      earnedPoints = calculatePoints(
        guessResult.titleMatch,
        guessResult.artistMatch,
        guessResult.yearDifference
      )

      // Store detailed guess results for achievements
      guessDetails = {
        titleCorrect: guessResult.titleMatch,
        artistCorrect: guessResult.artistMatch,
        yearPoints: (guessResult.yearDifference === 0 ? 5 :
                    guessResult.yearDifference === 1 ? 2 :
                    guessResult.yearDifference === 2 ? 1 : 0) as 0 | 1 | 2 | 5
      }

      console.log('🎯 Points calculated:', {
        titleMatch: guessResult.titleMatch,
        artistMatch: guessResult.artistMatch,
        yearDifference: guessResult.yearDifference,
        earnedPoints,
        guessDetails
      })
    }

    // Add card to timeline (chronologically sorted) with points and guess details
    const newTimeline = placeCardInTimeline(player.timeline, currentSong, earnedPoints, guessDetails)

    // Calculate new score (only in Hardcore Mode)
    let newScore = player.score
    if (gameMode === 'hardcore' && guessResult) {
      newScore = player.score + earnedPoints
      console.log('🎯 Updating score:', {
        oldScore: player.score,
        earnedPoints,
        newScore
      })
    } else {
      console.log('❌ Score NOT updated! gameMode:', gameMode, 'guessResult:', guessResult)
    }

    console.log('🔥 Final newScore before update:', newScore)

    // Update player with only changed fields to avoid race conditions
    updatePlayer(currentPlayer, {
      timeline: newTimeline,
      cards: player.cards + 1,
      score: newScore
    })

    // ============================================================================
    // Real-Time Achievement Unlocks (Fix 2)
    // ============================================================================
    if (gameMode === 'hardcore') {
      const playerName = player.name
      const oldScore = player.score

      applyAchievementEffects(realtimeScoreAchievements(playerName, oldScore, newScore))
    }

    // ============================================================================
    // Achievement Tracking (Hardcore Mode only)
    // ============================================================================
    if (gameMode === 'hardcore' && guessResult) {
      const playerName = player.name

      // Track perfect guess (all 3 correct: title + artist + year)
      if (earnedPoints === 15) {
        console.log(`🏆 Perfect guess! Tracking for player: ${playerName}`)
        // This will be used for PERFECT_STREAK achievement
        // TODO: Track consecutive perfect guesses in player stats
      }

      // Track decades for TIME_TRAVELER and DECADE_MASTER achievements
      if (guessResult.titleMatch || guessResult.artistMatch || guessResult.yearDifference <= 2) {
        // Song was correctly identified (at least partially)
        const decade = Math.floor(currentSong.year / 10) * 10
        console.log(`📊 Tracking decade ${decade}s for player: ${playerName}`)
        // TODO: Track unique decades and songs per decade in achievement context
      }

      // Track score milestones
      if (newScore >= 100) {
        // HARDCORE_CHAMPION achievement check will happen at game end
        console.log(`🏆 Player ${playerName} reached ${newScore} points!`)
      }
    }

    // Check win condition (use updated player data)
    const updatedPlayer = {
      ...player,
      timeline: newTimeline,
      cards: player.cards + 1,
      score: newScore
    }
    const updatedPlayers = [...players]
    updatedPlayers[currentPlayer] = updatedPlayer

    // Track rankings for COMEBACK_KING achievement (Hardcore Mode only)
    if (gameMode === 'hardcore') {
      const sortedByScore = [...updatedPlayers].sort((a, b) => b.score - a.score)
      const currentRankings = sortedByScore.map(p => p.name)
      rankingsHistory.current.push({
        turn: updatedPlayer.cards, // Use winner's card count as turn number
        rankings: currentRankings
      })
      console.log(`📊 Rankings after turn ${updatedPlayer.cards}:`, currentRankings)
    }

    const winCheck = checkWinCondition(updatedPlayers, currentPlayer, gameMode)

    if (winCheck.gameOver && winCheck.winner) {
      // Fix 3: Add delay to ensure evaluation modal is fully closed
      setTimeout(() => {
        showWinnerModal(winCheck.winner)
      }, 150)
      return
    }

    // Next turn
    nextTurn()
    addToast('Karte platziert!', 'success')

    // Note: Removed automatic song drawing for Timeline modes
    // All virtual modes now require manual button click ("Zufälliger Song")
  }

  // ============================================================================
  // Timeline Modes: Manual placement modal
  // ============================================================================

  const showManualPlacementModal = () => {
    console.log('🟠 showManualPlacementModal called')

    // Prevent placement if game is already over
    if (gameOver) {
      console.log('⚠️ Game already over, cannot place more cards')
      addToast('Spiel ist bereits beendet!', 'error')
      return
    }

    if (!currentSong) {
      console.log('🟠 No currentSong, returning early')
      return
    }

    console.log('🟠 currentSong:', currentSong.title)
    const player = players[currentPlayer]

    // Get timeline: GlobalTimelineCard[] for global mode, Song[] for personal mode
    const rawTimeline = gameMode === 'timeline_global' ? globalTimeline : player.timeline
    // Extract songs for display (handle both GlobalTimelineCard[] and Song[])
    const timeline = gameMode === 'timeline_global'
      ? rawTimeline.map((card: any) => card.song)
      : rawTimeline

    console.log('🟠 Timeline length:', timeline.length)

    // Two text variations for modal title
    const titleVariations = [
      `📍 Wo gehört dieser Song hin, ${player.name}?`,
      `📍 ${player.name}, wo gehört dieser Song hin?`
    ]
    const modalTitle = titleVariations[Math.floor(Math.random() * titleVariations.length)]

    showModal(
      modalTitle,
      <div className="py-4">
        <div className="mb-6 p-4 glass border-2 border-accent/30 rounded-m3-md">
          <div className="text-xl font-bold">{currentSong.title}</div>
          <div className="text-text-secondary">{currentSong.artist}</div>
          <div className="text-sm text-text-secondary/70 mt-2">Jahr ist verdeckt - wähle die Position!</div>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {timeline.length === 0 ? (
            <button
              onClick={() => {
                console.log('🟠 Position button clicked: 0 (erste Karte)')
                handleManualPlacement(0)
              }}
              className="w-full py-6 px-6 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-m3-md transition-colors"
            >
              <div className="text-base sm:text-lg md:text-xl font-bold">📍 Erste Karte platzieren</div>
            </button>
          ) : (
            <>
              {/* Before first card */}
              <button
                onClick={() => {
                  console.log('🟠 Position button clicked: 0 (vor erstem)')
                  handleManualPlacement(0)
                }}
                className="w-full py-4 px-6 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-m3-md transition-colors"
              >
                <div className="text-base sm:text-lg md:text-xl font-bold">⬆️ Vor {timeline[0].year}</div>
              </button>

              {/* Cards and placement buttons */}
              {timeline.map((song, index) => (
                <div key={song.id}>
                  {/* Existing card */}
                  <div className="py-3 px-4 bg-primary/30 border border-white/10 rounded-m3-md">
                    <div className="font-semibold text-sm sm:text-base">{song.title}</div>
                    <div className="text-xs sm:text-sm text-text-secondary">{song.artist} • {song.year}</div>
                  </div>

                  {/* Placement button after this card */}
                  {index < timeline.length - 1 && (
                    <button
                      onClick={() => {
                        console.log('🟠 Position button clicked:', index + 1, '(zwischen)')
                        handleManualPlacement(index + 1)
                      }}
                      className="w-full py-4 px-6 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-m3-md transition-colors mt-3"
                    >
                      <div className="text-base sm:text-lg md:text-xl font-bold">
                        📍 Zwischen {timeline[index].year} und {timeline[index + 1].year}
                      </div>
                    </button>
                  )}
                </div>
              ))}

              {/* After last card */}
              <button
                onClick={() => {
                  console.log('🟠 Position button clicked:', timeline.length, '(nach letztem)')
                  handleManualPlacement(timeline.length)
                }}
                className="w-full py-4 px-6 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-m3-md transition-colors"
              >
                <div className="text-base sm:text-lg md:text-xl font-bold">⬇️ Nach {timeline[timeline.length - 1].year}</div>
              </button>
            </>
          )}
        </div>
      </div>,
      [], // No default buttons - handled by placement buttons
      { required: true } // Dialog can't be closed - user must select a position
    )
  }

  const handleManualPlacement = (position: number) => {
    console.log('🟡 handleManualPlacement called with position:', position)

    if (!currentSong) {
      console.log('🟡 No currentSong, returning early')
      return
    }

    console.log('🟡 currentSong:', currentSong.title)
    console.log('🟡 gameMode:', gameMode)

    // WICHTIG: Spieler-Index VORHER speichern (wird durch nextTurn() geändert!)
    const playerIndex = currentPlayer
    const player = players[playerIndex]

    const timeline = timelineSongsFor(gameMode, player, globalTimeline)

    console.log('🟡 Current timeline length:', timeline.length)

    const { isCorrect, newTimeline } = evaluatePlacement(timeline, currentSong, position)

    console.log('🟡 Placement is correct:', isCorrect)

    // Store current song info for modal (before state changes)
    const songTitle = currentSong.title
    const songArtist = currentSong.artist
    const songYear = currentSong.year

    // Trigger animation (async, non-blocking)
    if (timeline.length === 0) {
      // First card in Timeline modes - special setup animation
      triggerFirstCardAnimation()
    } else if (isCorrect) {
      triggerCorrectPlacementAnimation()
    } else {
      triggerIncorrectPlacementAnimation()
    }

    if (isCorrect) {
      console.log('🟡 Correct placement - updating player and showing modal')
      // Correct placement!
      if (gameMode === 'timeline_global') {
        // Add to global timeline (will be auto-sorted by reducer)
        addToGlobalTimeline(currentSong, playerIndex)
        // Increment cards for global timeline
        updatePlayer(playerIndex, {
          cards: player.cards + 1
        })
      } else {
        // Update player's personal timeline AND increment cards in ONE update
        updatePlayer(playerIndex, {
          timeline: newTimeline,
          cards: player.cards + 1
        })
      }

      // Get updated player for display
      const updatedPlayer = {
        ...player,
        cards: player.cards + 1,
        timeline: gameMode === 'timeline_global' ? player.timeline : newTimeline
      }

      // Show success feedback, dann Win-Check im Button onClick
      showModal(
        '✅ Richtig platziert!',
        <div className="text-center py-6">
          <div className="text-6xl mb-4">🎉</div>
          <div className="text-2xl font-bold mb-2">{songTitle}</div>
          <div className="text-lg text-text-secondary mb-4">{songArtist}</div>
          <div className="text-3xl font-bold text-secondary mb-2">{songYear}</div>
          <div className="mt-6 p-4 glass border-2 border-accent/30 rounded-m3-md">
            <div className="text-sm text-text-secondary">Fortschritt</div>
            <div className="text-2xl font-bold">{updatedPlayer.cards}/10 Karten</div>
          </div>
        </div>,
        [
          {
            text: 'Nächster Spieler',
            variant: 'primary',
            onClick: () => {
              console.log('🔴 Button clicked - closing modal')
              console.log('🔴 Before - currentPlayer:', currentPlayer, 'currentSong:', currentSong?.title)

              // Create updated players array for win-check
              const updatedPlayers = players.map((p, idx) =>
                idx === playerIndex ? updatedPlayer : p
              )

              // Check win condition with updated data
              const winCheck = checkWinCondition(updatedPlayers, playerIndex, gameMode)

              // Close modal first
              closeModal()

              // Then show winner modal OR next turn
              if (winCheck.gameOver && winCheck.winner) {
                console.log('🏆 Game over! Winner:', winCheck.winner.name)
                // Small delay to ensure modal is fully closed
                const winner = winCheck.winner
                setTimeout(() => {
                  showWinnerModal(winner)
                }, 150)
              } else {
                console.log('🔴 Calling nextTurn()')
                // Small delay to ensure modal is fully closed
                setTimeout(() => {
                  nextTurn()

                  // Virtual mode + Hardcore Mode: Automatically draw new song for next player
                  // Timeline modes: User manually clicks "Zufälligen Song spielen" button
                  if (gameVariant === 'virtual' && gameMode === 'hardcore') {
                    setTimeout(() => {
                      const newSong = selectRandomSong(songs, playedSongs)
                      if (newSong) {
                        contextAddToPlayedSongs(newSong.spotifyId || newSong.id)
                        setCurrentSong(newSong)
                        console.log('🎲 Auto-drew new song for next player (Hardcore):', newSong.title)
                      }
                    }, 200)
                  }
                }, 150)
              }
            }
          }
        ]
      )
    } else {
      // Wrong placement! - Spielerwechsel nach Modal
      showModal(
        '❌ Falsch platziert!',
        <div className="text-center py-6">
          <div className="text-6xl mb-4">😞</div>
          <div className="text-xl font-bold mb-2">Das war leider nicht richtig</div>
          <div className="text-2xl font-bold mb-2">{songTitle}</div>
          <div className="text-lg text-text-secondary mb-4">{songArtist}</div>
          <div className="text-3xl font-bold text-md-error mb-2">{songYear}</div>
          <div className="mt-6 p-4 glass rounded-m3-md border-2 border-red-500/50">
            <div className="text-sm">Die Karte wird nicht hinzugefügt</div>
          </div>
        </div>,
        [
          {
            text: 'Nächster Spieler',
            variant: 'primary',
            onClick: () => {
              console.log('🔴 Button clicked (wrong placement) - closing modal and calling nextTurn()')
              console.log('🔴 Before - currentPlayer:', currentPlayer, 'currentSong:', currentSong?.title)

              // Modal schließen
              closeModal()

              // Spielerwechsel im nächsten Event-Loop
              setTimeout(() => {
                console.log('🔴 Calling nextTurn()')
                nextTurn()

                // Virtual mode + Hardcore: Automatically draw new song for next player
                // Note: Timeline modes now use manual button (no auto-draw)
                if (gameVariant === 'virtual' && gameMode === 'hardcore') {
                  setTimeout(() => {
                    const newSong = selectRandomSong(songs, playedSongs)
                    if (newSong) {
                      contextAddToPlayedSongs(newSong.spotifyId || newSong.id)
                      setCurrentSong(newSong)
                      console.log('🎲 Auto-drew new song for next player in Hardcore mode:', newSong.title)
                    }
                  }, 200)
                }
              }, 0)
            }
          }
        ]
      )
    }
  }


  // ============================================================================
  // Win Modal
  // ============================================================================

  const showWinnerModal = (winner: Player | null) => {
    // Prevent duplicate winner modals and history entries
    if (gameOver || !winner) {
      console.log('⚠️ Game already over or no winner, skipping duplicate winner modal')
      return
    }

    // Mark game as over
    setGameOver(true)
    console.log('🏁 Game marked as over')

    // Save game to history
    try {
      saveGame({
        winner: {
          name: winner.name,
          cards: winner.cards,
          score: winner.score
        },
        players,
        gameMode,
        gameVariant
      })
      console.log('✅ Game saved to history')
      addToast('Spiel wurde zur Historie hinzugefügt!', 'success')
    } catch (error) {
      console.error('❌ Failed to save game:', error)
    }

    // ============================================================================
    // Check Achievements for ALL Players (Hardcore Mode only)
    // ============================================================================
    if (gameMode === 'hardcore') {
      // Calculate game duration
      const gameDurationMs = gameStartTime.current ? Date.now() - gameStartTime.current : 0
      const gameDurationMinutes = gameDurationMs / 1000 / 60
      console.log(`⏱️ Game duration: ${gameDurationMinutes.toFixed(2)} minutes`)

      applyAchievementEffects(
        endOfGameAchievements({
          players,
          winner,
          gameDurationMinutes,
          rankingsHistory: rankingsHistory.current
        })
      )

      // 8. UNBEATABLE & 9. MARATHON_RUNNER & 10. MUSIC_EXPERT:
      // 17. LEGENDARY_STREAK & 18. CENTURION & 19. GRAND_MASTER:
      // Check from full game history
      if (history && history.length > 0) {
        const historyData = { version: '1.0', games: history }
        players.forEach(player => {
          checkAchievements(player.name, historyData)
        })
      }

      // Achievement Debug Log (v0.0.25)
      console.log('🏆 Achievement Check Summary:')
      players.forEach(player => {
        const achievements = getPlayerAchievements(player.name)
        const unlocked = achievements.filter(a => a.unlocked).length
        const total = achievements.length
        console.log(`  ${player.name}: ${unlocked}/${total} achievements unlocked`)

        // Show progress for locked achievements with targets
        const inProgress = achievements.filter(a => !a.unlocked && a.target && a.progress)
        if (inProgress.length > 0) {
          console.log(`  In Progress:`)
          inProgress.forEach(a => {
            console.log(`    - ${a.name}: ${a.progress}/${a.target}`)
          })
        }
      })
    }

    // Show GameEndStatsDialog with confetti and statistics
    showModal(
      '🏆 Spiel beendet!',
      <GameEndStatsDialog
        winner={winner}
        allPlayers={players}
        gameMode={gameMode}
        onClose={() => {
          console.log('🏠 Navigating to home page...')

          // Stop music player FIRST
          const musicPlayer = getMusicPlayer()
          musicPlayer.stop()
          console.log('🎵 Music stopped')

          // Clear game state
          closeModal()

          // Clear mode/variant BEFORE resetGame to prevent redirect
          setGameMode(null)
          setGameVariant(null)

          // Reset game
          resetGame()

          // Navigate to landing page with replace to prevent back navigation
          navigate('/', { replace: true })

          // Scroll to top
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 100)
        }}
        onNewRound={() => {
          console.log('🔄 Starting new round with same players...')
          closeModal()
          resetGame()
          navigate('/player-setup')
        }}
      />,
      [], // No default buttons - GameEndStatsDialog has its own close button
      { required: true } // Modal can't be closed with backdrop - must use button
    )
  }

  return (
    <div className={`min-h-screen pt-28 pb-8 relative z-10 ${gameMode === 'hardcore' ? 'hardcore-theme' : ''}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Player Info */}
        <div className="mb-6">
          <PlayerInfo isBotExecuting={isBotExecuting} />
        </div>

        {/* Main Game Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Song Input & Playback */}
          <div className="space-y-6">
            {/* Song Selection (Physical = QR Scanner, Virtual = Button) */}
            {/* Timeline Mode: ALWAYS show button | Guess Mode: only when !currentSong */}
            {/* Hide buttons if game is over */}
            {!gameOver && (gameMode !== 'hardcore' || !currentSong) && (
              <div>
                {gameVariant === 'physical' ? (
                  <QRScanner />
                ) : (
                  <VirtualButton onClick={handleVirtualSong} />
                )}
              </div>
            )}

            {/* Music Player (always mounted to prevent re-initialization) */}
            <div>
              <MusicPlayer song={currentSong} />
            </div>

            {/* Guess Form (only in Guess Mode!) */}
            {currentSong && gameMode === 'hardcore' && (
              <div>
                <GuessForm onSubmit={handleGuessSubmit} onSkip={handleSkip} />
              </div>
            )}
          </div>

          {/* Right Column: Timeline & Score */}
          <div className="space-y-6">
            {/* Score Overview (Guess Mode) */}
            {gameMode === 'hardcore' && (
              <div>
                <ScoreOverview />
              </div>
            )}

            {/* Timeline Display */}
            <div>
              {gameMode === 'timeline_personal' || gameMode === 'hardcore' ? (
                /* Persönliche Timeline + Hardcore Mode: Show all players' timelines */
                <TimelinePersonalView />
              ) : (
                /* Globale Timeline: Show single global timeline */
                <TimelineDisplay />
              )}
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              showModal(
                '⚠️ Spiel beenden?',
                <div className="text-center py-6">
                  <p className="text-xl font-bold mb-2">Möchtest du das Spiel wirklich beenden?</p>
                  <p className="text-sm text-text-secondary">Der Spielstand geht verloren.</p>
                </div>,
                [
                  {
                    text: 'Abbrechen',
                    onClick: () => {
                      // Just close modal
                    }
                  },
                  {
                    text: 'Spiel beenden',
                    onClick: () => {
                      // Stop music using MusicPlayerService
                      try {
                        getMusicPlayer().stop()
                      } catch (error) {
                        console.error('❌ Error stopping music:', error)
                      }

                      // Clear game state first
                      resetGame()

                      // Close modal
                      closeModal()

                      // Navigate to home after short delay to ensure state is cleared
                      setTimeout(() => {
                        navigate('/', { replace: true })
                      }, 100)
                    }
                  }
                ]
              )
            }}
            className="btn btn-secondary"
          >
            ← Spiel beenden
          </button>
        </div>
      </div>
    </div>
  )
}
