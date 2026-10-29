#!/usr/bin/env node

/**
 * Regenerates pwa/src/data/songs.ts from docs/songs.json (the source of truth).
 *
 * The "Wusstest du?" facts live separately in docs/song-facts.json
 * ({ "<id>": "<fact>" }) and are merged in here as a `fact` field on every
 * song that has one; songs.json itself stays without facts. English
 * translations live in docs/song-facts.en.json (same keys) and become `factEn`.
 *
 * Usage: node scripts/song-management/sync-songs-ts.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SONGS_JSON = path.join(ROOT, 'docs/songs.json')
const FACTS_JSON = path.join(ROOT, 'docs/song-facts.json')
const FACTS_EN_JSON = path.join(ROOT, 'docs/song-facts.en.json')
const SONGS_TS = path.join(ROOT, 'pwa/src/data/songs.ts')
// The server picks the daily round from the same well-known songs (server/app/daily_pick.py)
const DAILY_POOL = path.join(ROOT, 'server/app/daily_pool.json')

const songs = JSON.parse(fs.readFileSync(SONGS_JSON, 'utf8'))
const facts = fs.existsSync(FACTS_JSON) ? JSON.parse(fs.readFileSync(FACTS_JSON, 'utf8')) : {}
const factsEn = fs.existsSync(FACTS_EN_JSON) ? JSON.parse(fs.readFileSync(FACTS_EN_JSON, 'utf8')) : {}

const ids = new Set(songs.map((s) => s.id))
const orphans = [...Object.keys(facts), ...Object.keys(factsEn)].filter((id) => !ids.has(id))
if (orphans.length > 0) {
  console.warn(`⚠️  Facts for unknown ids ignored: ${orphans.join(', ')}`)
}

const merged = songs.map((song) => {
  const fact = facts[song.id]
  const factEn = factsEn[song.id]
  return { ...song, ...(fact ? { fact } : {}), ...(factEn ? { factEn } : {}) }
})

const out = `import type { Song } from '@/types'\n\nexport const songs: Song[] = ${JSON.stringify(merged, null, 2)}\n`
fs.writeFileSync(SONGS_TS, out, 'utf8')

const pool = songs.filter((s) => !s.exotic).map((s) => ({ id: s.id, year: s.year }))
fs.writeFileSync(DAILY_POOL, JSON.stringify(pool) + '\n', 'utf8')
console.log(`✅ ${path.relative(ROOT, DAILY_POOL)}: ${pool.length} songs for the daily round`)

const withFact = merged.filter((s) => s.fact).length
const withFactEn = merged.filter((s) => s.factEn).length
console.log(`✅ ${path.relative(ROOT, SONGS_TS)}: ${merged.length} songs, ${withFact} with fact, ${withFactEn} with English fact`)
