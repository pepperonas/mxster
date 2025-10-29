import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { BackgroundAnimation, BeatSyncConfig } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

// ============================================================================
// Types
// ============================================================================

interface BeatSyncState {
  enabled: boolean
  animationType: BackgroundAnimation
  intensity: number  // 0-100
  currentTrackId: string | null
}

type BeatSyncAction =
  | { type: 'SET_ENABLED'; payload: boolean }
  | { type: 'SET_ANIMATION_TYPE'; payload: BackgroundAnimation }
  | { type: 'SET_INTENSITY'; payload: number }
  | { type: 'SET_CURRENT_TRACK'; payload: string | null }
  | { type: 'LOAD_CONFIG'; payload: BeatSyncConfig }
  | { type: 'RESET_TO_DEFAULTS' }

interface BeatSyncContextValue extends BeatSyncState {
  setEnabled: (enabled: boolean) => void
  setAnimationType: (type: BackgroundAnimation) => void
  setIntensity: (intensity: number) => void
  setCurrentTrack: (trackId: string | null) => void
  loadConfig: (config: BeatSyncConfig) => void
  resetToDefaults: () => void
}

// ============================================================================
// Context
// ============================================================================

const BeatSyncContext = createContext<BeatSyncContextValue | undefined>(undefined)

// ============================================================================
// Initial State & Defaults
// ============================================================================

const DEFAULT_CONFIG: BeatSyncState = {
  enabled: true,
  animationType: 'wave_3d' as BackgroundAnimation,
  intensity: 50,
  currentTrackId: null
}

const initialState: BeatSyncState = { ...DEFAULT_CONFIG }

// ============================================================================
// Reducer
// ============================================================================

function beatSyncReducer(state: BeatSyncState, action: BeatSyncAction): BeatSyncState {
  switch (action.type) {
    case 'SET_ENABLED':
      return { ...state, enabled: action.payload }

    case 'SET_ANIMATION_TYPE':
      return { ...state, animationType: action.payload }

    case 'SET_INTENSITY':
      // Clamp intensity between 0 and 100
      return { ...state, intensity: Math.max(0, Math.min(100, action.payload)) }

    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrackId: action.payload }

    case 'LOAD_CONFIG':
      return {
        ...state,
        enabled: action.payload.enabled,
        animationType: action.payload.animationType,
        intensity: action.payload.intensity
      }

    case 'RESET_TO_DEFAULTS':
      return { ...DEFAULT_CONFIG }

    default:
      return state
  }
}

// ============================================================================
// Provider
// ============================================================================

interface BeatSyncProviderProps {
  children: ReactNode
}

export function BeatSyncProvider({ children }: BeatSyncProviderProps) {
  const [state, dispatch] = useReducer(beatSyncReducer, initialState)

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BEAT_SYNC_CONFIG)
      if (stored) {
        const config: BeatSyncConfig = JSON.parse(stored)
        dispatch({ type: 'LOAD_CONFIG', payload: config })
      }
    } catch (error) {
      console.error('Error loading beat sync config:', error)
    }
  }, [])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    const config: BeatSyncConfig = {
      enabled: state.enabled,
      animationType: state.animationType,
      intensity: state.intensity
    }
    localStorage.setItem(STORAGE_KEYS.BEAT_SYNC_CONFIG, JSON.stringify(config))
  }, [state.enabled, state.animationType, state.intensity])

  const value: BeatSyncContextValue = {
    ...state,
    setEnabled: (enabled) => dispatch({ type: 'SET_ENABLED', payload: enabled }),
    setAnimationType: (type) => dispatch({ type: 'SET_ANIMATION_TYPE', payload: type }),
    setIntensity: (intensity) => dispatch({ type: 'SET_INTENSITY', payload: intensity }),
    setCurrentTrack: (trackId) => dispatch({ type: 'SET_CURRENT_TRACK', payload: trackId }),
    loadConfig: (config) => dispatch({ type: 'LOAD_CONFIG', payload: config }),
    resetToDefaults: () => dispatch({ type: 'RESET_TO_DEFAULTS' })
  }

  return <BeatSyncContext.Provider value={value}>{children}</BeatSyncContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useBeatSync() {
  const context = useContext(BeatSyncContext)
  if (context === undefined) {
    throw new Error('useBeatSync must be used within a BeatSyncProvider')
  }
  return context
}
