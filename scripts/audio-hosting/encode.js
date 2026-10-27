#!/usr/bin/env node
/**
 * The one audio format mxster plays: AAC-LC, 96 kbit/s, in an .m4a container.
 *
 *  - AAC at 96 kbit/s sounds like the old 128 kbit/s MP3s and is a quarter smaller.
 *  - Songs are cut at 4:00 with a 3 s fade-out. A turn never needs more: the
 *    random start lies within the first 2:30 (RANDOM_START_MAX_S in
 *    Turntable.tsx), so at least 90 s are always left to listen.
 *  - `+faststart` puts the index at the front, so playback starts before the
 *    whole file is loaded (the files are streamed with range requests).
 *  - Metadata is dropped: a title tag would give the answer away.
 *
 * Uses Apple's AAC encoder (aac_at) on macOS, ffmpeg's own (aac) elsewhere.
 *
 * CLI — convert any other audio file in pwa/public/audio to .m4a and delete the source:
 *   node scripts/audio-hosting/encode.js            all songs that have no .m4a yet
 *   node scripts/audio-hosting/encode.js song_042   just these
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const AUDIO_DIR = path.resolve(__dirname, '../../pwa/public/audio')
export const AUDIO_EXT = 'm4a'
export const MAX_SECONDS = 240
const FADE_SECONDS = 3
const BITRATE = '96k'

let encoder = null
function aacEncoder() {
  if (encoder) return encoder
  try {
    const list = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' })
    encoder = /\baac_at\b/.test(list) ? 'aac_at' : 'aac'
  } catch {
    throw new Error('ffmpeg not found — brew install ffmpeg')
  }
  return encoder
}

/** Duration in seconds via ffprobe, or null. */
export function probeSeconds(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' })
    const s = Math.round(parseFloat(out))
    return Number.isFinite(s) ? s : null
  } catch {
    return null
  }
}

/** Encode any audio file into the game format. Writes `dest` atomically. */
export function encodeForGame(src, dest) {
  const tmp = `${dest}.part.${AUDIO_EXT}`
  execFileSync(
    'ffmpeg',
    [
      '-nostdin', '-v', 'error', '-y',
      '-i', src,
      '-t', String(MAX_SECONDS),
      '-af', `afade=t=out:st=${MAX_SECONDS - FADE_SECONDS}:d=${FADE_SECONDS}`,
      '-map_metadata', '-1',
      '-vn',
      '-c:a', aacEncoder(),
      '-b:a', BITRATE,
      '-movflags', '+faststart',
      tmp
    ],
    { stdio: 'inherit' }
  )
  fs.renameSync(tmp, dest)
}

export function audioFile(id) {
  return path.join(AUDIO_DIR, `${id}.${AUDIO_EXT}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wanted = process.argv.slice(2)
  const sources = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => /^song_\d+\.(mp3|webm|opus|ogg|wav|flac|aac)$/.test(f))
    .filter((f) => wanted.length === 0 || wanted.includes(f.replace(/\.[^.]+$/, '')))
  let done = 0
  for (const f of sources) {
    const id = f.replace(/\.[^.]+$/, '')
    const dest = audioFile(id)
    if (wanted.length === 0 && fs.existsSync(dest)) continue
    encodeForGame(path.join(AUDIO_DIR, f), dest)
    fs.rmSync(path.join(AUDIO_DIR, f))
    done++
    console.log(`✅ ${id}.${AUDIO_EXT}`)
  }
  console.log(`${done} file(s) encoded`)
}
