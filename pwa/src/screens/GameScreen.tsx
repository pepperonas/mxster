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

export function GameScreen() {
  const navigate = useNavigate()
  const { gameMode, gameVariant, players, currentSong } = useGame()
  const { addToast } = useUI()

  // Redirect if game not properly initialized
  if (!gameMode || !gameVariant || players.length === 0) {
    navigate('/mode-selection')
    return null
  }

  // Placeholder handlers (Phase 9: Full implementation with game logic)
  const handleGuessSubmit = (title: string, artist: string, year: string) => {
    addToast('Rate-Funktion wird in Phase 9 implementiert', 'info')
    console.log('Guess:', { title, artist, year })
  }

  const handleSkip = () => {
    addToast('Skip-Funktion wird in Phase 9 implementiert', 'info')
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
                {gameVariant === 'physical' ? <QRScanner /> : <VirtualButton />}
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
        <div className="mt-6 p-4 bg-yellow-900/30 rounded-lg text-center text-sm text-yellow-300 max-w-3xl mx-auto">
          ⚠️ <strong>Phase 8 Complete:</strong> Alle UI-Komponenten sind erstellt. <strong>Phase 9:</strong> Game Logic Integration (Guess validation, Timeline placement, Turn rotation)
        </div>
      </div>
    </div>
  )
}
