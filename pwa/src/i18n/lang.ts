/**
 * The app's language: German or English.
 *
 * Detected from the browser (navigator.languages: the first German or English
 * entry wins, anything else falls back to English) until the person picks one;
 * the pick is remembered per device in localStorage.
 *
 * `getLang()` is for code outside React (rule modules, formatters). Components
 * read the language through `useLang()` / `useMessages()` so they re-render.
 */
export type Lang = 'de' | 'en'

export const LANGS: Lang[] = ['de', 'en']
export const LANG_STORAGE_KEY = 'mxtape_lang'

export function storedLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY)
    return v === 'de' || v === 'en' ? v : null
  } catch {
    return null
  }
}

/** The browser's preference: the first German or English entry, else English. */
export function browserLang(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]): Lang {
  for (const l of languages) {
    const base = l.toLowerCase().split('-')[0]
    if (base === 'de' || base === 'en') return base
  }
  return 'en'
}

export const detectLang = (): Lang => storedLang() ?? browserLang()

let current: Lang = detectLang()

export const getLang = (): Lang => current

export function setCurrentLang(lang: Lang) {
  current = lang
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

/** BCP 47 locale for Intl formatters. */
export const localeOf = (lang: Lang = current) => (lang === 'de' ? 'de-DE' : 'en-GB')
