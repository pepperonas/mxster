/**
 * Going back without stacking pages.
 *
 * The router keeps an index per history entry (`history.state.idx`). We note
 * which path sits at which index, so a back button can tell whether the page
 * it wants to return to is the entry right behind this one: then it steps back
 * (navigate(-1)) instead of pushing that page once more. Otherwise — reached
 * from a link, a reload, another page — it replaces the current entry with
 * the target, so the history does not grow either.
 *
 * Top-level destinations (the navigation bar) follow the Android pattern:
 * Home stays at the bottom, switching between the others replaces the entry,
 * so back from any of them goes to Home and then out of the app.
 */
const KEY = 'mxtape_nav_stack'

export type Step = { kind: 'back' } | { kind: 'go'; to: string; replace: boolean }

function read(): Record<number, string> {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    return raw && typeof raw === 'object' ? (raw as Record<number, string>) : {}
  } catch {
    return {}
  }
}

/** Remember the path at this history index (called on every location change). */
export function notePath(idx: unknown, pathname: string): void {
  if (typeof idx !== 'number') return
  const map = read()
  map[idx] = pathname
  // Entries above this one are gone once we are here by a new navigation
  for (const k of Object.keys(map)) if (Number(k) > idx + 50) delete map[Number(k)]
  try {
    sessionStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* private mode: back buttons fall back to replacing */
  }
}

export function currentIdx(): number | null {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx
  return typeof idx === 'number' ? idx : null
}

/** What a back button with the target `to` should do. */
export function backStep(to: string, idx: number | null = currentIdx(), map: Record<number, string> = read()): Step {
  if (idx !== null && idx > 0 && map[idx - 1] === to) return { kind: 'back' }
  return { kind: 'go', to, replace: true }
}

/** The navigation bar: Home stays below, the other destinations replace each other. */
export function tabStep(to: string, from: string, topLevel: readonly string[], idx: number | null = currentIdx(), map: Record<number, string> = read()): Step {
  if (to === from) return { kind: 'go', to, replace: true }
  if (to === '/') return backStep('/', idx, map)
  // From Home (or a page below a destination) a new entry; between destinations a swap
  const replace = from !== '/' && topLevel.includes(from)
  return { kind: 'go', to, replace }
}
