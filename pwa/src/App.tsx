import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom'
import { AppProviders, useInteraction, useGame, useUI } from '@/contexts'
import { Modal, Toast, ActionBar, Sidebar, AchievementUnlockAnimation, CookieBanner } from '@/components'
import { ParticleBackground } from '@/components/game'
import {
  LandingPage,
  ModeSelection,
  VariantSelection,
  PlayerSetup,
  GameScreen,
  CallbackScreen
} from '@/screens'
import { useTokenRefresh } from '@/hooks/useTokenRefresh'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { initRipple } from '@/utils/ripple'
import { useEffect, useRef } from 'react'
import './styles/design-tokens.css'
import './styles/tailwind.css'
import './styles/motion.css'
import './styles/beatAnimations.css'

function AppContent() {
  // Background Token Refresh Service
  useTokenRefresh()

  // M3 ripple (delegated, progressive enhancement)
  useEffect(() => { initRipple() }, [])

  // Get interaction state for background animation
  const { activityLevel, pulseIntensity } = useInteraction()

  // Page Refresh Check
  const navigate = useAppNavigate()
  const location = useLocation()
  const { players, isGameStarted, endGame, resetGame, gameMode } = useGame()
  const { showModal } = useUI()
  const hasShownRefreshWarning = useRef(false)

  // Prevent page refresh/close during active game (beforeunload event)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning if game is active
      if (isGameStarted && players.length > 0) {
        console.log('⚠️ Attempting to leave page during active game')

        // Standard way to trigger browser's confirmation dialog
        e.preventDefault()
        e.returnValue = '' // Chrome requires returnValue to be set

        // Some browsers show this message, others show generic message
        return 'Du bist gerade in einem laufenden Spiel. Wenn du die Seite verlässt, wird das Spiel beendet und alle Daten gehen verloren.'
      }
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isGameStarted, players.length])

  // Check for running game on page load (if user confirmed refresh despite warning)
  useEffect(() => {
    // Only check once on initial mount (not on subsequent updates)
    if (hasShownRefreshWarning.current) return

    // Small delay to ensure all contexts are loaded
    const timer = setTimeout(() => {
      // Check if game is running and user is not on landing page
      const isInGame = location.pathname !== '/'

      if (isGameStarted && players.length > 0 && isInGame) {
        hasShownRefreshWarning.current = true

        console.log('🔄 Page refresh detected during active game')

        // Show the same warning modal as in Sidebar
        showModal(
          '⚠️ Spiel beendet',
          <div className="space-y-4">
            <p className="text-gray-300">
              Die Seite wurde während eines laufenden Spiels neu geladen. Das Spiel wurde beendet.
            </p>
            <div className="glass p-4 border border-accent/30 rounded-lg">
              <p className="text-sm text-text-secondary">
                <strong className="text-white">Hinweis:</strong> Der Spielstand wurde nicht gespeichert und alle Daten sind verloren gegangen.
              </p>
            </div>
          </div>,
          [
            {
              text: 'Verstanden',
              variant: 'primary',
              onClick: () => {
                console.log('🏠 User acknowledged game was lost')
                endGame()
                resetGame()
                navigate('/', { replace: true })
              }
            }
          ]
        )
      }
    }, 100)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty array intentional: run ONLY on mount, not on updates

  return (
    <>
      {/* 3D Particle Background - Activity-reactive */}
      <ParticleBackground
        isPlaying={true}
        beatIntensity={pulseIntensity}
        activityLevel={activityLevel}
        isHardcoreMode={gameMode === 'hardcore'}
      />

      {/* Layout Components */}
      <ActionBar />
      <Sidebar />

      {/* Modal & Toast (rendered via Portal) */}
      <Modal />
      <Toast />
      <AchievementUnlockAnimation />
      <CookieBanner />

      {/* Main Content - active route */}
      <Outlet />
    </>
  )
}

/**
 * Data router (createBrowserRouter) is required for the View Transitions
 * integration: `navigate(to, { viewTransition: true })` is a no-op under the
 * declarative <BrowserRouter>. AppContent acts as the layout route.
 */
const router = createBrowserRouter([
  {
    element: (
      <AppProviders>
        <AppContent />
      </AppProviders>
    ),
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/mode-selection', element: <ModeSelection /> },
      { path: '/variant-selection', element: <VariantSelection /> },
      { path: '/player-setup', element: <PlayerSetup /> },
      { path: '/game', element: <GameScreen /> },
      { path: '/callback', element: <CallbackScreen /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
