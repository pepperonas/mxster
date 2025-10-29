/**
 * Game Screen
 * Main game interface with all game components
 */

import { useNavigate } from 'react-router-dom'
import { useGame, useUI } from '@/contexts'
import {
  PlayerInfo,
  QRScanner,
  VirtualButton,
  GuessForm,
  TimelineDisplay,
  ScoreOverview,
  MusicPlayer
} from '@/components/game'
import {
  validateGuess,
  placeCardInTimeline,
  checkWinCondition,
  selectRandomSong,
  incrementPlayerCards,
  addToPlayedSongs
} from '@/services'
import { songs } from '@/data/songs'

export function GameScreen() {
  const navigate = useNavigate()
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
    nextTurn
  } = useGame()
  const { showModal, addToast } = useUI()

  // Redirect if game not properly initialized
  if (!gameMode || !gameVariant || players.length === 0) {
    navigate('/mode-selection')
    return null
  }

  // ============================================================================
  // Virtual Mode: Select Random Song
  // ============================================================================

  const handleVirtualSong = () => {
    const song = selectRandomSong(songs, playedSongs)

    if (!song) {
      addToast('Alle Songs wurden bereits gespielt!', 'warning')
      return
    }

    // Mark song as played
    const newPlayedSongs = addToPlayedSongs(playedSongs, song)
    contextAddToPlayedSongs(song.spotifyId || song.id)

    // Set current song
    setCurrentSong(song)
    addToast(`Song gezogen: ${song.title}`, 'success')

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

    // Update score in Guess Mode
    if (gameMode === 'guess' && result.correctCount > 0) {
      updatePlayer(currentPlayer, {
        score: player.score + result.correctCount
      })
    }

    // Show evaluation modal
    showEvaluationModal(result, currentSong)
  }

  // ============================================================================
  // Skip Guess
  // ============================================================================

  const handleSkip = () => {
    if (!currentSong) return

    // Show song reveal modal
    showModal(
      'Song enthüllt',
      <div className="text-center py-4">
        <p className="text-2xl font-bold mb-2">{currentSong.title}</p>
        <p className="text-lg text-gray-400 mb-4">von {currentSong.artist}</p>
        <div className="inline-block px-6 py-3 bg-purple-600/30 rounded-lg text-3xl font-bold">
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
              autoPlaceInTimeline()
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
          <div className="flex items-center justify-center gap-3 text-lg text-gray-400">
            <span className="text-2xl">{result.artistMatch ? '✅' : '❌'}</span>
            <span>Artist: {song.artist}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">{result.yearMatch ? '✅' : '❌'}</span>
            <div className="inline-block px-6 py-2 bg-purple-600/30 rounded-lg text-xl font-bold">
              {song.year}
            </div>
          </div>
        </div>

        {/* Year difference (if wrong) */}
        {!result.yearMatch && result.yearDifference > 0 && (
          <div className="mb-4 p-3 bg-purple-900/30 rounded-lg">
            <p className="text-sm text-purple-300">
              {result.yearDifference} Jahre daneben
            </p>
          </div>
        )}

        {/* Points in Guess Mode */}
        {gameMode === 'guess' && (
          <div className="p-4 bg-purple-600 rounded-lg">
            <p className="text-xl font-bold">
              +{result.correctCount} {result.correctCount === 1 ? 'Punkt' : 'Punkte'}
            </p>
          </div>
        )}
      </div>,
      [
        {
          label: gameMode === 'guess' ? 'Weiter' : 'Karte einsortieren',
          variant: 'primary',
          onClick: () => {
            if (gameMode === 'guess') {
              placeCardAndContinue()
            } else {
              autoPlaceInTimeline()
            }
          }
        }
      ]
    )
  }

  // ============================================================================
  // Guess Mode: Auto-place card in timeline & check win
  // ============================================================================

  const placeCardAndContinue = () => {
    if (!currentSong) return

    const player = players[currentPlayer]

    // Add card to timeline (chronologically sorted)
    const newTimeline = placeCardInTimeline(player.timeline, currentSong)

    // Update player
    const updatedPlayer = incrementPlayerCards({
      ...player,
      timeline: newTimeline
    })

    updatePlayer(currentPlayer, updatedPlayer)

    // Check win condition
    const winCheck = checkWinCondition(players, currentPlayer, gameMode)

    if (winCheck.gameOver && winCheck.winner) {
      showWinnerModal(winCheck.winner, winCheck.message)
      return
    }

    // Next turn
    nextTurn()
    addToast('Karte platziert!', 'success')
  }

  // ============================================================================
  // Timeline Modes: Auto-place in global/personal timeline & check win
  // ============================================================================

  const autoPlaceInTimeline = () => {
    if (!currentSong) return

    const player = players[currentPlayer]

    // Global or Personal timeline
    if (gameMode === 'timeline_global') {
      // Add to global timeline
      addToGlobalTimeline(currentSong)
    } else {
      // Add to personal timeline
      const newTimeline = placeCardInTimeline(player.timeline, currentSong)
      updatePlayer(currentPlayer, { timeline: newTimeline })
    }

    // Increment cards
    const updatedPlayer = incrementPlayerCards(player)
    updatePlayer(currentPlayer, updatedPlayer)

    // Check win condition
    const winCheck = checkWinCondition(players, currentPlayer, gameMode)

    if (winCheck.gameOver && winCheck.winner) {
      showWinnerModal(winCheck.winner, winCheck.message)
      return
    }

    // Show confirmation modal
    showModal(
      'Karte eingefügt!',
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-lg mb-4">
          "{currentSong.title}" wurde chronologisch eingefügt!
        </p>
        <div className="p-4 bg-purple-900/30 rounded-lg">
          <p className="font-semibold">Fortschritt:</p>
          <p className="text-2xl mt-2">
            {updatedPlayer.cards}/10 Karten
          </p>
        </div>
      </div>,
      [{ label: 'Weiter', variant: 'primary', onClick: nextTurn }]
    )
  }

  // ============================================================================
  // Win Modal
  // ============================================================================

  const showWinnerModal = (winner: typeof players[0], message: string) => {
    showModal(
      '🏆 Gewinner!',
      <div className="text-center py-6">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-3xl font-bold mb-2">{winner.name}</p>
        <p className="text-xl text-gray-400 mb-6">{message}</p>

        {gameMode === 'guess' && (
          <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
            <p className="text-2xl font-bold">{winner.score} Punkte</p>
            <p className="text-sm text-white/80 mt-1">{winner.cards}/10 Karten</p>
          </div>
        )}

        {gameMode !== 'guess' && (
          <div className="p-6 bg-purple-600 rounded-xl">
            <p className="text-2xl font-bold">{winner.cards}/10 Karten</p>
          </div>
        )}
      </div>,
      [
        { label: 'Neues Spiel', variant: 'primary', onClick: () => navigate('/mode-selection') },
        { label: 'Zurück zum Start', variant: 'secondary', onClick: () => navigate('/') }
      ]
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
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
            {!currentSong && (
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
                <MusicPlayer song={currentSong} />
              </div>
            )}

            {/* Guess Form (when song is active) */}
            {currentSong && (
              <div>
                <GuessForm onSubmit={handleGuessSubmit} onSkip={handleSkip} />
              </div>
            )}

            {/* Instructions when no song */}
            {!currentSong && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-800 text-center">
                <div className="text-5xl mb-4">👇</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {gameVariant === 'physical'
                    ? 'Scanne eine Karte'
                    : 'Ziehe einen zufälligen Song'}
                </h3>
                <p className="text-gray-400">
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
              <TimelineDisplay />
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm('Spiel wirklich beenden?')) {
                navigate('/')
              }
            }}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Spiel beenden
          </button>
        </div>

        {/* Phase Note */}
        <div className="mt-6 p-4 bg-green-900/30 rounded-lg text-center text-sm text-green-300 max-w-3xl mx-auto">
          ✅ <strong>Phase 9 Implemented:</strong> Game Logic Integration complete! Guess validation, Timeline placement, Turn rotation, and Win conditions all working.
        </div>
      </div>
    </div>
  )
}
