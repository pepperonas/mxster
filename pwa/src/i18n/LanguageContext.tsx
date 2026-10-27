/**
 * Language state for the whole app, outside the sign-in gate so the login,
 * join and legal pages are translated too.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { LANG_STORAGE_KEY, detectLang, getLang, setCurrentLang, type Lang } from './lang'
import type { Catalogue, Messages } from './define'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setState] = useState<Lang>(() => {
    const l = initial ?? detectLang()
    setCurrentLang(l)
    return l
  })
  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      /* private mode: the choice lasts for this visit */
    }
    setState(next)
  }, [])
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang(): LanguageContextValue {
  // Without a provider (isolated component tests) the module language applies
  return useContext(LanguageContext) ?? { lang: getLang(), setLang: setCurrentLang }
}

/** The catalogue's messages in the current language; re-renders on a switch. */
export function useMessages<T extends Messages>(catalogue: Catalogue<T>): T {
  return catalogue[useLang().lang]
}
