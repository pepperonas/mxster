/**
 * Sidebar Component
 * Side navigation panel with game info, player list, and quick actions
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useUI, useGame, useAuth, useInteraction } from '@/contexts'
import { useGameHistory } from '@/hooks'
import { GAME_MODE_INFO } from '@/utils/gameModes'
import { HowToPlayContent } from './HowToPlayContent'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSidebarOpen, toggleSidebar, showModal } = useUI()
  const { players, currentPlayer, gameMode, gameVariant, isGameStarted, endGame, resetGame } = useGame()
  const { isLoggedIn } = useAuth()
  const { history } = useGameHistory()
  const { registerInteraction } = useInteraction()

  if (!isSidebarOpen) return null

  // Determine if user is in game (not on landing page)
  const isInGame = location.pathname !== '/'

  // Helper to navigate and close sidebar
  const handleNavigation = (path: string) => {
    registerInteraction('sidebar', 50)
    navigate(path)
    toggleSidebar()
    // Scroll to top when navigating to home page
    if (path === '/') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }

  // Helper to navigate to home with game end warning
  const handleHomeNavigation = () => {
    // If game is running, show warning
    if (isGameStarted && players.length > 0) {
      showModal(
        '⚠️ Spiel beenden?',
        <div className="space-y-4">
          <p className="text-gray-300">
            Du bist gerade in einem laufenden Spiel. Wenn du zur Startseite zurückkehrst, wird das Spiel beendet.
          </p>
          <div className="glass p-4 border border-accent/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              <strong className="text-white">Hinweis:</strong> Der aktuelle Spielstand wird nicht gespeichert und alle Daten gehen verloren.
            </p>
          </div>
        </div>,
        [
          {
            text: 'Spiel fortsetzen',
            variant: 'secondary',
            onClick: () => {
              // Just close modal, stay in game
              console.log('🎮 User chose to continue game')
            }
          },
          {
            text: 'Spiel beenden & zur Startseite',
            variant: 'danger',
            onClick: () => {
              console.log('🏠 User chose to end game and go home')
              endGame()
              resetGame()
              handleNavigation('/')
            }
          }
        ]
      )
      toggleSidebar()
    } else {
      // No active game, navigate directly
      handleNavigation('/')
    }
  }

  // Helper to scroll to section on landing page
  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    }
    toggleSidebar()
  }

  // Open How To Play Modal
  const openHowToPlayModal = () => {
    registerInteraction('modal', 60)
    showModal(
      '📖 Anleitung',
      <HowToPlayContent />,
      [
        {
          text: 'Verstanden',
          variant: 'primary',
          onClick: () => {}
        }
      ]
    )
    toggleSidebar()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={toggleSidebar}
      />

      {/* Sidebar Panel */}
      <aside className="fixed top-0 left-0 bottom-0 w-80 glass border-r-2 border-accent/30 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-accent/30 flex-shrink-0">
          <h2 className="text-xl font-bold text-gradient">Menu</h2>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-text-secondary hover:text-secondary border border-transparent hover:border-accent/30"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* User Info */}
          <div className="p-4 border-b-2 border-accent/30">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isLoggedIn ? 'bg-green-500' : 'bg-gray-500'}`}
              />
              <div>
                <p className="text-sm text-text-secondary">Spotify Status</p>
                <p className="text-white font-medium">
                  {isLoggedIn ? 'Verbunden' : 'Nicht verbunden'}
                </p>
              </div>
            </div>
          </div>

          {/* Game Info */}
          {gameMode && (
            <div className="p-4 border-b-2 border-accent/30">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Aktuelles Spiel</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{GAME_MODE_INFO[gameMode]?.icon || '🎮'}</span>
                  <div>
                    <p className="text-gradient font-medium">{GAME_MODE_INFO[gameMode]?.name}</p>
                    <p className="text-xs text-text-secondary">
                      {gameVariant === 'physical' ? '📷 Mit QR-Scanner' : '🎲 Virtueller Modus'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Players List */}
          {players.length > 0 && (
            <div className="p-4 border-b-2 border-accent/30">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">
                Spieler ({players.length})
              </h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={index}
                    className={`
                      p-3 rounded-lg border-2 transition-colors glass
                      ${
                        index === currentPlayer
                          ? 'border-accent shadow-glow-accent'
                          : 'border-accent/30 hover:border-accent/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gradient font-medium">{player.name}</span>
                      {index === currentPlayer && (
                        <span className="text-xs glass px-2 py-1 rounded border border-accent/20 text-secondary font-semibold">Aktiv</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-text-secondary">
                      {/* Show points in Guess Mode, cards in Timeline Modes */}
                      {gameMode === 'hardcore' ? (
                        <span>⭐ {player.score} Punkte</span>
                      ) : (
                        <span>🎴 {player.cards} Karten</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Stats */}
          {history.length > 0 && (
            <div className="p-4 border-b-2 border-accent/30">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Statistik</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Gespielte Spiele:</span>
                  <span className="text-gradient font-medium">{history.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Letzter Gewinner:</span>
                  <span className="text-gradient font-medium">
                    {history[0]?.winner.name || 'Unbekannt'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Context-aware */}
          <nav className="p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Navigation</h3>
            <ul className="space-y-1">
              {/* Help/Instructions - always visible */}
              <li>
                <button
                  onClick={openHowToPlayModal}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                >
                  {isInGame ? '❓ Hilfe' : '📖 Anleitung'}
                </button>
              </li>

              {/* Always show home link when in game */}
              {isInGame && (
                <li>
                  <button
                    onClick={handleHomeNavigation}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                  >
                    🏠 Startseite
                  </button>
                </li>
              )}

              {/* Landing page navigation - only show on landing page */}
              {!isInGame && (
                <>
                  <li>
                    <button
                      onClick={() => scrollToSection('game-modes')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      🎮 Spielmodi
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('variants')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      🎴 Spielvarianten
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('downloads')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      📥 Downloads
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('features')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      ✨ Features
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('support')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      💬 Support
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        {/* Version Info - Fixed at bottom */}
        <div className="p-4 border-t-2 border-accent/30 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">mxster</p>
            <p className="text-sm text-gradient font-medium">Version 0.0.22</p>
          </div>
        </div>
      </aside>
    </>
  )
}
