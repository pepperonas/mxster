/**
 * A room code as people type it: the same forgiveness as the server
 * (api/rooms.py normalize_code) — case, dashes and spaces ignored, I and L
 * read as 1, O as 0, U as V (Crockford base32 has no I, L, O, U).
 */
export const CODE_LEN = 8
const ALPHABET = /^[0-9A-HJKMNP-TV-Z]+$/

export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
}

/** The normalised code, or null when it cannot be one (length, letters). */
export function roomCodeOrNull(raw: string): string | null {
  const code = normalizeRoomCode(raw)
  return code.length === CODE_LEN && ALPHABET.test(code) ? code : null
}
