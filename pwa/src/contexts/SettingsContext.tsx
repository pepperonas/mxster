/**
 * Settings Context — stored per account on the server (see sync/useSyncedDoc).
 * The theme is additionally mirrored to localStorage so index.html can paint
 * the right colours before React starts.
 */

import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'
import { useSyncedDoc } from '@/sync/useSyncedDoc'
import { mergeSettings } from '@/sync/merge'
import { RECENT_LIMIT, rememberSong } from '@/game/songPool'
import { setHapticsEnabled } from '@/utils/haptics'

export type ThemeMode = 'dark' | 'light'

export interface Settings {
  randomStartPosition: boolean // Start songs at a random position (with 60s+ remaining)
  hideYearsInTimeline: boolean // Blur years in the timeline so nobody peeks
  savedPlayers: string[] // Names offered as quick picks in the setup
  theme: ThemeMode
  /** Songs played in recent rounds (oldest first) — drawn again only when nothing fresh is left. */
  recentSongs: string[]
  /** People removed in the player management: left out of lists and statistics. */
  hiddenPlayers: string[]
  /** Subtle vibration on phones (placing, verdicts, a win). */
  haptics: boolean
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
  addPlayer: (playerName: string) => void
  removePlayer: (playerName: string) => void
  /** Rename a person in the quick picks (merges with an existing name). */
  renamePlayer: (from: string, to: string) => void
  /** Hide a person from lists and statistics (and drop the quick pick). */
  hidePlayer: (playerName: string) => void
  /** Note a drawn song so later rounds prefer other songs. */
  rememberSong: (key: string) => void
}

export const THEME_STORAGE_KEY = 'mxster_theme'

export const defaultSettings: Settings = {
  randomStartPosition: false,
  hideYearsInTimeline: false,
  savedPlayers: [],
  theme: readStoredTheme(),
  recentSongs: [],
  hiddenPlayers: [],
  haptics: true
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
    theme: r.theme === 'light' ? 'light' : r.theme === 'dark' ? 'dark' : readStoredTheme(),
    recentSongs: Array.isArray(r.recentSongs) ? r.recentSongs.filter((k) => typeof k === 'string').slice(-RECENT_LIMIT) : [],
    hiddenPlayers: Array.isArray(r.hiddenPlayers) ? r.hiddenPlayers.filter((n) => typeof n === 'string') : [],
    haptics: r.haptics !== false
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

  useEffect(() => setHapticsEnabled(settings.haptics !== false), [settings.haptics])

  const updateSettings = useCallback((patch: Partial<Settings>) => setValue((prev) => ({ ...prev, ...patch })), [setValue])
  const resetSettings = useCallback(() => setValue({ ...defaultSettings, theme: settings.theme }), [setValue, settings.theme])

  const addPlayer = useCallback(
    (playerName: string) => {
      const name = playerName.trim()
      if (!name) return
      // Adding someone again brings a hidden person back
      setValue((prev) =>
        prev.savedPlayers.includes(name) && !prev.hiddenPlayers.includes(name)
          ? prev
          : {
              ...prev,
              savedPlayers: prev.savedPlayers.includes(name) ? prev.savedPlayers : [...prev.savedPlayers, name],
              hiddenPlayers: prev.hiddenPlayers.filter((n) => n !== name)
            }
      )
    },
    [setValue]
  )

  const renamePlayer = useCallback(
    (from: string, to: string) =>
      setValue((prev) => ({
        ...prev,
        savedPlayers: [...new Set(prev.savedPlayers.map((n) => (n === from ? to : n)))],
        hiddenPlayers: prev.hiddenPlayers.filter((n) => n !== to && n !== from)
      })),
    [setValue]
  )

  const hidePlayer = useCallback(
    (playerName: string) =>
      setValue((prev) => ({
        ...prev,
        savedPlayers: prev.savedPlayers.filter((n) => n !== playerName),
        hiddenPlayers: prev.hiddenPlayers.includes(playerName) ? prev.hiddenPlayers : [...prev.hiddenPlayers, playerName]
      })),
    [setValue]
  )

  const removePlayer = useCallback(
    (playerName: string) => setValue((prev) => ({ ...prev, savedPlayers: prev.savedPlayers.filter((n) => n !== playerName) })),
    [setValue]
  )

  const remember = useCallback(
    (key: string) => setValue((prev) => ({ ...prev, recentSongs: rememberSong(prev.recentSongs, key) })),
    [setValue]
  )

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, addPlayer, removePlayer, renamePlayer, hidePlayer, rememberSong: remember }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
