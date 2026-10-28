import { ReactNode } from 'react'
import { GameProvider } from './GameContext'
import { UIProvider } from './UIContext'
import { SettingsProvider } from './SettingsContext'
import { AchievementNotificationProvider } from './AchievementNotificationContext'
import { AchievementProvider } from './AchievementContext'
import { GameHistoryProvider } from './GameHistoryContext'
import { AchievementBackfill } from '@/components/AchievementBackfill'

/**
 * Providers for the signed-in, approved app. Settings, history and
 * achievements load from the account on the server, so this tree only mounts
 * behind the AuthGate.
 *
 * Order: Settings → UI → History → Notifications → Achievements (needs both) → Game.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <UIProvider>
        <GameHistoryProvider>
          <AchievementNotificationProvider>
            <AchievementProvider>
              <AchievementBackfill />
              <GameProvider>{children}</GameProvider>
            </AchievementProvider>
          </AchievementNotificationProvider>
        </GameHistoryProvider>
      </UIProvider>
    </SettingsProvider>
  )
}
