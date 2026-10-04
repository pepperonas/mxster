import { useSyncExternalStore } from 'react'

/** Live media query match (re-renders on change). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener?.('change', onChange)
      return () => mq.removeEventListener?.('change', onChange)
    },
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    () => false
  )
}

/** Phone-sized layout (M3 compact window class). */
export const COMPACT_QUERY = '(max-width: 639px)'
