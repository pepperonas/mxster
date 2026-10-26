/**
 * Settings Context — stored per account on the server (see sync/useSyncedDoc).
 * The theme is additionally mirrored to localStorage so index.html can paint
 * the right colours before React starts.
 */

import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'
import { useSyncedDoc } from '@/sync/useSyncedDoc'
import { mergeSettings } from '@/sync/merge'

export type ThemeMode = 'dark' | 'light'

export interface Settings {
  randomStartPosition: boolean // Start songs at a random position (with 60s+ remaining)
  hideYearsInTimeline: boolean // Blur years in the timeline so nobody peeks
  savedPlayers: string[] // Names offered as quick picks in the setup
  theme: ThemeMode
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
  addPlayer: (playerName: string) => void
  removePlayer: (playerName: string) => void
}

export const THEME_STORAGE_KEY = 'mxster_theme'

export const defaultSettings: Settings = {
  randomStartPosition: false,
  hideYearsInTimeline: false,
  savedPlayers: [],
  theme: readStoredTheme()
}

function readStoredTheme(): ThemeMode {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY)
    return t === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>
  return {
    randomStartPosition: Boolean(r.randomStartPosition),
    hideYearsInTimeline: Boolean(r.hideYearsInTimeline),
    savedPlayers: Array.isArray(r.savedPlayers) ? r.savedPlayers.filter((n) => typeof n === 'string') : [],
    theme: r.theme === 'light' ? 'light' : r.theme === 'dark' ? 'dark' : readStoredTheme()
  }
}

/** Surface colour per theme, mirrored from design-tokens.css (neutral-6 / neutral-98). */
export const THEME_COLOR: Record<ThemeMode, string> = {
  dark: '#191113',
  light: '#fff8f7'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { value: settings, setValue } = useSyncedDoc<Settings>('settings', {
    initial: defaultSettings,
    merge: mergeSettings,
    legacyKey: 'mxster_settings',
    fromLegacy: normalizeSettings,
    normalize: normalizeSettings
  })

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, settings.theme)
    } catch {
      /* private mode */
    }
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = THEME_COLOR[settings.theme]
    })
  }, [settings.theme])

  const updateSettings = useCallback((patch: Partial<Settings>) => setValue((prev) => ({ ...prev, ...patch })), [setValue])
  const resetSettings = useCallback(() => setValue({ ...defaultSettings, theme: settings.theme }), [setValue, settings.theme])

  const addPlayer = useCallback(
    (playerName: string) => {
      const name = playerName.trim()
      if (!name) return
      setValue((prev) => (prev.savedPlayers.includes(name) ? prev : { ...prev, savedPlayers: [...prev.savedPlayers, name] }))
    },
    [setValue]
  )

  const removePlayer = useCallback(
    (playerName: string) => setValue((prev) => ({ ...prev, savedPlayers: prev.savedPlayers.filter((n) => n !== playerName) })),
    [setValue]
  )

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, addPlayer, removePlayer }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
