/**
 * Sidebar Component
 * Side navigation panel with game info, player list, and quick actions
 * Implements 3-state navigation system: Landing / Setup / Playing
 */

import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUI, useGame, useAuth, useInteraction } from '@/contexts'
import { useGameHistory } from '@/hooks'
import { GAME_MODE_INFO } from '@/utils/gameModes'
import { HowToPlayContent } from './HowToPlayContent'
import { getMusicPlayer } from '@/services/MusicPlayerService'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSidebarOpen, toggleSidebar, showModal, closeSidebar } = useUI()
  const { players, currentPlayer, gameMode, gameVariant, isGameStarted, endGame, resetGame, setGameMode, setGameVariant } = useGame()
  const { isLoggedIn } = useAuth()
  const { history } = useGameHistory()
  const { registerInteraction } = useInteraction()

  // Track previous pathname to detect navigation
  const prevPathnameRef = useRef(location.pathname)

  // Close sidebar when navigating TO landing page from another page
  useEffect(() => {
    const prevPath = prevPathnameRef.current
    const currentPath = location.pathname

    // Close sidebar when navigating TO '/' from any other page
    if (currentPath === '/' && prevPath !== '/') {
      closeSidebar()
    }

    prevPathnameRef.current = currentPath
  }, [location.pathname, closeSidebar])

  if (!isSidebarOpen) return null

  // Determine app state based on route and game state
  const isOnLandingPage = location.pathname === '/'
  const isInSetup = ['/mode-selection', '/player-setup'].includes(location.pathname)
  const isInGame = location.pathname === '/game' && isGameStarted

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

  // Unified warning logic for game/setup interruption
  const showNavigationWarning = (
    title: string,
    message: string,
    confirmText: string,
    onConfirm: () => void
  ) => {
    showModal(
      title,
      <div className="text-center py-4">
        <p className="text-lg font-semibold text-white mb-2">{message}</p>
        <p className="text-sm text-text-secondary">Der Spielstand geht verloren.</p>
      </div>,
      [
        {
          text: 'Abbrechen',
          variant: 'secondary',
          onClick: () => {
            console.log('❌ User cancelled navigation')
          }
        },
        {
          text: confirmText,
          variant: 'danger',
          onClick: () => {
            console.log(`✅ User confirmed: ${confirmText}`)
            onConfirm()
          }
        }
      ]
    )
    toggleSidebar()
  }

  // Handle back to menu navigation
  const handleBackToMenu = () => {
    if (isInGame) {
      // Active game - show warning
      showNavigationWarning(
        '⚠️ Spiel beenden?',
        'Möchtest du das Spiel wirklich beenden?',
        'Spiel beenden',
        () => {
          console.log('🛑 Ending game - stopping music and clearing state')

          // Stop music player FIRST
          const musicPlayer = getMusicPlayer()
          musicPlayer.stop()

          // Clear mode/variant BEFORE resetGame to prevent any redirect logic
          setGameMode(null)
          setGameVariant(null)

          // Then reset game and end it
          resetGame()
          endGame()

          // Navigate directly without toggleSidebar (already closed by showNavigationWarning)
          registerInteraction('sidebar', 50)

          // Small delay to ensure state is cleared before navigation
          setTimeout(() => {
            navigate('/', { replace: true })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 50)
        }
      )
    } else if (isInSetup && players.length > 0) {
      // Setup phase with players - show warning
      showNavigationWarning(
        '⚠️ Zurück zum Menü?',
        'Die Spielerkonfiguration geht verloren.',
        'Zurück zum Menü',
        () => {
          // Clear all state
          resetGame()
          setGameMode(null)
          setGameVariant(null)
          // Navigate directly without toggleSidebar (already closed by showNavigationWarning)
          registerInteraction('sidebar', 50)
          navigate('/', { replace: true })
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 100)
        }
      )
    } else {
      // No data to lose - navigate directly
      handleNavigation('/')
    }
  }

  // Helper to scroll to section on landing page (only for landing page state)
  const scrollToSection = (sectionId: string) => {
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
    toggleSidebar()
  }

  // Open How To Play Modal
  const openHowToPlayModal = () => {
    registerInteraction('modal', 60)
    showModal(
      isInGame ? '❓ Hilfe' : '📖 Anleitung',
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
      <aside className="fixed top-0 left-0 bottom-0 w-[90vw] sm:w-80 glass border-r-2 border-accent/30 z-50 flex flex-col">
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

          {/* Navigation - 3-State System */}
          <nav className="p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Navigation</h3>
            <ul className="space-y-1">

              {/* STATE 1: LANDING PAGE */}
              {isOnLandingPage && (
                <>
                  <li>
                    <button
                      onClick={openHowToPlayModal}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      📖 Anleitung
                    </button>
                  </li>
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

              {/* STATE 2: SETUP PHASE */}
              {isInSetup && (
                <>
                  <li>
                    <button
                      onClick={openHowToPlayModal}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      📖 Anleitung
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleBackToMenu}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      🏠 Zurück zum Menü
                    </button>
                  </li>
                </>
              )}

              {/* STATE 3: IN GAME */}
              {isInGame && (
                <>
                  <li>
                    <button
                      onClick={openHowToPlayModal}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/20 text-gray-300 hover:text-secondary transition-colors border border-transparent hover:border-accent/30"
                    >
                      ❓ Hilfe
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleBackToMenu}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30"
                    >
                      🚪 Spiel beenden
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
            <p className="text-sm text-gradient font-medium">Version 0.0.46</p>
          </div>
        </div>
      </aside>
    </>
  )
}
