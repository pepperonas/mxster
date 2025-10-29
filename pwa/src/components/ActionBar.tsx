/**
 * ActionBar Component
 * Top navigation bar with logo, actions, and settings
 */

import { useUI, useAuth, useGame } from '@/contexts'
import { useGameState } from '@/hooks'
import { SaveIcon, LogoutIcon, DownloadIcon, HistoryIcon, SettingsIcon } from '@/utils/icons'

export function ActionBar() {
  const { toggleSidebar } = useUI()
  const { isLoggedIn, logout } = useAuth()
  const { gameMode } = useGame()
  const { saveGameState, hasGameState } = useGameState()

  const handleSave = () => {
    const success = saveGameState()
    if (success) {
      // Toast will be shown by useGameState
      console.log('✅ Game state saved')
    }
  }

  const handleLogout = () => {
    if (confirm('Wirklich ausloggen? Dein Spielstand bleibt erhalten.')) {
      logout()
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl font-bold text-white hidden sm:block">mxster</h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Save Game (only if game active) */}
          {hasGameState() && (
            <button
              onClick={handleSave}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
              title="Spielstand speichern"
            >
              <SaveIcon size={20} />
            </button>
          )}

          {/* History */}
          <button
            onClick={() => {
              /* TODO: Open history modal */
            }}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Spielhistorie"
          >
            <HistoryIcon size={20} />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              /* TODO: Open settings modal */
            }}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Einstellungen"
          >
            <SettingsIcon size={20} />
          </button>

          {/* Logout (only if logged in) */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-red-400"
              title="Ausloggen"
            >
              <LogoutIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Game Mode Indicator */}
      {gameMode && (
        <div className="px-4 py-2 bg-purple-900/30 border-t border-purple-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-300">
              Spielmodus: <strong className="text-white">{gameMode}</strong>
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
