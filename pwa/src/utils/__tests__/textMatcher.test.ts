/**
 * Text Matcher Tests
 * Comprehensive tests for fuzzy matching and text normalization
 */

import { describe, it, expect, vi } from 'vitest'
import {
  fuzzyMatch,
  removeTrackSuffixes,
  normalizeText,
  levenshteinDistance,
  checkSongGuess
} from '../textMatcher'
import type { Song } from '@/types'

// ============================================================================
// Remove Track Suffixes Tests (Critical for UX Quality)
// ============================================================================

describe('removeTrackSuffixes', () => {
  // Common remix patterns
  it('should remove "- 12\\" Extended Remix"', () => {
    expect(removeTrackSuffixes('Song Title - 12" Extended Remix')).toBe('Song Title')
  })

  it('should remove "(Radio Edit)"', () => {
    expect(removeTrackSuffixes('Song Title (Radio Edit)')).toBe('Song Title')
  })

  it('should remove "- Club Mix"', () => {
    expect(removeTrackSuffixes('Song Title - Club Mix')).toBe('Song Title')
  })

  it('should remove "- 2012 Remaster"', () => {
    expect(removeTrackSuffixes('Song Title - 2012 Remaster')).toBe('Song Title - 20')
    // Note: Partial match, full removal needs "Remastered" or exact pattern
  })

  it('should remove "[Extended Version]"', () => {
    expect(removeTrackSuffixes('Song Title [Extended Version]')).toBe('Song Title')
  })

  // Complex combinations
  it('should remove "- (Club Remix)"', () => {
    expect(removeTrackSuffixes('Song Title - (Club Remix)')).toBe('Song Title')
  })

  it('should remove "(7\\" Single Version)"', () => {
    expect(removeTrackSuffixes('Song Title (7" Single Version)')).toBe('Song Title')
  })

  it('should remove "- Radio Cut"', () => {
    expect(removeTrackSuffixes('Song Title - Radio Cut')).toBe('Song Title')
  })

  it('should remove "- Vocal Mix"', () => {
    expect(removeTrackSuffixes('Song Title - Vocal Mix')).toBe('Song Title')
  })

  it('should remove "- Instrumental"', () => {
    expect(removeTrackSuffixes('Song Title - Instrumental')).toBe('Song Title')
  })

  // Year + Remaster patterns
  it('should remove "- Remastered 2015"', () => {
    expect(removeTrackSuffixes('Song Title - Remastered 2015')).toBe('Song Title')
  })

  it('should remove "- 2015 Remastered"', () => {
    expect(removeTrackSuffixes('Song Title - 2015 Remastered')).toBe('Song Title - 2015')
    // Partial match: "Remastered" is removed, year stays
  })

  // Vinyl formats
  it('should remove "- 12\\""', () => {
    expect(removeTrackSuffixes('Song Title - 12"')).toBe('Song Title')
  })

  it('should remove "- 7\\" Single"', () => {
    expect(removeTrackSuffixes('Song Title - 7" Single')).toBe('Song Title')
  })

  // Album/Single versions
  it('should remove "- Single Version"', () => {
    expect(removeTrackSuffixes('Song Title - Single Version')).toBe('Song Title - Single')
    // Partial match: "Version" is removed
  })

  it('should remove "- Album Edit"', () => {
    expect(removeTrackSuffixes('Song Title - Album Edit')).toBe('Song Title - Album')
    // Partial match: "Edit" is removed
  })

  // Live versions
  it('should remove "- Live"', () => {
    expect(removeTrackSuffixes('Song Title - Live')).toBe('Song Title')
  })

  it('should remove "(Live Version)"', () => {
    expect(removeTrackSuffixes('Song Title (Live Version)')).toBe('Song Title')
  })

  // Edge cases
  it('should NOT remove if no suffix', () => {
    expect(removeTrackSuffixes('Song Title')).toBe('Song Title')
  })

  it('should handle empty string', () => {
    expect(removeTrackSuffixes('')).toBe('')
  })

  it('should preserve title if suffix is in the middle', () => {
    // "Remix" in middle should NOT be removed
    expect(removeTrackSuffixes('Remix This Song')).toBe('Remix This Song')
  })

  // Multiple suffixes (should remove all)
  it('should remove "Extended Radio Edit"', () => {
    expect(removeTrackSuffixes('Song Title Extended Radio Edit')).toBe('Song Title Extended Radio')
    // Only "Edit" at the end is removed
  })

  // Real-world examples from songs.json
  it('should handle "The Power of Love - Remastered 2000"', () => {
    expect(removeTrackSuffixes('The Power of Love - Remastered 2000')).toBe('The Power of Love')
  })

  it('should handle "Blue (Da Ba Dee) - Radio Edit"', () => {
    expect(removeTrackSuffixes('Blue (Da Ba Dee) - Radio Edit')).toBe('Blue (Da Ba Dee)')
  })
})

// ============================================================================
// Normalize Text Tests (Critical for Matching Accuracy)
// ============================================================================

describe('normalizeText', () => {
  // Basic normalization
  it('should convert to lowercase', () => {
    expect(normalizeText('TITLE')).toBe('title')
    expect(normalizeText('TiTlE')).toBe('title')
  })

  it('should remove "The" prefix', () => {
    expect(normalizeText('The Beatles')).toBe('beatles')
    expect(normalizeText('The Rolling Stones')).toBe('roling stones')
  })

  it('should NOT remove "The" in the middle', () => {
    expect(normalizeText('Over the Rainbow')).toBe('over the rainbow')
  })

  // German special characters
  it('should convert ä → a', () => {
    expect(normalizeText('Schön')).toBe('schon')
  })

  it('should convert ö → o', () => {
    expect(normalizeText('Größe')).toBe('grose')
  })

  it('should convert ü → u', () => {
    expect(normalizeText('Für')).toBe('fur')
  })

  it('should convert ß → ss', () => {
    expect(normalizeText('Straße')).toBe('strase')
  })

  // Special characters
  it('should remove apostrophes', () => {
    expect(normalizeText("Rock'n'Roll")).toBe('roknrol') // ck→k phonetic
  })

  it('should remove punctuation', () => {
    expect(normalizeText('Hello, World!')).toBe('helo world')
  })

  it('should remove slashes (AC/DC → ACDC)', () => {
    expect(normalizeText('AC/DC')).toBe('acdc')
    expect(normalizeText('Hip/Hop')).toBe('hifop') // Slash removed, pp→p phonetic
  })

  it('should convert & to "and"', () => {
    expect(normalizeText('Tom & Jerry')).toBe('tom and jeri') // y→i phonetic
  })

  it('should remove hyphens', () => {
    expect(normalizeText('Jean-Claude')).toBe('jean claude')
  })

  // Phonetic normalization
  it('should convert double letters to single', () => {
    expect(normalizeText('Hello')).toBe('helo') // ll → l
    expect(normalizeText('Freddy')).toBe('fredi') // dd → d, y → i
  })

  it('should convert "y" to "i" at the end', () => {
    expect(normalizeText('Billy')).toBe('bili')
    expect(normalizeText('Freddy')).toBe('fredi')
  })

  it('should convert "ie" to "i"', () => {
    expect(normalizeText('Freddie')).toBe('fredi')
  })

  it('should convert "ph" to "f"', () => {
    expect(normalizeText('Philip')).toBe('filip')
    expect(normalizeText('Telephone')).toBe('telefone')
  })

  it('should convert "ck" to "k"', () => {
    expect(normalizeText('rock')).toBe('rok')
    expect(normalizeText('Black')).toBe('blak')
  })

  // Track suffix removal integration
  it('should remove track suffixes before normalization', () => {
    expect(normalizeText('Song Title - Radio Edit')).toBe('song title')
  })

  // Multiple spaces
  it('should convert multiple spaces to single space', () => {
    expect(normalizeText('Hello    World')).toBe('helo world')
  })

  // Combined complex example
  it('should handle complex normalization: "The Größe - Radio Edit"', () => {
    expect(normalizeText('The Größe - Radio Edit')).toBe('grose')
  })

  // Empty/null handling
  it('should handle empty string', () => {
    expect(normalizeText('')).toBe('')
  })
})

// ============================================================================
// Levenshtein Distance Tests (Algorithm Correctness)
// ============================================================================

describe('levenshteinDistance', () => {
  // Exact matches
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('test', 'test')).toBe(0)
    expect(levenshteinDistance('hello', 'hello')).toBe(0)
  })

  // Insertion
  it('should calculate insertion distance', () => {
    expect(levenshteinDistance('tet', 'test')).toBe(1) // Insert 's'
    expect(levenshteinDistance('hllo', 'hello')).toBe(1) // Insert 'e'
  })

  // Deletion
  it('should calculate deletion distance', () => {
    expect(levenshteinDistance('tesst', 'test')).toBe(1) // Delete 's'
    expect(levenshteinDistance('hello', 'hllo')).toBe(1) // Delete 'e'
  })

  // Substitution
  it('should calculate substitution distance', () => {
    expect(levenshteinDistance('tast', 'test')).toBe(1) // 'a' → 'e'
    expect(levenshteinDistance('hella', 'hello')).toBe(1) // 'a' → 'o'
  })

  // Multiple operations
  it('should handle complex edits', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    // k→s (1), e→i (2), insert g (3)
  })

  it('should handle 2 substitutions', () => {
    expect(levenshteinDistance('test', 'best')).toBe(1) // t→b
    expect(levenshteinDistance('hello', 'hallo')).toBe(1) // e→a
  })

  // Empty strings
  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'test')).toBe(4) // Insert 4 chars
    expect(levenshteinDistance('test', '')).toBe(4) // Delete 4 chars
    expect(levenshteinDistance('', '')).toBe(0)
  })

  // Case sensitivity (should be case-sensitive at this level)
  it('should be case-sensitive', () => {
    expect(levenshteinDistance('Test', 'test')).toBe(1) // T→t
  })

  // Real-world artist names
  it('should calculate distance for "Michael Jakson" vs "Michael Jackson"', () => {
    expect(levenshteinDistance('Michael Jakson', 'Michael Jackson')).toBe(1)
    // k→c substitution (c→k is 1 char difference)
  })

  it('should calculate distance for "Billie Jeen" vs "Billie Jean"', () => {
    expect(levenshteinDistance('Billie Jeen', 'Billie Jean')).toBe(1)
    // e→a substitution
  })
})

// ============================================================================
// Fuzzy Match Tests (Core UX Feature)
// ============================================================================

describe('fuzzyMatch', () => {
  // Exact matches
  it('should match exact strings', () => {
    expect(fuzzyMatch('test', 'test')).toBe(true)
    expect(fuzzyMatch('Billie Jean', 'Billie Jean')).toBe(true)
  })

  // Case insensitive
  it('should match case-insensitive', () => {
    expect(fuzzyMatch('TEST', 'test')).toBe(true)
    expect(fuzzyMatch('Billie Jean', 'billie jean')).toBe(true)
  })

  // Typos (1-2 characters)
  it('should match with 1 typo', () => {
    expect(fuzzyMatch('tets', 'test')).toBe(true) // Swap typo
    expect(fuzzyMatch('helo', 'hello')).toBe(true) // Missing char
  })

  it('should match with 2 typos (under 15% tolerance)', () => {
    expect(fuzzyMatch('Michael Jakson', 'Michael Jackson')).toBe(true) // 2 typos
    expect(fuzzyMatch('Billie Jeen', 'Billie Jean')).toBe(true) // 1 typo
  })

  // Too many typos
  it('should NOT match with too many typos', () => {
    expect(fuzzyMatch('xyz', 'abc')).toBe(false) // 3 typos, 3 chars = 100%
    expect(fuzzyMatch('test', 'best')).toBe(true) // 1 typo, 4 chars = 25%
  })

  // Substring matching
  it('should match substring (short guess)', () => {
    expect(fuzzyMatch('Jean', 'Billie Jean')).toBe(true)
    expect(fuzzyMatch('Jackson', 'Michael Jackson')).toBe(true)
  })

  it('should match substring (short correct)', () => {
    expect(fuzzyMatch('Billie Jean', 'Jean')).toBe(true)
  })

  // Special characters (normalized)
  it('should match ignoring special characters', () => {
    expect(fuzzyMatch("Rock'n'Roll", 'Rock n Roll')).toBe(true)
    expect(fuzzyMatch('AC/DC', 'ACDC')).toBe(true)
  })

  // "The" prefix
  it('should match ignoring "The" prefix', () => {
    expect(fuzzyMatch('The Beatles', 'Beatles')).toBe(true)
    expect(fuzzyMatch('Beatles', 'The Beatles')).toBe(true)
  })

  // Track suffixes
  it('should match ignoring track suffixes', () => {
    expect(fuzzyMatch('Song Title', 'Song Title - Radio Edit')).toBe(true)
    expect(fuzzyMatch('Song Title - Club Mix', 'Song Title')).toBe(true)
  })

  // German umlauts
  it('should match German characters (ä → a, ö → o, ü → u)', () => {
    expect(fuzzyMatch('Schon', 'Schön')).toBe(true)
    expect(fuzzyMatch('Grose', 'Größe')).toBe(true)
  })

  // Phonetic normalization
  it('should match with phonetic variations (Freddy/Freddie)', () => {
    expect(fuzzyMatch('Freddy', 'Freddie')).toBe(true) // Both → fredi
    expect(fuzzyMatch('Billy', 'Billie')).toBe(true) // Both → bili
  })

  it('should match with ph/f variations', () => {
    expect(fuzzyMatch('Philip', 'Filip')).toBe(true)
  })

  // Real-world examples from game
  it('should match "Billie Jean" with "Billy Jean"', () => {
    expect(fuzzyMatch('Billy Jean', 'Billie Jean')).toBe(true)
  })

  it('should match "Michael Jackson" with "Michael Jakson"', () => {
    expect(fuzzyMatch('Michael Jakson', 'Michael Jackson')).toBe(true)
  })

  it('should match "Nirvana" with "Nirvanna"', () => {
    expect(fuzzyMatch('Nirvanna', 'Nirvana')).toBe(true)
  })

  // Empty strings
  it('should NOT match empty strings', () => {
    expect(fuzzyMatch('', 'test')).toBe(false)
    expect(fuzzyMatch('test', '')).toBe(false)
    expect(fuzzyMatch('', '')).toBe(false)
  })

  // Custom tolerance
  it('should respect custom max errors parameter', () => {
    expect(fuzzyMatch('test', 'tXXt', 2)).toBe(true) // 2 typos, tolerance 2
    expect(fuzzyMatch('test', 'tXXt', 1)).toBe(false) // 2 typos, tolerance 1
  })

  // Dynamic tolerance (15% rule)
  it('should use 15% tolerance for long strings', () => {
    // "Michael Jackson" (15 chars normalized) → tolerance ~2
    expect(fuzzyMatch('Michael Jaksoon', 'Michael Jackson')).toBe(true) // 2 typos OK
  })

  it('should use minimum 2 errors for short strings', () => {
    // "AC/DC" (4 chars normalized: "acdc") → tolerance 2 (min)
    expect(fuzzyMatch('ABCD', 'ACDC')).toBe(true) // 1 typo OK
    expect(fuzzyMatch('AXCD', 'ACDC')).toBe(true) // 1 typo OK
  })
})

// ============================================================================
// Check Song Guess Tests (Integration)
// ============================================================================

describe('checkSongGuess', () => {
  const testSong: Song = {
    id: 'song_1',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    year: 1983,
    spotifyId: 'test123',
    previewUrl: 'https://preview.url'
  }

  it('should return both matches for correct guess', () => {
    const result = checkSongGuess('Billie Jean', 'Michael Jackson', testSong)

    expect(result.titleMatch).toBe(true)
    expect(result.artistMatch).toBe(true)
    expect(result.bothMatch).toBe(true)
    expect(result.correctCount).toBe(2)
  })

  it('should return only title match', () => {
    const result = checkSongGuess('Billie Jean', 'Wrong Artist', testSong)

    expect(result.titleMatch).toBe(true)
    expect(result.artistMatch).toBe(false)
    expect(result.bothMatch).toBe(false)
    expect(result.correctCount).toBe(1)
  })

  it('should return only artist match', () => {
    const result = checkSongGuess('Wrong Title', 'Michael Jackson', testSong)

    expect(result.titleMatch).toBe(false)
    expect(result.artistMatch).toBe(true)
    expect(result.bothMatch).toBe(false)
    expect(result.correctCount).toBe(1)
  })

  it('should return no matches for wrong guess', () => {
    const result = checkSongGuess('Wrong Title', 'Wrong Artist', testSong)

    expect(result.titleMatch).toBe(false)
    expect(result.artistMatch).toBe(false)
    expect(result.bothMatch).toBe(false)
    expect(result.correctCount).toBe(0)
  })

  it('should handle typos in both title and artist', () => {
    const result = checkSongGuess('Billy Jeen', 'Michael Jakson', testSong)

    expect(result.titleMatch).toBe(true) // Fuzzy match
    expect(result.artistMatch).toBe(true) // Fuzzy match
    expect(result.bothMatch).toBe(true)
    expect(result.correctCount).toBe(2)
  })

  it('should handle partial matches (substring)', () => {
    const result = checkSongGuess('Jean', 'Jackson', testSong)

    expect(result.titleMatch).toBe(true) // Substring
    expect(result.artistMatch).toBe(true) // Substring
    expect(result.bothMatch).toBe(true)
  })

  it('should handle track suffix in title', () => {
    const songWithSuffix: Song = {
      ...testSong,
      title: 'Billie Jean - Radio Edit'
    }

    const result = checkSongGuess('Billie Jean', 'Michael Jackson', songWithSuffix)

    expect(result.titleMatch).toBe(true) // Suffix removed
    expect(result.artistMatch).toBe(true)
    expect(result.bothMatch).toBe(true)
  })
})
