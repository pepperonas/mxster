import type { CSSProperties } from 'react'

/**
 * A View Transition name for a shared element keyed by free text (a player's
 * name). view-transition-name must be a CSS identifier, and names hold
 * spaces, umlauts and the like — so the key is hashed (FNV-1a, base 36).
 * The same key gives the same name on every page, different keys collide
 * only by chance (32 bit), and a collision only skips the morph.
 */
export function vtName(prefix: string, key: string): string {
  let h = 0x811c9dc5
  for (const ch of key) {
    h ^= ch.codePointAt(0)!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `${prefix}-${h.toString(36)}`
}

/**
 * Inline style for a shared element: its name plus the class `shared`, which
 * motion.css times on the spatial spring. (React's CSS types do not know
 * view-transition-class yet.)
 */
export function sharedElement(name: string): CSSProperties {
  return { viewTransitionName: name, viewTransitionClass: 'shared' } as CSSProperties
}
