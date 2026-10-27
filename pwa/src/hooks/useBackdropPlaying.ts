/**
 * Tells the background record that music is playing: sets `data-playing` on
 * <html> while `playing` is true and removes it on pause and unmount. A count
 * keeps two players (e.g. the compact bar and the full turntable during a
 * route change) from clearing each other's signal.
 */
import { useEffect } from 'react'

let active = 0

function sync() {
  const root = document.documentElement
  if (active > 0) root.dataset.playing = '1'
  else delete root.dataset.playing
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
