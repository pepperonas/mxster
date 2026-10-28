/**
 * "Neu" on the achievements page: what was unlocked since this device last
 * showed that person's achievements. Per device (localStorage), per person.
 * A person never looked at before marks nothing — a first visit would
 * otherwise call every old achievement new.
 */
import type { Achievement } from '@/types/achievements'

export const SEEN_KEY = 'mxtape_achievements_seen'

function read(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}')
    return raw && typeof raw === 'object' ? (raw as Record<string, number>) : {}
  } catch {
    return {}
  }
}

/** When this device last showed the person's achievements (null = never). */
export function lastSeen(person: string): number | null {
  const at = read()[person]
  return typeof at === 'number' ? at : null
}

export function markSeen(person: string, now = Date.now()): void {
  const map = read()
  map[person] = now
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map))
  } catch {
    /* private mode: nothing is new next time either */
  }
}

export function isNew(a: Achievement, seenAt: number | null): boolean {
  return seenAt !== null && a.unlocked && typeof a.unlockedAt === 'number' && a.unlockedAt > seenAt
}
