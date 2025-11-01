import React, { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { GameProvider } from './GameContext'
import { UIProvider } from './UIContext'
import { SettingsProvider } from './SettingsContext'
import { InteractionProvider } from './InteractionContext'
import { AchievementNotificationProvider } from './AchievementNotificationContext'
import { AchievementProvider } from './AchievementContext'

/**
 * Combined Providers Component
 * Wraps the entire app with all necessary context providers
 *
 * Provider Order:
 * 1. SettingsProvider - Application settings (independent)
 * 2. AuthProvider - Authentication state (needed by all other providers)
 * 3. UIProvider - UI state (modals, toasts, sidebar)
 * 4. InteractionProvider - User interaction tracking (for background animations)
 * 5. AchievementNotificationProvider - Achievement notification queue (needed by AchievementProvider)
 * 6. AchievementProvider - Achievement tracking (depends on AchievementNotificationProvider)
 * 7. GameProvider - Game state (depends on Auth for Spotify integration)
 */

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <UIProvider>
          <InteractionProvider>
            <AchievementNotificationProvider>
              <AchievementProvider>
                <GameProvider>
                  {children}
                </GameProvider>
              </AchievementProvider>
            </AchievementNotificationProvider>
          </InteractionProvider>
        </UIProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}
