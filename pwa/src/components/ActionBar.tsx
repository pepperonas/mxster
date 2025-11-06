/**
 * ActionBar Component
 * Top navigation bar with logo, actions, and settings
 */

import { useUI, useAuth, useGame, useSettings, useInteraction } from '@/contexts'
import { useGameHistory } from '@/hooks'
import { LogoutIcon, HistoryIcon, SettingsIcon, ChartIcon, AchievementIcon } from '@/utils/icons'
import { SettingsDialog } from './SettingsDialog'
import { PlayerStatsDialog } from './PlayerStatsDialog'
import { AchievementsDialog } from './AchievementsDialog'
import { useState } from 'react'

export function ActionBar() {
  const { toggleSidebar, showModal } = useUI()
  const { isLoggedIn, logout } = useAuth()
  const { players, currentPlayer } = useGame()
  const { history } = useGameHistory()
  const { registerInteraction } = useInteraction()
  const [showAchievements, setShowAchievements] = useState(false)

  // Get current player name if in-game
  const currentPlayerName = players.length > 0 && currentPlayer >= 0
    ? players[currentPlayer]?.name
    : undefined

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
          text: 'Abbrechen',
          variant: 'secondary',
          onClick: () => {}
        },
        {
          text: 'Ausloggen',
          variant: 'danger',
          onClick: logout
        }
      ]
    )
  }

  return (
    <>
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
            {/* History */}
            <button
              onClick={() => {
                showModal(
                  '📊 Spielhistorie',
                  <div>
                    {history.length === 0 ? (
                      <div className="text-center py-8 text-text-secondary">
                        <p className="text-4xl mb-4">🎮</p>
                        <p>Noch keine Spiele gespielt</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar py-4">
                        {history.map((game, index) => (
                          <div key={index} className="glass p-4 rounded-lg border-2 border-accent/30 hover:border-accent/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-gradient">{game.gameMode === 'hardcore' ? '🎯 Hardcore' : game.gameMode === 'timeline_personal' ? '👤 Persönliche Timeline' : '🌍 Globale Timeline'}</p>
                                <p className="text-sm text-text-secondary">{new Date(game.date).toLocaleString('de-DE')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-secondary">🏆 {game.winner.name}</p>
                                {game.gameMode === 'hardcore' && <p className="text-sm text-text-secondary">{game.winner.score} Punkte</p>}
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-accent/20">
                              <p className="text-sm text-text-secondary mb-2">Spieler:</p>
                              <div className="flex flex-wrap gap-2">
                                {game.players.map((player, pIdx) => (
                                  <span key={pIdx} className="glass px-3 py-1 rounded-full text-xs border border-accent/20">
                                    {player.name}: {game.gameMode === 'hardcore' ? `${player.score} Punkte` : `${player.cards} Karten`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>,
                  [{ text: 'Schließen', variant: 'secondary', onClick: () => {} }]
                )
              }}
              className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-gray-300 hover:text-secondary border border-transparent hover:border-accent/30"
              title="Spielhistorie"
            >
              <HistoryIcon size={20} />
            </button>

            {/* Player Stats */}
            <button
              onClick={() => {
                showModal(
                  '📈 Spielerstatistiken',
                  <PlayerStatsDialog />,
                  [{ text: 'Schließen', variant: 'secondary', onClick: () => {} }]
                )
              }}
              className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-gray-300 hover:text-secondary border border-transparent hover:border-accent/30"
              title="Spielerstatistiken"
            >
              <ChartIcon size={20} />
            </button>

            {/* Achievements */}
            <button
              onClick={() => setShowAchievements(true)}
              className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-gray-300 hover:text-secondary border border-transparent hover:border-accent/30"
              title="Achievements"
            >
              <AchievementIcon size={20} />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                showModal(
                  '⚙️ Einstellungen',
                  <SettingsDialog />,
                  [{ text: 'Schließen', variant: 'secondary', onClick: () => {} }]
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

      {/* Achievements Dialog - Rendered outside header for proper positioning */}
      <AchievementsDialog
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        playerName={currentPlayerName}
      />
    </>
  )
}
