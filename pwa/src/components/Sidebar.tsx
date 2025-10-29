/**
 * Sidebar Component
 * Side navigation panel with game info, player list, and quick actions
 */

import { useUI, useGame, useAuth } from '@/contexts'
import { useGameHistory } from '@/hooks'
import { GAME_MODE_INFO } from '@/utils/gameModes'

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI()
  const { players, currentPlayer, gameMode, gameVariant } = useGame()
  const { isLoggedIn } = useAuth()
  const { history } = useGameHistory()

  if (!isSidebarOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={toggleSidebar}
      />

      {/* Sidebar Panel */}
      <aside className="fixed top-0 left-0 bottom-0 w-80 bg-gray-900 border-r border-gray-800 z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isLoggedIn ? 'bg-green-500' : 'bg-gray-500'}`}
            />
            <div>
              <p className="text-sm text-gray-400">Spotify Status</p>
              <p className="text-white font-medium">
                {isLoggedIn ? 'Verbunden' : 'Nicht verbunden'}
              </p>
            </div>
          </div>
        </div>

        {/* Game Info */}
        {gameMode && (
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Aktuelles Spiel</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{GAME_MODE_INFO[gameMode]?.icon || '🎮'}</span>
                <div>
                  <p className="text-white font-medium">{GAME_MODE_INFO[gameMode]?.name}</p>
                  <p className="text-xs text-gray-400">
                    {gameVariant === 'physical' ? '📷 Mit QR-Scanner' : '🎲 Virtueller Modus'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Players List */}
        {players.length > 0 && (
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              Spieler ({players.length})
            </h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={index}
                  className={`
                    p-3 rounded-lg border-2 transition-colors
                    ${
                      index === currentPlayer
                        ? 'bg-purple-900/30 border-purple-600'
                        : 'bg-gray-800 border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{player.name}</span>
                    {index === currentPlayer && (
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded">Aktiv</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>🎴 {player.cards} Karten</span>
                    <span>⭐ {player.score} Punkte</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Stats */}
        {history.length > 0 && (
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Statistik</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Gespielte Spiele:</span>
                <span className="text-white font-medium">{history.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Letzter Gewinner:</span>
                <span className="text-white font-medium">
                  {history[0]?.winner || 'Unbekannt'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Navigation</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => {
                  /* TODO: Navigate to home */
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                🏠 Startseite
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  /* TODO: Open history modal */
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                📊 Spielhistorie
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  /* TODO: Open settings modal */
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                ⚙️ Einstellungen
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  /* TODO: Open rules modal */
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                📖 Spielregeln
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  )
}
