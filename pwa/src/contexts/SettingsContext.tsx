/**
 * Settings Context
 * Global application settings with localStorage persistence
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Settings {
  randomStartPosition: boolean // Start songs at random position (with 60s+ remaining)
  hideYearsInTimeline: boolean // Blur years in timeline to prevent cheating
  savedPlayers: string[] // List of saved player names
  // Future settings can be added here
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
  addPlayer: (playerName: string) => void
  removePlayer: (playerName: string) => void
}

const defaultSettings: Settings = {
  randomStartPosition: false,
  hideYearsInTimeline: false,
  savedPlayers: []
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem('mxster_settings')
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) }
      } catch (error) {
        console.error('Failed to parse settings:', error)
        return defaultSettings
      }
    }
    return defaultSettings
  })

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('mxster_settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const addPlayer = (playerName: string) => {
    if (!playerName.trim()) return
    if (settings.savedPlayers.includes(playerName.trim())) return

    setSettings((prev) => ({
      ...prev,
      savedPlayers: [...prev.savedPlayers, playerName.trim()]
    }))
  }

  const removePlayer = (playerName: string) => {
    setSettings((prev) => ({
      ...prev,
      savedPlayers: prev.savedPlayers.filter((name) => name !== playerName)
    }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, addPlayer, removePlayer }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
