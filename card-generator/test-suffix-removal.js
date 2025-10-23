#!/usr/bin/env node

/**
 * Test script for removeTrackSuffixes function
 */

function removeTrackSuffixes(text) {
  if (!text) return '';

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
  ];

  let cleaned = text;
  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

const tests = [
  'Like a Prayer - 12" Extended Remix',
  'Drop the Pressure - Club Mix',
  'Totoish - Radio Cut',
  'Bohemian Rhapsody',
  'Giorgio by Moroder',
];

console.log('🧪 Testing Track Suffix Removal\n');
console.log('='.repeat(70));

for (const test of tests) {
  const cleaned = removeTrackSuffixes(test);
  const changed = cleaned !== test;

  console.log(changed ? '🔧' : '  ', 'Original:', test);
  if (changed) {
    console.log('   →  Clean:', cleaned);
  }
  console.log('');
}
