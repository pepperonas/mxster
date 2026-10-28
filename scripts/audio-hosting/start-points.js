#!/usr/bin/env node
/**
 * Where a song becomes recognisable: skips silence and quiet intros.
 *
 * Measures the loudness (RMS, 0.5 s windows) of the first 2:30 of every audio
 * file and stores the first point where the song reaches its usual level
 * (median − 10 dB, held for 1.5 s) as `startMs` in docs/songs.json. The game
 * starts there (or later, with "Zufällige Startstelle"). Under 1.5 s nothing
 * is stored — the song starts right away anyway.
 *
 * Usage: node scripts/audio-hosting/start-points.js [--only song_123,…] [--dry]
 * Then:  node scripts/song-management/sync-songs-ts.js
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { AUDIO_DIR, loadSongs, SONGS_JSON } from '../song-management/lib/songStore.js'

const WINDOW_S = 0.5
const ANALYSE_S = 150
const MIN_START_MS = 1500
const MAX_START_MS = 40000
const BELOW_MEDIAN_DB = 10
const HOLD_WINDOWS = 3

/** RMS level (dB) per window, from ffmpeg's astats. */
export function rmsLevels(file) {
  const rate = 8000
  // ametadata prints to the log (stderr)
  const out = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-nostats', '-t', String(ANALYSE_S), '-i', file,
      '-af', `aresample=${rate},asetnsamples=${rate * WINDOW_S},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level`,
      '-f', 'null', '-'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8', maxBuffer: 1 << 26 }
  ).stderr
  return out
    .split('\n')
    .filter((l) => l.includes('RMS_level='))
    .map((l) => {
      const v = Number(l.split('=').pop())
      return Number.isFinite(v) ? v : -120
    })
}

/** Pure: first window where the level reaches median − 6 dB and stays there. */
export function startFromLevels(levels) {
  if (levels.length < HOLD_WINDOWS) return 0
  const sorted = [...levels].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const target = median - BELOW_MEDIAN_DB
  for (let i = 0; i + HOLD_WINDOWS <= levels.length; i++) {
    if (levels.slice(i, i + HOLD_WINDOWS).every((v) => v >= target)) {
      const ms = Math.round(i * WINDOW_S * 1000)
      if (ms < MIN_START_MS) return 0
      return Math.min(ms, MAX_START_MS)
    }
  }
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null
  const dry = args.includes('--dry')
  const songs = loadSongs()
  let changed = 0
  for (const song of songs) {
    if (only && !only.has(song.id)) continue
    const file = path.join(AUDIO_DIR, `${song.id}.m4a`)
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  ${song.id}: no audio file`)
      continue
    }
    const start = startFromLevels(rmsLevels(file))
    const before = song.startMs ?? 0
    if (start > 0) song.startMs = start
    else delete song.startMs
    if (start !== before) {
      changed++
      console.log(`${song.id}  ${String(start / 1000).padStart(5)} s  ${song.artist} – ${song.title}`)
    }
  }
  if (!dry) fs.writeFileSync(SONGS_JSON, JSON.stringify(songs, null, 2) + '\n', 'utf8')
  console.log(`\n${changed} songs changed${dry ? ' (dry run)' : ''}`)
}
