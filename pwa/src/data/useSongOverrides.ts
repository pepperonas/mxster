import { useEffect } from 'react'
import { api } from '@/api/client'
import { setSongOverrides, type SongOverride } from './catalogue'

/** Loads the admin's song corrections once per app start (approved accounts only). */
export function useSongOverrides(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    let live = true
    api<{ overrides: Record<string, SongOverride> }>('/api/songs/overrides')
      .then((res) => {
        if (live) setSongOverrides(res.overrides ?? {})
      })
      .catch(() => {
        // Offline or server down: the bundled list is still a good list
      })
    return () => {
      live = false
    }
  }, [enabled])
}
