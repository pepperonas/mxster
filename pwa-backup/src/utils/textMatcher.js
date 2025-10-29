/**
 * Text Matching Utility mit Tippfehler-Toleranz
 *
 * Features:
 * - Normalisierung (Lowercase, Sonderzeichen entfernen)
 * - Levenshtein-Distanz für Tippfehler-Erkennung
 * - Konfigurierbare Toleranz (Standard: 3 Tippfehler)
 */

/**
 * Entfernt typische Track-Suffixe wie "12 Extended Remix", "Club Mix", etc.
 * Dies ermöglicht Matching auch ohne vollständige Version-Angabe
 */
export function removeTrackSuffixes(text) {
  if (!text) return ''

  const suffixPatterns = [
    // Klammern/Brackets mit Remix-Info (ZUERST, bevor andere Patterns)
    /\s*[-–—]\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*[-–—]\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,
    /\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,

    // "- 12" Extended Remix" Format (spezifisch für diese Schreibweise)
    /\s*[-–—]\s*\d{1,2}["'']?\s+(extended|radio|club|vocal|instrumental|original)\s+(remix|mix|edit|version)?\s*$/i,

    // Komplexe Kombinationen mit Bindestrich (z.B. "- Radio Cut", "- Club Mix")
    /\s*[-–—]\s*(radio|club|extended|vocal|instrumental)\s+(cut|mix|version|edit|remix)\s*$/i,

    // Standard Suffix mit Bindestrich
    /\s*[-–—]\s*(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,

    // Suffix ohne Bindestrich (am Ende)
    /\s+(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,

    // Jahr + Remaster
    /\s*[-–—]?\s*\d{4}\s*(remaster|remastered)\s*$/i,
    /\s*[-–—]?\s*(remaster|remastered)\s*\d{4}\s*$/i,

    // Vinyl-Formate
    /\s*[-–—]?\s*(12|7)["'']?\s*(single|version|mix|edit)?\s*$/i,

    // Album/Single Versionen
    /\s*[-–—]?\s*(single|album)\s+(version|edit|mix)\s*$/i,
  ]

  let cleaned = text
  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned.trim()
}

/**
 * Phonetische Normalisierung für ähnlich klingende Buchstaben/Namen
 */
function phoneticNormalize(text) {
  if (!text) return ''

  return text
    // Doppelbuchstaben → Einzelbuchstaben (Freddy → Fredy, später → Fredi)
    .replace(/([a-z])\1+/gi, '$1')
    // 'y' am Ende → 'i' (Freddy → Freddi → Fredi)
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
 * Normalisiert einen Text für Vergleich
 * - Lowercase
 * - Entfernt Track-Suffixe ("12 Extended Remix", etc.)
 * - Entfernt "The" Präfix
 * - Deutsche Sonderzeichen (ß → ss)
 * - Entfernt Sonderzeichen (', ., ?, !, -, etc.)
 * - Phonetische Normalisierung
 * - Entfernt mehrfache Leerzeichen
 * - Trimmt
 */
export function normalizeText(text) {
  if (!text) return ''

  let normalized = text
    .toLowerCase()
    // Deutsche Sonderzeichen VORHER (vor NFD decomposition)
    .replace(/ß/g, 'ss')
    .normalize('NFD')  // Dekomponiert Umlaute (ä → a + ¨)
    .replace(/[\u0300-\u036f]/g, '')  // Entfernt diakritische Zeichen

  // Entferne Track-Suffixe
  normalized = removeTrackSuffixes(normalized)

  // Weitere Normalisierung
  normalized = normalized
    // Entferne "The" am Anfang (Beatles = The Beatles)
    .replace(/^the\s+/i, '')
    .replace(/[''`]/g, '')  // Entfernt Apostrophe/Backticks
    .replace(/[.,?!;:]/g, '')  // Entfernt Interpunktion
    .replace(/[\/\\]/g, '')  // Entfernt Slashes (AC/DC → ACDC)
    .replace(/[-_]/g, ' ')  // Bindestriche zu Leerzeichen
    .replace(/&/g, 'and')  // Ampersand zu "and"
    .replace(/\s+/g, ' ')  // Mehrfache Leerzeichen → einzelnes
    .trim()

  // Phonetische Normalisierung
  normalized = phoneticNormalize(normalized)

  return normalized
}

/**
 * Berechnet Levenshtein-Distanz zwischen zwei Strings
 * (Anzahl der Zeichen-Operationen um von a nach b zu kommen)
 *
 * @param {string} a - Erster String
 * @param {string} b - Zweiter String
 * @returns {number} - Distanz (0 = identisch)
 */
export function levenshteinDistance(a, b) {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0)
  if (a === b) return 0

  const matrix = []

  // Initialisiere erste Spalte
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Initialisiere erste Zeile
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fülle Matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // Substitution
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j] + 1       // Deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Prüft ob zwei Texte "match" (innerhalb der Toleranz)
 *
 * @param {string} guess - Geraten Text
 * @param {string} correct - Korrekter Text
 * @param {number} maxErrors - Maximale erlaubte Tippfehler (default: 3)
 * @returns {boolean} - true wenn Match
 */
export function fuzzyMatch(guess, correct, maxErrors = 3) {
  if (!guess || !correct) return false

  // Normalisiere beide Texte
  const normalizedGuess = normalizeText(guess)
  const normalizedCorrect = normalizeText(correct)

  // Exakter Match nach Normalisierung
  if (normalizedGuess === normalizedCorrect) {
    return true
  }

  // Substring-Match (ein Text enthält den anderen)
  if (normalizedCorrect.includes(normalizedGuess) ||
      normalizedGuess.includes(normalizedCorrect)) {
    return true
  }

  // Levenshtein-Distanz Check
  const distance = levenshteinDistance(normalizedGuess, normalizedCorrect)
  return distance <= maxErrors
}

/**
 * Prüft Song-Guess (Titel + Artist)
 *
 * @param {string} guessTitle - Geratener Titel
 * @param {string} guessArtist - Geratener Artist
 * @param {Object} song - Song-Objekt mit title und artist
 * @param {number} maxErrors - Maximale Tippfehler pro Feld (default: 3)
 * @returns {Object} - { titleMatch: boolean, artistMatch: boolean, bothMatch: boolean }
 */
export function checkSongGuess(guessTitle, guessArtist, song, maxErrors = 3) {
  const titleMatch = fuzzyMatch(guessTitle, song.title, maxErrors)
  const artistMatch = fuzzyMatch(guessArtist, song.artist, maxErrors)

  return {
    titleMatch,
    artistMatch,
    bothMatch: titleMatch && artistMatch
  }
}

/**
 * Zeigt Debug-Info für Text-Matching (Development Helper)
 */
export function debugMatch(guess, correct) {
  const normalized1 = normalizeText(guess)
  const normalized2 = normalizeText(correct)
  const distance = levenshteinDistance(normalized1, normalized2)

  console.log('🔍 Text Match Debug:')
  console.log('  Original Guess:', guess)
  console.log('  Original Correct:', correct)
  console.log('  Normalized Guess:', normalized1)
  console.log('  Normalized Correct:', normalized2)
  console.log('  Levenshtein Distance:', distance)
  console.log('  Match (3 errors):', fuzzyMatch(guess, correct, 3))

  return { normalized1, normalized2, distance }
}
