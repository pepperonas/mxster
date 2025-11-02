/**
 * Game Screen
 * Main game interface with all game components
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, useUI, useAuth, useAchievements } from '@/contexts'
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
import { SpotifyPlayerService } from '@/services/SpotifyPlayerService'
import {
  validateGuess,
  placeCardInTimeline,
  checkWinCondition,
  selectRandomSong,
  incrementPlayerCards,
  addToPlayedSongs,
  calculatePoints,
  GameHistory,
  type SpotifyPlayerState
} from '@/services'
import { songs } from '@/data/songs'
import { AchievementId } from '@/types/achievements'

export function GameScreen() {
  const navigate = useNavigate()
  const { accessToken, isLoggedIn } = useAuth()

  // Beat Sync State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [trackId, setTrackId] = useState<string | null>(null)

  // Timeline Mode: Track which song we already showed modal for
  const lastSongIdShown = useRef<string | null>(null)

  // Game Duration Tracking (for LIGHTNING_FAST achievement)
  const gameStartTime = useRef<number | null>(null)

  // Player Rankings History (for COMEBACK_KING achievement)
  // Array of snapshots: [{turn: number, rankings: [playerName, playerName, ...]}, ...]
  const rankingsHistory = useRef<Array<{ turn: number; rankings: string[] }>>([])

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
    resetGame
  } = useGame()
  const { showModal, closeModal, addToast } = useUI()
  const { unlockAchievement, updateProgress, checkAchievements } = useAchievements()

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

    // Check if logged in to Spotify (required for music playback)
    if (!accessToken || !isLoggedIn) {
      console.log('⚠️ No Spotify access token found, redirecting to login')
      addToast('Bitte melde dich bei Spotify an, um das Spiel zu starten', 'error')
      navigate('/')
      return
    }

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

  // Debug logging
  console.log('🔵 GameScreen render - currentPlayer:', currentPlayer, 'currentSong:', currentSong?.title || 'null')

  // Don't render if not initialized
  if (!gameMode || !gameVariant || players.length === 0) {
    return null
  }

  // ============================================================================
  // Player State Change Handler (for BeatAnimator)
  // ============================================================================

  const handlePlayerStateChange = (state: SpotifyPlayerState) => {
    setIsPlaying(!state.paused)
    setCurrentPosition(state.position)

    // Update track ID
    const newTrackId = state.track_window.current_track.id
    if (newTrackId !== trackId) {
      setTrackId(newTrackId)
    }
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

    // Get updated skip counts (including the just incremented one)
    const updatedSkipCounts = { ...currentSongSkips, [currentPlayer]: (currentSongSkips[currentPlayer] || 0) + 1 }

    // Check if penalty system should apply (Guess Mode only)
    let penaltyTriggered = false
    let penaltyApplied = false
    let newScore = player.score

    if (gameMode === 'hardcore') {
      // Count how many players have skipped this song
      const playersWhoSkipped = Object.keys(updatedSkipCounts).length
      const totalSkips = Object.values(updatedSkipCounts).reduce((sum, count) => sum + count, 0)

      console.log('⏭️ Skip Stats:', {
        player: player.name,
        playersWhoSkipped,
        totalPlayers: players.length,
        totalSkips,
        skipCounts: updatedSkipCounts
      })

      // Penalty applies only if ALL players have skipped at least once
      if (playersWhoSkipped >= players.length) {
        // Calculate penalty probability (increases with each skip after everyone has skipped once)
        // Formula: (totalSkips - playerCount) * 0.33 = 33% per additional skip
        const additionalSkips = totalSkips - players.length
        const penaltyProbability = Math.min(additionalSkips * 0.33, 0.95) // Max 95% probability

        console.log('💀 Penalty Check:', {
          additionalSkips,
          penaltyProbability: `${(penaltyProbability * 100).toFixed(0)}%`
        })

        // Roll the dice
        if (Math.random() < penaltyProbability) {
          penaltyTriggered = true
          // Apply penalty (-3 points, can go negative!)
          newScore = player.score - 3
          penaltyApplied = true

          console.log('💀 PENALTY APPLIED!', {
            oldScore: player.score,
            newScore,
            pointsDeducted: 3
          })
        } else {
          console.log('✅ Penalty dodged!')
        }
      }
    }

    // If penalty was applied, draw a new song immediately
    if (penaltyApplied) {
      // Update player score
      updatePlayer(currentPlayer, { score: newScore })

      // Show penalty modal
      showModal(
        '💀 Zu oft übersprungen!',
        <div className="text-center py-6">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-2xl font-bold mb-4 text-red-500">-3 Punkte Strafe!</div>
          <p className="text-lg text-text-secondary mb-6">
            Dieser Song wurde von allen Spielern bereits mehrfach übersprungen.
          </p>
          <div className="p-6 bg-red-900/30 border-2 border-red-500/50 rounded-xl mb-6">
            <div className="text-sm text-text-secondary mb-2">Neuer Punktestand</div>
            <div className="text-4xl font-bold">{newScore} Punkte</div>
          </div>
          <div className="p-4 glass border border-accent/30 rounded-lg text-sm text-text-secondary">
            <p>🎲 Ein neuer Song wird automatisch gezogen.</p>
          </div>
        </div>,
        [
          {
            label: 'Neuen Song ziehen',
            variant: 'primary',
            onClick: () => {
              // Reset skip counts for new song
              resetSkipCounts()

              // Draw new song
              const newSong = selectRandomSong(songs, playedSongs)
              if (newSong) {
                const newPlayedSongs = addToPlayedSongs(playedSongs, newSong)
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
      if (gameMode === 'hardcore' && Object.keys(updatedSkipCounts).length >= players.length) {
        const totalSkips = Object.values(updatedSkipCounts).reduce((sum, count) => sum + count, 0)
        const additionalSkips = totalSkips - players.length
        const nextPenaltyProbability = Math.min((additionalSkips + 1) * 0.33, 0.95)

        showModal(
          '⚠️ Gefährliche Zone!',
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎲</div>
            <div className="text-xl font-bold mb-4 text-yellow-400">
              Alle Spieler haben diesen Song bereits übersprungen!
            </div>
            <p className="text-lg text-text-secondary mb-6">
              Der nächste Skip hat eine <span className="text-yellow-400 font-bold">{(nextPenaltyProbability * 100).toFixed(0)}% Chance</span> auf eine <span className="text-red-500 font-bold">-3 Punkte Strafe</span>!
            </p>
            <div className="p-4 glass border-2 border-yellow-500/50 rounded-lg text-sm">
              <p className="text-text-secondary">
                💡 Tipp: Versuche es zu raten, anstatt zu überspringen!
              </p>
            </div>
          </div>,
          [
            {
              label: 'Verstanden',
              variant: 'primary',
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
            <div className="inline-block px-6 py-2 glass border-2 border-accent/30 rounded-lg text-xl font-bold">
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
          <div className="mb-4 p-3 glass border border-accent/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              {result.yearDifference} {result.yearDifference === 1 ? 'Jahr' : 'Jahre'} daneben
            </p>
          </div>
        )}

        {/* Points in Hardcore Mode */}
        {gameMode === 'hardcore' && (
          <div className="p-4 bg-gradient-to-r from-secondary/30 to-accent/30 rounded-lg border-2 border-accent/50">
            <p className="text-2xl font-bold text-gradient">
              +{earnedPoints} {earnedPoints === 1 ? 'Punkt' : 'Punkte'}
            </p>
          </div>
        )}
      </div>,
      [
        {
          label: gameMode === 'hardcore' ? 'Weiter' : 'Karte platzieren',
          variant: 'primary',
          onClick: () => {
            console.log('🟡 EVALUATION MODAL - BUTTON CLICKED! gameMode:', gameMode)
            console.log('🟡 result from closure:', result)
            if (gameMode === 'hardcore') {
              console.log('🟡 Calling placeCardAndContinue() with result:', result.correctCount)
              placeCardAndContinue(result)
            } else {
              console.log('🟡 Calling showManualPlacementModal()')
              showManualPlacementModal()
            }
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
    if (gameMode === 'hardcore' && guessResult) {
      earnedPoints = calculatePoints(
        guessResult.titleMatch,
        guessResult.artistMatch,
        guessResult.yearDifference
      )
      console.log('🎯 Points calculated:', {
        titleMatch: guessResult.titleMatch,
        artistMatch: guessResult.artistMatch,
        yearDifference: guessResult.yearDifference,
        earnedPoints
      })
    }

    // Add card to timeline (chronologically sorted) with points
    const newTimeline = placeCardInTimeline(player.timeline, currentSong, earnedPoints)

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
      showWinnerModal(winCheck.winner, winCheck.message)
      return
    }

    // Next turn
    nextTurn()
    addToast('Karte platziert!', 'success')
  }

  // ============================================================================
  // Timeline Modes: Manual placement modal
  // ============================================================================

  const showManualPlacementModal = () => {
    console.log('🟠 showManualPlacementModal called')
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
        <div className="mb-6 p-4 glass border-2 border-accent/30 rounded-lg">
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
              className="w-full py-4 px-4 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-lg transition-colors"
            >
              <div className="text-lg">📍 Erste Karte platzieren</div>
            </button>
          ) : (
            <>
              {/* Before first card */}
              <button
                onClick={() => {
                  console.log('🟠 Position button clicked: 0 (vor erstem)')
                  handleManualPlacement(0)
                }}
                className="w-full py-3 px-4 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-lg transition-colors text-sm"
              >
                ⬆️ Vor {timeline[0].year}
              </button>

              {/* Cards and placement buttons */}
              {timeline.map((song, index) => (
                <div key={song.id}>
                  {/* Existing card */}
                  <div className="py-3 px-4 bg-primary/30 border border-white/10 rounded-lg">
                    <div className="font-semibold">{song.title}</div>
                    <div className="text-sm text-text-secondary">{song.artist} • {song.year}</div>
                  </div>

                  {/* Placement button after this card */}
                  {index < timeline.length - 1 && (
                    <button
                      onClick={() => {
                        console.log('🟠 Position button clicked:', index + 1, '(zwischen)')
                        handleManualPlacement(index + 1)
                      }}
                      className="w-full py-2 px-4 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-lg transition-colors text-sm mt-3"
                    >
                      📍 Zwischen {timeline[index].year} und {timeline[index + 1].year}
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
                className="w-full py-3 px-4 bg-primary/50 hover:bg-accent/50 border-2 border-accent/30 hover:border-accent rounded-lg transition-colors text-sm"
              >
                ⬇️ Nach {timeline[timeline.length - 1].year}
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

    // Get timeline: GlobalTimelineCard[] for global mode, Song[] for personal mode
    const rawTimeline = gameMode === 'timeline_global' ? globalTimeline : player.timeline
    // Extract songs for validation (handle both GlobalTimelineCard[] and Song[])
    const timeline = gameMode === 'timeline_global'
      ? rawTimeline.map((card: any) => card.song)
      : rawTimeline

    console.log('🟡 Current timeline length:', timeline.length)

    // Insert song at chosen position
    const newTimeline = [...timeline]
    newTimeline.splice(position, 0, currentSong)

    // Check if placement is chronologically correct
    const isCorrect = newTimeline.every((song, idx) => {
      if (idx === 0) return true
      return song.year >= newTimeline[idx - 1].year
    })

    console.log('🟡 Placement is correct:', isCorrect)

    // Store current song info for modal (before state changes)
    const songTitle = currentSong.title
    const songArtist = currentSong.artist
    const songYear = currentSong.year

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
          <div className="mt-6 p-4 glass border-2 border-accent/30 rounded-lg">
            <div className="text-sm text-text-secondary">Fortschritt</div>
            <div className="text-2xl font-bold">{updatedPlayer.cards}/10 Karten</div>
          </div>
        </div>,
        [
          {
            label: 'Nächster Spieler',
            variant: 'primary',
            closeOnClick: false,
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
                setTimeout(() => {
                  showWinnerModal(winCheck.winner, winCheck.message)
                }, 150)
              } else {
                console.log('🔴 Calling nextTurn()')
                // Small delay to ensure modal is fully closed
                setTimeout(() => {
                  nextTurn()
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
          <div className="text-3xl font-bold text-red-500 mb-2">{songYear}</div>
          <div className="mt-6 p-4 glass rounded-lg border-2 border-red-500/50">
            <div className="text-sm">Die Karte wird nicht hinzugefügt</div>
          </div>
        </div>,
        [
          {
            label: 'Nächster Spieler',
            variant: 'primary',
            closeOnClick: false,
            onClick: () => {
              console.log('🔴 Button clicked (wrong placement) - closing modal and calling nextTurn()')
              console.log('🔴 Before - currentPlayer:', currentPlayer, 'currentSong:', currentSong?.title)

              // Modal schließen
              closeModal()

              // Spielerwechsel im nächsten Event-Loop
              setTimeout(() => {
                console.log('🔴 Calling nextTurn()')
                nextTurn()
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

  const showWinnerModal = (winner: typeof players[0], message: string) => {
    // Save game to history
    try {
      GameHistory.saveGame(winner, players, gameMode)
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

      // Sort players by score to determine rankings
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
      const winnerIndex = players.findIndex(p => p.name === winner.name)

      players.forEach((player, index) => {
        console.log(`🏆 Checking achievements for player: ${player.name}`)

        // 1. HARDCORE_CHAMPION: 100+ points in one game
        if (player.score >= 100) {
          unlockAchievement(player.name, AchievementId.HARDCORE_CHAMPION)
          console.log(`✅ HARDCORE_CHAMPION unlocked for ${player.name}`)
        }

        // 2. TIME_TRAVELER: Songs from 5 different decades
        const decades = new Set(player.timeline.map(song => Math.floor(song.year / 10) * 10))
        if (decades.size >= 5) {
          unlockAchievement(player.name, AchievementId.TIME_TRAVELER)
          console.log(`✅ TIME_TRAVELER unlocked for ${player.name} (${decades.size} decades)`)
        }
        updateProgress(player.name, AchievementId.TIME_TRAVELER, decades.size)

        // 3. DECADE_MASTER: 10 songs from same decade
        const decadeCounts: Record<number, number> = {}
        player.timeline.forEach(song => {
          const decade = Math.floor(song.year / 10) * 10
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
        })
        const maxDecadeCount = Math.max(...Object.values(decadeCounts), 0)
        if (maxDecadeCount >= 10) {
          unlockAchievement(player.name, AchievementId.DECADE_MASTER)
          console.log(`✅ DECADE_MASTER unlocked for ${player.name}`)
        }
        updateProgress(player.name, AchievementId.DECADE_MASTER, maxDecadeCount)

        // 4. PERFECTIONIST: All songs placed correctly (10/10 cards)
        if (player.cards === 10) {
          unlockAchievement(player.name, AchievementId.PERFECTIONIST)
          console.log(`✅ PERFECTIONIST unlocked for ${player.name}`)
        }

        // 5. LIGHTNING_FAST: Game finished in under 5 minutes
        if (player.name === winner.name && gameDurationMinutes < 5) {
          unlockAchievement(player.name, AchievementId.LIGHTNING_FAST)
          console.log(`✅ LIGHTNING_FAST unlocked for ${player.name} (${gameDurationMinutes.toFixed(2)}min)`)
        }

        // 6. COMEBACK_KING: Winner was in last place at some point during the game
        if (player.name === winner.name && players.length > 1 && rankingsHistory.current.length > 0) {
          // Check if winner was ever in last place during the game
          let wasInLastPlace = false

          // Check rankings in the first half of the game (to ensure real comeback)
          const firstHalfSnapshots = rankingsHistory.current.filter(
            snapshot => snapshot.turn <= 5 // First 5 turns
          )

          firstHalfSnapshots.forEach(snapshot => {
            const lastIndex = snapshot.rankings.length - 1
            if (snapshot.rankings[lastIndex] === player.name) {
              wasInLastPlace = true
              console.log(`🔍 ${player.name} was in last place at turn ${snapshot.turn}`)
            }
          })

          if (wasInLastPlace) {
            unlockAchievement(player.name, AchievementId.COMEBACK_KING)
            console.log(`✅ COMEBACK_KING unlocked for ${player.name}`)
          } else {
            console.log(`⚠️ ${player.name} won but was never in last place (no comeback)`)
          }
        }
      })

      // 7. PERFECT_STREAK: 3x consecutive perfect guesses (15 points each)
      // This requires tracking streak during the game, not just at the end
      // We check timeline for consecutive songs with max points
      players.forEach(player => {
        let currentStreak = 0
        let maxStreak = 0

        player.timeline.forEach(song => {
          // Check if this song was a perfect guess (song has earnedPoints field from placeCardInTimeline)
          const earnedPoints = (song as any).earnedPoints || 0
          if (earnedPoints === 15) {
            currentStreak++
            maxStreak = Math.max(maxStreak, currentStreak)
          } else {
            currentStreak = 0
          }
        })

        updateProgress(player.name, AchievementId.PERFECT_STREAK, maxStreak)
        if (maxStreak >= 3) {
          unlockAchievement(player.name, AchievementId.PERFECT_STREAK)
          console.log(`✅ PERFECT_STREAK unlocked for ${player.name} (streak: ${maxStreak})`)
        }
      })

      // 8. UNBEATABLE & 9. MARATHON_RUNNER & 10. MUSIC_EXPERT:
      // Check from full game history
      const historyData = GameHistory.loadAll()
      if (historyData && historyData.games) {
        players.forEach(player => {
          checkAchievements(player.name, historyData)
        })
      }
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
          resetGame()
          navigate('/')
        }}
        onNewRound={() => {
          console.log('🔄 Starting new round with same players...')
          resetGame()
          navigate('/player-setup')
        }}
      />,
      [], // No default buttons - GameEndStatsDialog has its own close button
      { required: true } // Modal can't be closed with backdrop - must use button
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Player Info */}
        <div className="mb-6">
          <PlayerInfo />
        </div>

        {/* Main Game Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Song Input & Playback */}
          <div className="space-y-6">
            {/* Song Selection (Physical = QR Scanner, Virtual = Button) */}
            {/* Timeline Mode: ALWAYS show button | Guess Mode: only when !currentSong */}
            {(gameMode !== 'hardcore' || !currentSong) && (
              <div>
                {gameVariant === 'physical' ? (
                  <QRScanner />
                ) : (
                  <VirtualButton onClick={handleVirtualSong} />
                )}
              </div>
            )}

            {/* Music Player (when song is playing) */}
            {currentSong && (
              <div>
                <MusicPlayer song={currentSong} onStateChange={handlePlayerStateChange} />
              </div>
            )}

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
              {gameMode === 'timeline_personal' ? (
                /* Persönliche Timeline: Show all players' timelines */
                <TimelinePersonalView />
              ) : (
                /* Globale Timeline or Guess Mode: Show single timeline */
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
                    label: 'Abbrechen',
                    variant: 'secondary',
                    onClick: () => {
                      // Just close modal
                    }
                  },
                  {
                    label: 'Spiel beenden',
                    variant: 'primary',
                    closeOnClick: false,
                    onClick: () => {
                      // Stop music (non-blocking)
                      SpotifyPlayerService.pause().catch((error) => {
                        console.error('❌ Error stopping music:', error)
                      })

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
