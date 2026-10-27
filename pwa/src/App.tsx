import { useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
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
import { PlayersScreen, PlayerDetailScreen } from '@/screens/PlayersScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { AdminScreen } from '@/screens/AdminScreen'
import { initRipple } from '@/utils/ripple'
import { MotionProvider } from '@/motion/MotionProvider'
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
  )
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <HomeScreen /> },
          { path: '/neu', element: <SetupScreen /> },
          { path: '/spiel', element: <GameScreen /> },
          { path: '/verlauf', element: <HistoryScreen /> },
          { path: '/verlauf/:id', element: <HistoryDetailScreen /> },
          { path: '/statistik', element: <StatisticsScreen /> },
          { path: '/spieler', element: <PlayersScreen /> },
          { path: '/spieler/:name', element: <PlayerDetailScreen /> },
          { path: '/erfolge', element: <AchievementsScreen /> },
          { path: '/profil', element: <ProfileScreen /> },
          { path: '/admin', element: <AdminScreen /> },
          { path: '*', element: <Navigate to="/" replace /> }
        ]
      }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
