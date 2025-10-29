/**
 * Game Screen
 * Main game interface (placeholder for Phase 8)
 */

import { useNavigate } from 'react-router-dom'
import { useGame } from '@/contexts'

export function GameScreen() {
  const navigate = useNavigate()
  const { gameMode, gameVariant, players, currentPlayer } = useGame()

  if (!gameMode || !gameVariant || players.length === 0) {
    navigate('/mode-selection')
    return null
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Placeholder Content */}
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gradient">Game Screen</h1>
          <p className="text-xl text-gray-400">
            Phase 8: Game Screen Components werden hier implementiert
          </p>

          <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-gray-800 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Spiel-Info:</h2>
            <div className="space-y-3 text-left">
              <p className="text-gray-300">
                <strong>Modus:</strong> {gameMode}
              </p>
              <p className="text-gray-300">
                <strong>Variante:</strong> {gameVariant}
              </p>
              <p className="text-gray-300">
                <strong>Spieler:</strong> {players.length}
              </p>
              <p className="text-gray-300">
                <strong>Aktueller Spieler:</strong> {players[currentPlayer]?.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Zurück zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}
