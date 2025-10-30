import React, { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { GameProvider } from './GameContext'
import { UIProvider } from './UIContext'
import { BeatSyncProvider } from './BeatSyncContext'
import { SettingsProvider } from './SettingsContext'
import { InteractionProvider } from './InteractionContext'

/**
 * Combined Providers Component
 * Wraps the entire app with all necessary context providers
 *
 * Provider Order:
 * 1. SettingsProvider - Application settings (independent)
 * 2. AuthProvider - Authentication state (needed by all other providers)
 * 3. BeatSyncProvider - Beat sync configuration (independent)
 * 4. UIProvider - UI state (modals, toasts, sidebar)
 * 5. InteractionProvider - User interaction tracking (for background animations)
 * 6. GameProvider - Game state (depends on Auth for Spotify integration)
 */

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BeatSyncProvider>
          <UIProvider>
            <InteractionProvider>
              <GameProvider>
                {children}
              </GameProvider>
            </InteractionProvider>
          </UIProvider>
        </BeatSyncProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}
