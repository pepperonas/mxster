import { useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom'
import { AppProviders } from '@/contexts'
import { Modal, Toast, AchievementUnlockAnimation } from '@/components'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthGate } from '@/auth/AuthGate'
import { AppShell } from '@/shell/AppShell'
import { HomeScreen } from '@/screens/HomeScreen'
import { SetupScreen } from '@/screens/SetupScreen'
import { GameScreen } from '@/screens/GameScreen'
import { HistoryScreen, HistoryDetailScreen } from '@/screens/HistoryScreen'
import { AchievementsScreen } from '@/screens/AchievementsScreen'
import { StatisticsScreen } from '@/screens/StatisticsScreen'
import { DailyScreen } from '@/screens/DailyScreen'
import { PlayersScreen, PlayerDetailScreen } from '@/screens/PlayersScreen'
import { JoinScreen } from '@/screens/JoinScreen'
import { RoomScreen } from '@/screens/RoomScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { AdminScreen } from '@/screens/AdminScreen'
import { initRipple } from '@/utils/ripple'
import { englishPath, LEGACY_SEGMENTS } from '@/legacyPaths'
import { MotionProvider } from '@/motion/MotionProvider'
import { LegalScreen } from '@/legal/LegalScreen'
import { LanguageProvider } from '@/i18n'
import { Backdrop } from '@/components/ui/Backdrop'
import './styles/design-tokens.css'
import './styles/tailwind.css'
import './styles/motion.css'

/**
 * Root layout: sign-in gate around everything, then the providers that load
 * the account's data, then the shell. Data router (createBrowserRouter) is
 * required for `navigate(to, { viewTransition: true })`.
 */
function Root() {
  useEffect(() => initRipple(), [])

  // The OAuth callback lands on "/?login_error=…" — keep the address clean.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('login_error')) {
      url.searchParams.delete('login_error')
      window.history.replaceState(window.history.state, '', url.pathname + url.search)
    }
  }, [])

  return (
    <LanguageProvider>
    <Backdrop />
    <MotionProvider>
      <AuthProvider>
        <AuthGate>
          <AppProviders>
            <Outlet />
            <Modal />
            <Toast />
            <AchievementUnlockAnimation />
          </AppProviders>
        </AuthGate>
      </AuthProvider>
    </MotionProvider>
    </LanguageProvider>
  )
}

/** An old German address (bookmark, installed app, shared link) → its English one. */
function LegacyRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={englishPath(pathname, search) ?? '/'} replace />
}

const legacyRoutes = (inShell: boolean) =>
  Object.keys(LEGACY_SEGMENTS)
    .filter((old) => (old === 'raum') !== inShell)
    .map((old) => ({ path: `/${old}/*`, element: <LegacyRedirect /> }))

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        // Room links: full screen, also for guests without an account
        path: '/r/:code',
        element: <JoinScreen />
      },
      { path: '/room/:code', element: <RoomScreen /> },
      // Legal pages: full screen, readable without an account
      { path: '/imprint', element: <LegalScreen kind="imprint" /> },
      { path: '/privacy', element: <LegalScreen kind="privacy" /> },
      { path: '/terms', element: <LegalScreen kind="terms" /> },
      ...legacyRoutes(false),
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <HomeScreen /> },
          { path: '/new', element: <SetupScreen /> },
          { path: '/game', element: <GameScreen /> },
          { path: '/history', element: <HistoryScreen /> },
          { path: '/history/:id', element: <HistoryDetailScreen /> },
          { path: '/stats', element: <StatisticsScreen /> },
          { path: '/daily', element: <DailyScreen /> },
          { path: '/players', element: <PlayersScreen /> },
          { path: '/players/:name', element: <PlayerDetailScreen /> },
          { path: '/achievements', element: <AchievementsScreen /> },
          { path: '/profile', element: <ProfileScreen /> },
          { path: '/admin', element: <AdminScreen /> },
          ...legacyRoutes(true),
          { path: '*', element: <Navigate to="/" replace /> }
        ]
      }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
