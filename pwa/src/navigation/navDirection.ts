/**
 * Which way a page change goes, so the route transition can say it.
 *
 * M3 transition patterns: between destinations of the navigation bar a
 * fade-through (no spatial relation), into a page below a destination a
 * shared X axis (forward slides in from the right, back returns from the
 * left), and into or out of a full-screen page (round, room, legal pages) a
 * shared Y axis. The kind lands on <html data-nav> right when the location
 * changes — inside the View Transition's update callback, before its
 * animations start — so browser back is covered too, not only our buttons.
 */
import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export type NavKind = 'tab' | 'forward' | 'back' | 'up' | 'down' | 'none'

/** The pages of the navigation bar's destinations (tabs included), plus the settings (shell/AppShell TOP_LEVEL). */
export const TOP_LEVEL_PATHS = ['/', '/history', '/stats', '/songs', '/achievements', '/players', '/friends', '/settings']

const FULL_SCREEN = [/^\/game$/, /^\/room\//, /^\/r\//, /^\/imprint$/, /^\/privacy$/, /^\/terms$/, /^\/about$/]

const isTop = (p: string) => TOP_LEVEL_PATHS.includes(p)
const isFull = (p: string) => FULL_SCREEN.some((re) => re.test(p))
const trim = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p)

export function navKind(fromPath: string, toPath: string): NavKind {
  const from = trim(fromPath)
  const to = trim(toPath)
  if (from === to) return 'none'
  const fullFrom = isFull(from)
  const fullTo = isFull(to)
  if (fullTo && !fullFrom) return 'up'
  if (fullFrom && !fullTo) return 'down'
  if (fullFrom && fullTo) return 'tab'
  if (isTop(from) && isTop(to)) return 'tab'
  if (to.startsWith(from === '/' ? '/' : from + '/')) return 'forward'
  if (from.startsWith(to === '/' ? '/' : to + '/')) return 'back'
  if (isTop(from)) return 'forward'
  if (isTop(to)) return 'back'
  // Siblings below a destination (one round to another): onwards
  return 'forward'
}

/** Mounted once in the router root. */
export function useNavDirection(): void {
  const { pathname } = useLocation()
  const prev = useRef<string | null>(null)
  useLayoutEffect(() => {
    const from = prev.current
    prev.current = pathname
    if (from === null) return
    document.documentElement.dataset.nav = navKind(from, pathname)
  }, [pathname])
}
