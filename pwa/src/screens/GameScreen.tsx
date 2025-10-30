/**
 * Game Screen
 * Main game interface with all game components
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, useUI, useAuth } from '@/contexts'
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
import { SpotifyPlayerService } from '@/services/SpotifyPlayerService'
import {
  validateGuess,
  placeCardInTimeline,
  checkWinCondition,
  selectRandomSong,
  incrementPlayerCards,
  addToPlayedSongs,
  GameHistory,
  type SpotifyPlayerState
} from '@/services'
import { songs } from '@/data/songs'

export function GameScreen() {
  const navigate = useNavigate()
  const { accessToken, isLoggedIn } = useAuth()

  // Beat Sync State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [trackId, setTrackId] = useState<string | null>(null)

  // Timeline Mode: Track which song we already showed modal for
  const lastSongIdShown = useRef<string | null>(null)

  const {
    gameMode,
    gameVariant,
    players,
    currentPlayer,
    currentSong,
    playedSongs,
    globalTimeline,
    updatePlayer,
    setCurrentSong,
    addToGlobalTimeline,
    addToPlayedSongs: contextAddToPlayedSongs,
    nextTurn,
    resetGame
  } = useGame()
  const { showModal, closeModal, addToast } = useUI()

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
    }
  }, [gameMode, gameVariant, players.length, accessToken, isLoggedIn, navigate, addToast])

  // ============================================================================
  // Timeline Mode: Show placement modal for all cards
  // ============================================================================

  useEffect(() => {
    console.log('🔷 useEffect triggered - currentSong:', currentSong?.title || 'null', 'gameMode:', gameMode)

    // Only in Timeline Modes (not Guess Mode)
    if (currentSong && gameMode !== 'guess') {
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
  // Skip Guess
  // ============================================================================

  const handleSkip = () => {
    if (!currentSong) return

    // Show song reveal modal (no points for skipping)
    showModal(
      'Song enthüllt',
      <div className="text-center py-4">
        <p className="text-2xl font-bold mb-2">{currentSong.title}</p>
        <p className="text-lg text-text-secondary mb-4">von {currentSong.artist}</p>
        <div className="inline-block px-6 py-3 glass border-2 border-accent/30 rounded-lg text-3xl font-bold">
          {currentSong.year}
        </div>
      </div>,
      [
        {
          label: gameMode === 'guess' ? 'Weiter' : 'Karte platzieren',
          variant: 'primary',
          onClick: () => {
            if (gameMode === 'guess') {
              placeCardAndContinue()
            } else {
              showManualPlacementModal()
            }
          }
        }
      ]
    )
  }

  // ============================================================================
  // Evaluation Modal (Show checkmarks + points)
  // ============================================================================

  const showEvaluationModal = (
    result: ReturnType<typeof validateGuess>,
    song: typeof currentSong
  ) => {
    if (!song) return

    // Modal title based on correct count
    const titles = [
      '❌ Leider alles falsch',
      '🤷 Teilweise richtig',
      '👍 Gut gemacht! 2 von 3 richtig!',
      '🏆 Perfekt! Alles richtig!'
    ]
    const title = titles[result.correctCount] || titles[0]

    showModal(
      title,
      <div className="text-center py-4">
        {/* Checkmarks */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center gap-3 text-lg">
            <span className="text-2xl">{result.titleMatch ? '✅' : '❌'}</span>
            <span>Titel: "{song.title}"</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg text-text-secondary">
            <span className="text-2xl">{result.artistMatch ? '✅' : '❌'}</span>
            <span>Artist: {song.artist}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">{result.yearMatch ? '✅' : '❌'}</span>
            <div className="inline-block px-6 py-2 glass border-2 border-accent/30 rounded-lg text-xl font-bold">
              {song.year}
            </div>
          </div>
        </div>

        {/* Year difference (if wrong) */}
        {!result.yearMatch && result.yearDifference > 0 && (
          <div className="mb-4 p-3 glass border border-accent/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              {result.yearDifference} Jahre daneben
            </p>
          </div>
        )}

        {/* Points in Guess Mode */}
        {gameMode === 'guess' && (
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-xl font-bold">
              +{result.correctCount} {result.correctCount === 1 ? 'Punkt' : 'Punkte'}
            </p>
          </div>
        )}
      </div>,
      [
        {
          label: gameMode === 'guess' ? 'Weiter' : 'Karte platzieren',
          variant: 'primary',
          onClick: () => {
            console.log('🟡 EVALUATION MODAL - BUTTON CLICKED! gameMode:', gameMode)
            console.log('🟡 result from closure:', result)
            if (gameMode === 'guess') {
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

    // Add card to timeline (chronologically sorted)
    const newTimeline = placeCardInTimeline(player.timeline, currentSong)

    // Calculate new score (only in Guess Mode)
    let newScore = player.score
    if (gameMode === 'guess' && guessResult) {
      newScore = player.score + guessResult.correctCount
      console.log('🎯 Updating score:', {
        oldScore: player.score,
        points: guessResult.correctCount,
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

    // Check win condition (use updated player data)
    const updatedPlayer = {
      ...player,
      timeline: newTimeline,
      cards: player.cards + 1,
      score: newScore
    }
    const updatedPlayers = [...players]
    updatedPlayers[currentPlayer] = updatedPlayer
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
      [] // No default buttons - handled by placement buttons
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

      // Get updated player for win check
      const updatedPlayer = {
        ...player,
        cards: player.cards + 1,
        timeline: gameMode === 'timeline_global' ? player.timeline : newTimeline
      }

      // Check win condition
      const winCheck = checkWinCondition(players, playerIndex, gameMode)

      if (winCheck.gameOver && winCheck.winner) {
        showWinnerModal(winCheck.winner, winCheck.message)
        return
      }

      // Show success feedback, dann Spielerwechsel im Button onClick
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
              console.log('🔴 Button clicked - closing modal and calling nextTurn()')
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
      addToast('Spiel wurde gespeichert!', 'success')
    } catch (error) {
      console.error('❌ Failed to save game:', error)
    }

    showModal(
      '🏆 Gewinner!',
      <div className="text-center py-6">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-3xl font-bold mb-2">{winner.name}</p>
        <p className="text-xl text-text-secondary mb-6">{message}</p>

        {gameMode === 'guess' && (
          <div className="p-6 bg-gradient-to-r from-secondary to-accent rounded-xl">
            <p className="text-2xl font-bold">{winner.score} Punkte</p>
            <p className="text-sm text-white/80 mt-1">{winner.cards}/10 Karten</p>
          </div>
        )}

        {gameMode !== 'guess' && (
          <div className="p-6 bg-secondary rounded-xl">
            <p className="text-2xl font-bold">{winner.cards}/10 Karten</p>
          </div>
        )}

        {/* History Info */}
        <div className="mt-6 p-4 glass border border-accent/30 rounded-lg text-sm text-text-secondary">
          📊 Spiel wurde zur Historie hinzugefügt
        </div>
      </div>,
      [
        {
          label: 'Neues Spiel',
          variant: 'primary',
          onClick: () => {
            console.log('🔄 Resetting game state...')
            resetGame()
            navigate('/mode-selection')
          }
        },
        {
          label: 'Zurück zum Start',
          variant: 'secondary',
          onClick: () => {
            resetGame()
            navigate('/')
          }
        }
      ]
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
            {(gameMode !== 'guess' || !currentSong) && (
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
            {currentSong && gameMode === 'guess' && (
              <div>
                <GuessForm onSubmit={handleGuessSubmit} onSkip={handleSkip} />
              </div>
            )}

            {/* Instructions when no song (only in Guess Mode) */}
            {!currentSong && gameMode === 'guess' && (
              <div className="bg-primary/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-border text-center">
                <div className="text-5xl mb-4">👇</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {gameVariant === 'physical'
                    ? 'Scanne eine Karte'
                    : 'Ziehe einen zufälligen Song'}
                </h3>
                <p className="text-text-secondary">
                  {gameVariant === 'physical'
                    ? 'Aktiviere die Kamera und scanne den QR-Code'
                    : 'Klicke auf den Button, um einen Song zu ziehen'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Timeline & Score */}
          <div className="space-y-6">
            {/* Score Overview (Guess Mode) */}
            {gameMode === 'guess' && (
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
