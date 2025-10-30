/**
 * InteractionContext
 * Tracks user interactions globally to control background animation intensity
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'

export type ActivityLevel = 'idle' | 'calm' | 'active' | 'intense'

export type InteractionType =
  | 'click'           // Button clicks, general clicks
  | 'modal'           // Modal open/close
  | 'sidebar'         // Sidebar toggle
  | 'route'           // Route changes
  | 'game'            // Game events
  | 'input'           // Text input
  | 'scroll'          // Scroll events
  | 'hover'           // Hover events

interface InteractionState {
  activityLevel: ActivityLevel
  pulseIntensity: number
  lastInteraction: number
  interactionCount: number
}

interface InteractionContextValue extends InteractionState {
  registerInteraction: (type: InteractionType, intensity?: number) => void
  setActivityLevel: (level: ActivityLevel) => void
  triggerPulse: (intensity: number) => void
}

const InteractionContext = createContext<InteractionContextValue | undefined>(undefined)

interface InteractionProviderProps {
  children: ReactNode
}

// Interaction intensity mapping
const INTERACTION_INTENSITIES: Record<InteractionType, number> = {
  click: 40,
  modal: 60,
  sidebar: 50,
  route: 55,
  game: 70,
  input: 25,
  scroll: 10,
  hover: 15
}

// Decay configuration
const IDLE_TIMEOUT = 60000 // 60s to idle
const CALM_TIMEOUT = 30000 // 30s to calm
const ACTIVITY_DECAY_INTERVAL = 1000 // Check every second

export function InteractionProvider({ children }: InteractionProviderProps) {
  const [state, setState] = useState<InteractionState>({
    activityLevel: 'calm',
    pulseIntensity: 0,
    lastInteraction: Date.now(),
    interactionCount: 0
  })

  const decayTimerRef = useRef<number | null>(null)
  const pulseDecayRef = useRef<number | null>(null)

  // Auto-decay pulse intensity
  useEffect(() => {
    if (state.pulseIntensity > 0) {
      pulseDecayRef.current = window.setTimeout(() => {
        setState(prev => ({
          ...prev,
          pulseIntensity: Math.max(0, prev.pulseIntensity - 10)
        }))
      }, 50) // Decay pulse quickly (50ms steps)
    }

    return () => {
      if (pulseDecayRef.current) {
        clearTimeout(pulseDecayRef.current)
      }
    }
  }, [state.pulseIntensity])

  // Auto-decay activity level based on inactivity
  useEffect(() => {
    const checkActivity = () => {
      const now = Date.now()
      const timeSinceLastInteraction = now - state.lastInteraction

      if (timeSinceLastInteraction > IDLE_TIMEOUT && state.activityLevel !== 'idle') {
        setState(prev => ({
          ...prev,
          activityLevel: 'idle',
          interactionCount: 0
        }))
        console.log('🌙 Activity level: IDLE (60s inactivity)')
      } else if (timeSinceLastInteraction > CALM_TIMEOUT && state.activityLevel === 'active') {
        setState(prev => ({
          ...prev,
          activityLevel: 'calm',
          interactionCount: Math.max(0, prev.interactionCount - 5)
        }))
        console.log('😌 Activity level: CALM (30s inactivity)')
      }
    }

    decayTimerRef.current = window.setInterval(checkActivity, ACTIVITY_DECAY_INTERVAL)

    return () => {
      if (decayTimerRef.current) {
        clearInterval(decayTimerRef.current)
      }
    }
  }, [state.lastInteraction, state.activityLevel])

  const registerInteraction = useCallback((type: InteractionType, intensity?: number) => {
    const interactionIntensity = intensity ?? INTERACTION_INTENSITIES[type]
    const now = Date.now()

    setState(prev => {
      const newCount = prev.interactionCount + 1
      let newLevel: ActivityLevel = prev.activityLevel

      // Determine activity level based on interaction count and type
      if (type === 'game' || newCount > 20) {
        newLevel = 'intense'
      } else if (newCount > 10 || type === 'route' || type === 'modal') {
        newLevel = 'active'
      } else if (newCount > 3) {
        newLevel = 'active'
      } else {
        newLevel = 'calm'
      }

      console.log(`🎮 Interaction: ${type} (intensity: ${interactionIntensity}, level: ${newLevel}, count: ${newCount})`)

      return {
        activityLevel: newLevel,
        pulseIntensity: Math.min(100, interactionIntensity),
        lastInteraction: now,
        interactionCount: newCount
      }
    })
  }, [])

  const setActivityLevel = useCallback((level: ActivityLevel) => {
    setState(prev => ({
      ...prev,
      activityLevel: level,
      lastInteraction: Date.now()
    }))
    console.log(`🎯 Activity level set to: ${level}`)
  }, [])

  const triggerPulse = useCallback((intensity: number) => {
    setState(prev => ({
      ...prev,
      pulseIntensity: Math.min(100, intensity),
      lastInteraction: Date.now()
    }))
  }, [])

  const value: InteractionContextValue = {
    ...state,
    registerInteraction,
    setActivityLevel,
    triggerPulse
  }

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  )
}

export function useInteraction() {
  const context = useContext(InteractionContext)
  if (context === undefined) {
    throw new Error('useInteraction must be used within an InteractionProvider')
  }
  return context
}
