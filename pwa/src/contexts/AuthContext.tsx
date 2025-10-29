import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { SpotifyTokens } from '@/types/spotify'
import { STORAGE_KEYS } from '@/utils/constants'

// ============================================================================
// Types
// ============================================================================

interface AuthState {
  isLoggedIn: boolean
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  tokenType: string
  scope: string
  isLoading: boolean
}

type AuthAction =
  | { type: 'SET_TOKENS'; payload: SpotifyTokens }
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string; expiresAt: number } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }

interface AuthContextValue extends AuthState {
  setTokens: (tokens: SpotifyTokens) => void
  refreshAccessToken: (newAccessToken: string, expiresAt: number) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ============================================================================
// Initial State
// ============================================================================

const initialState: AuthState = {
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  tokenType: 'Bearer',
  scope: '',
  isLoading: true
}

// ============================================================================
// Reducer
// ============================================================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_TOKENS':
      return {
        ...state,
        isLoggedIn: true,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        expiresAt: action.payload.expiresAt,
        tokenType: action.payload.tokenType,
        scope: action.payload.scope,
        isLoading: false
      }

    case 'REFRESH_TOKEN':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        expiresAt: action.payload.expiresAt
      }

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    default:
      return state
  }
}

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load tokens from localStorage on mount
  useEffect(() => {
    const loadTokens = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.SPOTIFY_TOKENS)
        if (stored) {
          const tokens: SpotifyTokens = JSON.parse(stored)

          // Check if token is still valid
          if (tokens.expiresAt > Date.now()) {
            dispatch({ type: 'SET_TOKENS', payload: tokens })
          } else {
            // Token expired, clear it
            localStorage.removeItem(STORAGE_KEYS.SPOTIFY_TOKENS)
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error loading tokens from storage:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadTokens()
  }, [])

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    if (state.isLoggedIn && state.accessToken && state.refreshToken) {
      const tokens: SpotifyTokens = {
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt!,
        tokenType: state.tokenType,
        scope: state.scope
      }
      localStorage.setItem(STORAGE_KEYS.SPOTIFY_TOKENS, JSON.stringify(tokens))
    }
  }, [state.isLoggedIn, state.accessToken, state.refreshToken, state.expiresAt, state.tokenType, state.scope])

  const setTokens = (tokens: SpotifyTokens) => {
    dispatch({ type: 'SET_TOKENS', payload: tokens })
  }

  const refreshAccessToken = (newAccessToken: string, expiresAt: number) => {
    dispatch({ type: 'REFRESH_TOKEN', payload: { accessToken: newAccessToken, expiresAt } })
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.SPOTIFY_TOKENS)
    dispatch({ type: 'LOGOUT' })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const value: AuthContextValue = {
    ...state,
    setTokens,
    refreshAccessToken,
    logout,
    setLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
