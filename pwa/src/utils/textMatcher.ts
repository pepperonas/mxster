/**
 * Text Matching Utility with Typo Tolerance
 *
 * Features:
 * - Normalization (lowercase, remove special chars, track suffixes)
 * - Levenshtein distance for typo detection
 * - Configurable tolerance (default: 3 typos)
 * - Phonetic normalization (similar-sounding letters)
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

/**
 * Check if two texts "match" (within tolerance)
 *
 * @param guess - Guessed text
 * @param correct - Correct text
 * @param maxErrors - Maximum allowed typos (optional - defaults to 15% of text length, min 2)
 * @returns true if match
 */
export function fuzzyMatch(guess: string, correct: string, maxErrors?: number): boolean {
  if (!guess || !correct) return false

  // Normalize both texts
  const normalizedGuess = normalizeText(guess)
  const normalizedCorrect = normalizeText(correct)

  // Calculate dynamic max errors if not provided
  if (maxErrors === undefined) {
    // Use 15% of the longer normalized text as tolerance (minimum 2 errors)
    const longerLength = Math.max(normalizedGuess.length, normalizedCorrect.length)
    maxErrors = Math.max(2, Math.floor(longerLength * 0.15))

    console.log(`🔍 Dynamic fuzzy matching: "${normalizedGuess}" vs "${normalizedCorrect}"`)
    console.log(`   Length: ${longerLength} chars → Tolerance: ${maxErrors} errors`)
  }

  // Exact match after normalization
  if (normalizedGuess === normalizedCorrect) {
    return true
  }

  // Substring match (one text contains the other)
  // ONLY if the guess is at least 50% of the correct text length (minimum 5 chars)
  const minSubstringLength = Math.max(5, Math.ceil(normalizedCorrect.length * 0.5))
  if (normalizedGuess.length >= minSubstringLength) {
    if (
      normalizedCorrect.includes(normalizedGuess) ||
      normalizedGuess.includes(normalizedCorrect)
    ) {
      console.log(`   ✅ Substring match (guess length: ${normalizedGuess.length} >= min: ${minSubstringLength})`)
      return true
    }
  }

  // Levenshtein distance check
  const distance = levenshteinDistance(normalizedGuess, normalizedCorrect)
  const isMatch = distance <= maxErrors

  if (maxErrors !== 3) { // Only log when using dynamic tolerance
    console.log(`   Distance: ${distance}, Max: ${maxErrors} → ${isMatch ? '✅ Match' : '❌ No match'}`)
  }

  return isMatch
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
  const titleMatch = fuzzyMatch(guessTitle, song.title)
  const artistMatch = fuzzyMatch(guessArtist, song.artist)

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
  const normalized1 = normalizeText(guess)
  const normalized2 = normalizeText(correct)
  const distance = levenshteinDistance(normalized1, normalized2)

  // Calculate dynamic max errors
  const longerLength = Math.max(normalized1.length, normalized2.length)
  const dynamicMaxErrors = Math.max(2, Math.floor(longerLength * 0.15))

  console.log('🔍 Text Match Debug:')
  console.log('  Original Guess:', guess)
  console.log('  Original Correct:', correct)
  console.log('  Normalized Guess:', normalized1)
  console.log('  Normalized Correct:', normalized2)
  console.log('  Levenshtein Distance:', distance)
  console.log('  Dynamic Max Errors (15%):', dynamicMaxErrors)
  console.log('  Match (dynamic):', fuzzyMatch(guess, correct))

  return { normalized1, normalized2, distance, dynamicMaxErrors }
}
