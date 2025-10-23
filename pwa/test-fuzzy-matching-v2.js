#!/usr/bin/env node

/**
 * Test für erweitertes Fuzzy Matching v2.0
 *
 * Neue Features:
 * - Phonetische Ähnlichkeit (Freddie = Freddy)
 * - Abkürzungen (AC/DC = ACDC)
 * - "The" Präfix (The Beatles = Beatles)
 * - Deutsche Sonderzeichen (ß = ss)
 * - Track-Suffixe ignorieren (12" Extended Remix, Club Mix, etc.)
 */

import { normalizeText, fuzzyMatch, checkSongGuess, removeTrackSuffixes } from './src/utils/textMatcher.js'

console.log('🧪 Testing Enhanced Fuzzy Matching v2.0\n')

const tests = [
  // ========== Phonetische Ähnlichkeit ==========
  {
    category: '🎵 Phonetische Ähnlichkeit',
    tests: [
      { guess: 'Freddy Mercury', correct: 'Freddie Mercury', shouldMatch: true },
      { guess: 'Freddie Mercury', correct: 'Freddy Mercury', shouldMatch: true },
      { guess: 'Philip Collins', correct: 'Phil Collins', shouldMatch: true },
      { guess: 'Eric', correct: 'Erik', shouldMatch: true },
    ]
  },

  // ========== Abkürzungen & Slashes ==========
  {
    category: '🎸 Abkürzungen & Slashes',
    tests: [
      { guess: 'ACDC', correct: 'AC/DC', shouldMatch: true },
      { guess: 'AC/DC', correct: 'ACDC', shouldMatch: true },
      { guess: 'AC DC', correct: 'AC/DC', shouldMatch: true },
      { guess: 'nwa', correct: 'N.W.A.', shouldMatch: true },
    ]
  },

  // ========== "The" Präfix ==========
  {
    category: '🎤 "The" Präfix',
    tests: [
      { guess: 'Beatles', correct: 'The Beatles', shouldMatch: true },
      { guess: 'The Beatles', correct: 'Beatles', shouldMatch: true },
      { guess: 'Rolling Stones', correct: 'The Rolling Stones', shouldMatch: true },
      { guess: 'The Who', correct: 'Who', shouldMatch: true },
    ]
  },

  // ========== Deutsche Sonderzeichen ==========
  {
    category: '🇩🇪 Deutsche Sonderzeichen',
    tests: [
      { guess: 'Straße', correct: 'Strasse', shouldMatch: true },
      { guess: 'Strasse', correct: 'Straße', shouldMatch: true },
      { guess: 'Größenwahn', correct: 'Grossenwahn', shouldMatch: true },
      { guess: 'Füße', correct: 'Fuesse', shouldMatch: true },
    ]
  },

  // ========== Track-Suffixe (wichtigster Test!) ==========
  {
    category: '🎧 Track-Suffixe (Remix, Extended, etc.)',
    tests: [
      // 12" Extended Remix
      { guess: 'Like a Prayer', correct: 'Like a Prayer - 12" Extended Remix', shouldMatch: true },
      { guess: 'Like a Prayer 12 Extended Remix', correct: 'Like a Prayer', shouldMatch: true },

      // Club Mix
      { guess: 'Drop the Pressure', correct: 'Drop the Pressure - Club Mix', shouldMatch: true },
      { guess: 'Drop the Pressure Club Mix', correct: 'Drop the Pressure', shouldMatch: true },

      // Radio Cut
      { guess: 'Totoish', correct: 'Totoish - Radio Cut', shouldMatch: true },

      // Verschiedene Formate
      { guess: 'Song Name', correct: 'Song Name (Extended Version)', shouldMatch: true },
      { guess: 'Song Name', correct: 'Song Name [Club Mix]', shouldMatch: true },
      { guess: 'Song Name', correct: 'Song Name - Remix', shouldMatch: true },
      { guess: 'Song Name', correct: 'Song Name 2024 Remastered', shouldMatch: true },

      // Real-world Beispiele aus der songs.json
      { guess: 'Totoish', correct: 'Totoish - Radio Cut', shouldMatch: true },
      { guess: 'Like a Prayer', correct: 'Like a Prayer - 12" Extended Remix', shouldMatch: true },
    ]
  },

  // ========== Kombinationen ==========
  {
    category: '🔥 Kombination mehrerer Features',
    tests: [
      // Phonetisch + The
      { guess: 'Beetles', correct: 'The Beatles', shouldMatch: true },

      // AC/DC + Remix Suffix
      { guess: 'ACDC', correct: 'AC/DC - Live Version', shouldMatch: true },

      // ß + The
      { guess: 'Straße', correct: 'The Strasse', shouldMatch: true },

      // Alles zusammen
      { guess: 'Freddy and the beatles grosse strasse',
        correct: 'Freddie & The Beatles - Große Straße (Extended Mix)',
        shouldMatch: true },
    ]
  }
]

// Run Tests
let totalTests = 0
let passedTests = 0
let failedTests = 0

for (const testGroup of tests) {
  console.log(`\n${testGroup.category}`)
  console.log('='.repeat(60))

  for (const test of testGroup.tests) {
    totalTests++

    const result = fuzzyMatch(test.guess, test.correct, 3)
    const passed = result === test.shouldMatch

    if (passed) {
      passedTests++
      console.log(`✅ "${test.guess}" ${test.shouldMatch ? '=' : '≠'} "${test.correct}"`)
    } else {
      failedTests++
      console.log(`❌ "${test.guess}" ${test.shouldMatch ? '=' : '≠'} "${test.correct}"`)
      console.log(`   Expected: ${test.shouldMatch}, Got: ${result}`)
      console.log(`   Normalized Guess: "${normalizeText(test.guess)}"`)
      console.log(`   Normalized Correct: "${normalizeText(test.correct)}"`)
    }
  }
}

// ========== Suffix Removal Test (einzeln) ==========
console.log('\n\n📝 Track Suffix Removal Tests')
console.log('='.repeat(60))

const suffixTests = [
  'Like a Prayer - 12" Extended Remix',
  'Drop the Pressure - Club Mix',
  'Totoish - Radio Cut',
  'Song Name (Extended Version)',
  'Song Name [Club Mix]',
  'Song Name - Remix',
  'Song Name 2024 Remastered',
  'Bohemian Rhapsody',  // Sollte unverändert bleiben
]

for (const title of suffixTests) {
  const cleaned = removeTrackSuffixes(title)
  const changed = cleaned !== title
  console.log(`${changed ? '🔧' : '  '} "${title}"`)
  if (changed) {
    console.log(`   → "${cleaned}"`)
  }
}

// Final Summary
console.log('\n\n' + '='.repeat(60))
console.log('📊 Test Summary')
console.log('='.repeat(60))
console.log(`Total Tests: ${totalTests}`)
console.log(`✅ Passed: ${passedTests}`)
console.log(`❌ Failed: ${failedTests}`)
console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`)

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!')
  process.exit(0)
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed`)
  process.exit(1)
}
