/**
 * Text Matching Utility with Typo Tolerance
 *
 * Features:
 * - Normalization (lowercase, remove special chars, track suffixes)
 * - Levenshtein distance for typo detection, allowed typos by length
 * - Phonetic normalization (similar-sounding letters)
 * - Equal words (& = and = und, five = 5, 2 = to, u = you) and spaces ignored
 * - The forms an answer may take (without brackets, one artist of a list …)
 */

import type { Song, GuessResult } from '@/types'

/**
 * Remove typical track suffixes like "12 Extended Remix", "Club Mix", etc.
 * Enables matching without complete version information
 */
export function removeTrackSuffixes(text: string): string {
  if (!text) return ''

  const suffixPatterns = [
    // Parentheses/Brackets with remix info (FIRST, before other patterns)
    /\s*[-–—]\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*[-–—]\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,
    /\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,

    // "- 12" Extended Remix" Format
    /\s*[-–—]\s*\d{1,2}["'']?\s+(extended|radio|club|vocal|instrumental|original)\s+(remix|mix|edit|version)?\s*$/i,

    // Complex combinations with dash (e.g. "- Radio Cut", "- Club Mix")
    /\s*[-–—]\s*(radio|club|extended|vocal|instrumental)\s+(cut|mix|version|edit|remix)\s*$/i,

    // Standard suffix with dash
    /\s*[-–—]\s*(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,

    // Suffix without dash (at the end)
    /\s+(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,

    // Year + Remaster
    /\s*[-–—]?\s*\d{4}\s*(remaster|remastered)\s*$/i,
    /\s*[-–—]?\s*(remaster|remastered)\s*\d{4}\s*$/i,

    // Vinyl formats
    /\s*[-–—]?\s*(12|7)["'']?\s*(single|version|mix|edit)?\s*$/i,

    // Album/Single versions
    /\s*[-–—]?\s*(single|album)\s+(version|edit|mix)\s*$/i
  ]

  let cleaned = text
  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned.trim()
}

/**
 * Phonetic normalization for similar-sounding letters/names
 */
function phoneticNormalize(text: string): string {
  if (!text) return ''

  return text
    // Double letters → single letters (Freddy → Fredy, later → Fredi)
    .replace(/([a-z])\1+/gi, '$1')
    // 'y' at the end → 'i' (Freddy → Freddi → Fredi)
    .replace(/y$/gi, 'i')
    .replace(/y\s/gi, 'i ')
    // 'ie' → 'i' (Freddie → Freddi → Fredi)
    .replace(/ie/gi, 'i')
    // 'ph' → 'f' (Philip → Filip)
    .replace(/ph/gi, 'f')
    // 'ck' → 'k' (rock → rok)
    .replace(/ck/gi, 'k')
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove track suffixes ("12 Extended Remix", etc.)
 * - Remove "The" prefix
 * - German special chars (ß → ss)
 * - Remove special chars (', ., ?, !, -, etc.)
 * - Phonetic normalization
 * - Remove multiple spaces
 * - Trim
 */
export function normalizeText(text: string): string {
  if (!text) return ''

  let normalized = text
    .toLowerCase()
    // German special chars BEFORE NFD decomposition
    .replace(/ß/g, 'ss')
    .normalize('NFD') // Decomposes umlauts (ä → a + ¨)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks

  // Remove track suffixes
  normalized = removeTrackSuffixes(normalized)

  // Further normalization
  normalized = normalized
    // Remove "The" at the beginning (Beatles = The Beatles)
    .replace(/^the\s+/i, '')
    .replace(/[''`]/g, '') // Remove apostrophes/backticks
    .replace(/[.,?!;:]/g, '') // Remove punctuation
    .replace(/[\/\\]/g, '') // Remove slashes (AC/DC → ACDC)
    .replace(/[-_]/g, ' ') // Hyphens to spaces
    .replace(/&/g, 'and') // Ampersand to "and"
    .replace(/\s+/g, ' ') // Multiple spaces → single space
    .trim()

  // Phonetic normalization
  normalized = phoneticNormalize(normalized)

  return normalized
}

/**
 * Calculate Levenshtein distance between two strings
 * (Number of character operations to transform a into b)
 *
 * @param a - First string
 * @param b - Second string
 * @returns Distance (0 = identical)
 */
export function levenshteinDistance(a: string, b: string): number {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0)
  if (a === b) return 0

  const matrix: number[][] = []

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitution
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j] + 1 // Deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/** Answer kinds: a title has bracketed parts, an artist can be several people. */
export type AnswerKind = 'title' | 'artist'

/**
 * Words with the same meaning in a guess and an answer, after normalizeText:
 * conjunctions vanish ("Simon & Garfunkel" = "Simon and/und Garfunkel" =
 * "Simon Garfunkel"), number words become digits ("Jackson Five" = "Jackson 5",
 * "Mambo Number 5" = "Mambo No. 5"), and the usual shorthand ("2 U" = "to you").
 */
const TOKEN: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  and: '', und: '', n: '',
  one: '1', eins: '1', ein: '1', two: '2', zwei: '2', to: '2', too: '2', three: '3', drei: '3',
  four: '4', vier: '4', for: '4', five: '5', funf: '5', six: '6', sechs: '6', seven: '7', siben: '7',
  eight: '8', acht: '8', nine: '9', neun: '9', ten: '10', zehn: '10', eleven: '11', elf: '11', twelve: '12', zwolf: '12',
  number: 'no', nummer: 'no', nr: 'no', you: 'u', part: 'pt', teil: 'pt'
})

/** Words of a text in comparable form ("The Jackson 5" → ["jakson", "5"]). */
export function answerWords(text: string): string[] {
  return normalizeText(text)
    .replace(/^(die|der|das)\s+/, '')
    .replace(/[()[\]{}"+*#]/g, ' ')
    .split(' ')
    .map((w) => (Object.prototype.hasOwnProperty.call(TOKEN, w) ? TOKEN[w] : w))
    .filter(Boolean)
}

/** One comparable string: words joined without spaces ("AC DC" = "ACDC", "a-ha" = "aha"). */
export function compact(text: string): string {
  return answerWords(text).join('')
}

/** Spelling the umlauts out: "Grönemeyer" also as "Groenemeyer". */
function spelledOut(text: string): string {
  return text.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
}

/**
 * The forms an answer may be given in, each a whole answer on its own.
 * Title: as it is, without the bracketed part ("Montero"), the bracketed part
 * alone ("Call Me By Your Name"), the parts around a slash, and without a
 * trailing ", Pt. 2". Artist: as it is, every credited artist of a list
 * ("Lady Gaga, Bruno Mars"), and a band without its backing band
 * ("Bill Haley & His Comets" → "Bill Haley").
 */
export function answerVariants(correct: string, kind: AnswerKind = 'title'): string[] {
  const base = removeTrackSuffixes(correct.trim())
  const out = new Set<string>([base])
  if (kind === 'title') {
    const bracket = /[([](.*?)[)\]]/g
    const without = base.replace(bracket, ' ').replace(/\s+/g, ' ').trim()
    if (without) out.add(without)
    for (const m of base.matchAll(bracket)) if (m[1].trim()) out.add(m[1].trim())
    out.add(base.replace(/[()[\]]/g, ' '))
    for (const part of base.split(/\s+\/\s+/)) out.add(part)
    out.add(base.replace(/,?\s*(pt|part|teil)\.?\s*\d+$/i, ''))
  } else {
    // "A, B & C" is a list of people; a comma together with "&" is a band name ("Earth, Wind & Fire")
    if (base.includes(',') && !/&| and | und /i.test(base)) for (const part of base.split(',')) out.add(part)
    else if (base.includes(',')) for (const part of base.split(/,(?![^,]*&)/)) out.add(part)
    const band = /^(.+?)\s+(&|and|und)\s+(the|his|her|their|die|seine|ihre)\s+.+$/i.exec(base)
    if (band) out.add(band[1])
  }
  for (const v of [...out]) if (/[äöüÄÖÜ]/.test(v)) out.add(spelledOut(v))
  return [...out].map((v) => v.trim()).filter((v) => compact(v).length > 0)
}

/**
 * Typos allowed for an answer of this many letters (spaces not counted).
 * Short names must be exact: "ABBA" is not "Aqua", "Mika" is not "M.I.A.", "Blue" is not "Glue".
 */
export function allowedTypos(length: number): number {
  if (length < 5) return 0
  if (length < 12) return 1
  if (length < 18) return 2
  return Math.floor(length * 0.12)
}

/** Two neighbouring letters swapped, nothing else ("tets" for "test"). */
export function isSwap(a: string, b: string): boolean {
  if (a.length !== b.length || a.length < 2) return false
  let i = 0
  while (i < a.length && a[i] === b[i]) i++
  return i < a.length - 1 && a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
}

/** Within the typos allowed for `correct` (both already compact). A short answer only forgives a swap. */
export function closeEnough(guess: string, correct: string, maxErrors?: number): boolean {
  if (!guess || !correct) return false
  if (guess === correct) return true
  if (maxErrors === undefined && correct.length < 5) return correct.length >= 3 && isSwap(guess, correct)
  const allowed = maxErrors ?? allowedTypos(correct.length)
  if (Math.abs(guess.length - correct.length) > allowed) return false
  return levenshteinDistance(guess, correct) <= allowed
}

/**
 * Does the guess name the answer? Any spelling of one of its forms counts
 * (see answerVariants), with a few typos by length (see allowedTypos). A
 * single word out of a longer answer does not count here — whether that is
 * enough depends on the rest of the catalogue (game/answerMatch.ts).
 */
export function fuzzyMatch(guess: string, correct: string, kindOrMaxErrors?: AnswerKind | number): boolean {
  if (!guess || !correct) return false
  const kind = typeof kindOrMaxErrors === 'string' ? kindOrMaxErrors : 'title'
  const maxErrors = typeof kindOrMaxErrors === 'number' ? kindOrMaxErrors : undefined
  const g = compact(guess)
  if (!g) return false
  return answerVariants(correct, kind).some((v) => closeEnough(g, compact(v), maxErrors))
}

/**
 * Check song guess (title + artist)
 *
 * @param guessTitle - Guessed title
 * @param guessArtist - Guessed artist
 * @param song - Song object with title and artist
 * @returns Match results
 */
export function checkSongGuess(
  guessTitle: string,
  guessArtist: string,
  song: Song
): GuessResult {
  const titleMatch = fuzzyMatch(guessTitle, song.title, 'title')
  const artistMatch = fuzzyMatch(guessArtist, song.artist, 'artist')

  return {
    titleMatch,
    artistMatch,
    bothMatch: titleMatch && artistMatch,
    correctCount: (titleMatch ? 1 : 0) + (artistMatch ? 1 : 0)
  }
}

/**
 * Show debug info for text matching (Development Helper)
 */
export function debugMatch(
  guess: string,
  correct: string
): {
  normalized1: string
  normalized2: string
  distance: number
  dynamicMaxErrors: number
} {
  const normalized1 = compact(guess)
  const normalized2 = compact(correct)
  const distance = levenshteinDistance(normalized1, normalized2)
  const dynamicMaxErrors = allowedTypos(normalized2.length)

  return { normalized1, normalized2, distance, dynamicMaxErrors }
}
