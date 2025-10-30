/**
 * ActionBar Component
 * Top navigation bar with logo, actions, and settings
 */

import { useUI, useAuth, useGame, useSettings, useInteraction } from '@/contexts'
import { useGameState } from '@/hooks'
import { SaveIcon, LogoutIcon, DownloadIcon, HistoryIcon, SettingsIcon } from '@/utils/icons'
import { GameHistory } from '@/services'

export function ActionBar() {
  const { toggleSidebar, showModal } = useUI()
  const { isLoggedIn, logout } = useAuth()
  const { gameMode } = useGame()
  const { saveGameState, hasGameState } = useGameState()
  const { settings, updateSettings } = useSettings()
  const { registerInteraction } = useInteraction()

  const handleSave = () => {
    registerInteraction('click', 40)
    const success = saveGameState()
    if (success) {
      // Toast will be shown by useGameState
      console.log('✅ Game state saved')
    }
  }

  const handleLogout = () => {
    registerInteraction('click', 40)
    showModal(
      '⚠️ Ausloggen',
      <div className="text-center py-4">
        <p className="text-lg font-semibold text-white mb-2">Wirklich ausloggen?</p>
        <p className="text-sm text-text-secondary">Dein Spielstand bleibt erhalten.</p>
      </div>,
      [
        {
          label: 'Abbrechen',
          variant: 'secondary',
          onClick: () => {}
        },
        {
          label: 'Ausloggen',
          variant: 'accent',
          onClick: logout
        }
      ]
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b-2 border-accent/30">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-accent/20 rounded-lg transition-colors border border-transparent hover:border-accent/30"
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl font-bold text-gradient hidden sm:block">mxster</h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Save Game (only if game active) */}
          {hasGameState() && (
            <button
              onClick={handleSave}
              className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-gray-300 hover:text-secondary border border-transparent hover:border-accent/30"
              title="Spielstand speichern"
            >
              <SaveIcon size={20} />
            </button>
          )}

          {/* History */}
          <button
            onClick={() => {
              const history = GameHistory.getAll()
              showModal(
                '📊 Spielhistorie',
                <div className="py-4">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      <p className="text-4xl mb-4">🎮</p>
                      <p>Noch keine Spiele gespielt</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {history.map((game, index) => (
                        <div key={index} className="glass p-4 rounded-lg border-2 border-accent/30 hover:border-accent/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gradient">{game.mode === 'guess' ? '🎯 Ratespiel' : game.mode === 'timeline_personal' ? '👤 Persönliche Timeline' : '🌍 Globale Timeline'}</p>
                              <p className="text-sm text-text-secondary">{new Date(game.date).toLocaleString('de-DE')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-secondary">🏆 {game.winner.name}</p>
                              {game.mode === 'guess' && <p className="text-sm text-text-secondary">{game.winner.score} Punkte</p>}
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-accent/20">
                            <p className="text-sm text-text-secondary mb-2">Spieler:</p>
                            <div className="flex flex-wrap gap-2">
                              {game.players.map((player, pIdx) => (
                                <span key={pIdx} className="glass px-3 py-1 rounded-full text-xs border border-accent/20">
                                  {player.name}: {game.mode === 'guess' ? `${player.score} Punkte` : `${player.cards} Karten`}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>,
                [{ label: 'Schließen', variant: 'secondary', onClick: () => {} }]
              )
            }}
            className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-gray-300 hover:text-secondary border border-transparent hover:border-accent/30"
            title="Spielhistorie"
          >
            <HistoryIcon size={20} />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              showModal(
                '⚙️ Einstellungen',
                <div className="py-4">
                  <div className="space-y-6">
                    {/* Random Start Position Setting */}
                    <div className="glass p-4 rounded-lg border-2 border-accent/30 hover:border-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold mb-2 flex items-center gap-2">
                            <span>🎲</span>
                            <span className="text-gradient">Zufällige Startposition</span>
                          </h3>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            Songs starten an einer zufälligen Position statt am Anfang.
                            Es werden mindestens 60 Sekunden Spielzeit garantiert.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={settings.randomStartPosition}
                            onChange={(e) => updateSettings({ randomStartPosition: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                    </div>

                    {/* Future settings can be added here */}
                  </div>
                </div>,
                [{ label: 'Schließen', variant: 'secondary', onClick: () => {} }]
              )
            }}
            className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-gray-300 hover:text-secondary border border-transparent hover:border-accent/30"
            title="Einstellungen"
          >
            <SettingsIcon size={20} />
          </button>

          {/* Logout (only if logged in) */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-300 hover:text-red-400 border border-transparent hover:border-red-500/30"
              title="Ausloggen"
            >
              <LogoutIcon size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
