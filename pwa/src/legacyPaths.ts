/**
 * Until v0.8.1 the app's addresses were German (/neu, /verlauf, /raum/…).
 * Bookmarks, installed apps and shared room links still carry them, so they
 * are mapped to the English path instead of landing on the start page.
 */
export const LEGACY_SEGMENTS: Record<string, string> = {
  neu: 'new',
  spiel: 'game',
  verlauf: 'history',
  statistik: 'stats',
  spieler: 'players',
  erfolge: 'achievements',
  profil: 'settings',
  raum: 'room'
}

/** The English address for an old German one, or null if it is not an old one. */
export function englishPath(pathname: string, search = ''): string | null {
  const m = /^\/([^/]+)(\/.*)?$/.exec(pathname)
  const next = m && LEGACY_SEGMENTS[m[1]]
  if (!next) return null
  const params = new URLSearchParams(search)
  const player = params.get('spieler')
  if (player !== null) {
    params.delete('spieler')
    params.set('player', player)
  }
  const query = params.toString()
  return `/${next}${m[2] ?? ''}${query ? `?${query}` : ''}`
}
