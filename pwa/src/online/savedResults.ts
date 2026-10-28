/**
 * Which online results this device already put into the account's history.
 * The same result arrives again after every reconnect or reload of the
 * finished-round screen (a new object each time), so object identity is not
 * enough: the key is the room plus the result's content, kept across reloads.
 */
const KEY = 'mxtape_saved_results'
const KEEP = 30

export function resultKey(room: string, result: unknown): string {
  const text = JSON.stringify(result) ?? ''
  // FNV-1a: short and stable; collisions only matter within one room
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return `${room}:${(h >>> 0).toString(36)}:${text.length}`
}

function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function wasSaved(key: string): boolean {
  return read().includes(key)
}

export function markSaved(key: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...read().filter((k) => k !== key), key].slice(-KEEP)))
  } catch {
    /* private mode: the in-memory guard still holds for this visit */
  }
}
