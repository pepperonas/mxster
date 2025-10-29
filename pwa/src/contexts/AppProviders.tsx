import React, { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { GameProvider } from './GameContext'
import { UIProvider } from './UIContext'
import { BeatSyncProvider } from './BeatSyncContext'

/**
 * Combined Providers Component
 * Wraps the entire app with all necessary context providers
 *
 * Provider Order:
 * 1. AuthProvider - Authentication state (needed by all other providers)
 * 2. BeatSyncProvider - Beat sync configuration (independent)
 * 3. UIProvider - UI state (modals, toasts, sidebar)
 * 4. GameProvider - Game state (depends on Auth for Spotify integration)
 */

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <BeatSyncProvider>
        <UIProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </UIProvider>
      </BeatSyncProvider>
    </AuthProvider>
  )
}
