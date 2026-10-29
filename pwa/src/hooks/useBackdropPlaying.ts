/**
 * Tells the background waves that music is playing: sets `data-playing` on
 * <html> while `playing` is true and removes it on pause and unmount. A count
 * keeps two players (e.g. the compact bar and the full turntable during a
 * route change) from clearing each other's signal.
 */
import { useEffect } from 'react'

let active = 0
const listeners = new Set<() => void>()

function sync() {
  const root = document.documentElement
  if (active > 0) root.dataset.playing = '1'
  else delete root.dataset.playing
  for (const fn of listeners) fn()
}

export function isBackdropPlaying(): boolean {
  return active > 0
}

/** Called whenever playing starts or stops; returns the unsubscribe. */
export function subscribeBackdropPlaying(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useBackdropPlaying(playing: boolean) {
  useEffect(() => {
    if (!playing) return
    active += 1
    sync()
    return () => {
      active = Math.max(0, active - 1)
      sync()
    }
  }, [playing])
}
