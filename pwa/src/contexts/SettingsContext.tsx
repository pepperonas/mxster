/**
 * Settings Context — stored per account on the server (see sync/useSyncedDoc).
 * The theme is additionally mirrored to localStorage so index.html can paint
 * the right colours before React starts.
 */

import { COLOR_SCHEMES, COLOR_SCHEME_IDS, DEFAULT_COLOR_SCHEME, type ColorScheme } from '@/styles/colorSchemes'
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
  /** Colour scheme (accents, tinted surfaces, record), combined with the theme. */
  color: ColorScheme
}

interface SettingsContextType {
  settings: Settings
  /** The settings have loaded from the account. */
  ready: boolean
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
/** Mirrored like the theme, so index.html paints the right colours before React. */
export const COLOR_STORAGE_KEY = 'mxtape_color'

export const defaultSettings: Settings = {
  randomStartPosition: false,
  hideYearsInTimeline: false,
  savedPlayers: [],
  theme: readStoredTheme(),
  recentSongs: [],
  hiddenPlayers: [],
  haptics: true,
  color: readStoredColor()
}

function isColorScheme(v: unknown): v is ColorScheme {
  return typeof v === 'string' && (COLOR_SCHEME_IDS as string[]).includes(v)
}

function readStoredColor(): ColorScheme {
  try {
    const c = localStorage.getItem(COLOR_STORAGE_KEY)
    return isColorScheme(c) ? c : DEFAULT_COLOR_SCHEME
  } catch {
    return DEFAULT_COLOR_SCHEME
  }
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
    haptics: r.haptics !== false,
    color: isColorScheme(r.color) ? r.color : readStoredColor()
  }
}

/** Browser bar colour: the page surface of this scheme and theme (generated with the palettes). */
export function themeColor(color: ColorScheme, theme: ThemeMode): string {
  return COLOR_SCHEMES[color][theme].surface
}

/** Put theme and colour on the document (and mirror them for the pre-paint in index.html). */
export function applyAppearance(theme: ThemeMode, color: ColorScheme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  if (color === DEFAULT_COLOR_SCHEME) delete root.dataset.color
  else root.dataset.color = color
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    localStorage.setItem(COLOR_STORAGE_KEY, color)
  } catch {
    /* private mode */
  }
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = themeColor(color, theme)
  })
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { value: settings, setValue, status } = useSyncedDoc<Settings>('settings', {
    initial: defaultSettings,
    merge: mergeSettings,
    legacyKey: 'mxster_settings',
    fromLegacy: normalizeSettings,
    normalize: normalizeSettings
  })

  useEffect(() => applyAppearance(settings.theme, settings.color), [settings.theme, settings.color])

  useEffect(() => setHapticsEnabled(settings.haptics !== false), [settings.haptics])

  const updateSettings = useCallback((patch: Partial<Settings>) => setValue((prev) => ({ ...prev, ...patch })), [setValue])
  const resetSettings = useCallback(
    () => setValue({ ...defaultSettings, theme: settings.theme, color: settings.color }),
    [setValue, settings.theme, settings.color]
  )

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
    <SettingsContext.Provider value={{ settings, ready: status === 'ready', updateSettings, resetSettings, addPlayer, removePlayer, renamePlayer, hidePlayer, rememberSong: remember }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
