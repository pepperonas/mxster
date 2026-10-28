#!/usr/bin/env node
/**
 * Replace the 300 px covers with sharper ones — but only with the SAME artwork.
 *
 * The covers were picked and checked by hand (no compilations, the original
 * sleeve). A fresh lookup could find a different picture, so a candidate is
 * only taken when it looks like the current cover: both are shrunk to 32×32
 * and compared (RMSE, ImageMagick). Otherwise the old cover stays.
 *
 * Sources: iTunes search (artwork up to 600 px), then the Cover Art Archive
 * (500 px) via a MusicBrainz release-group search. Result: 500×500 jpg.
 *
 *   node scripts/audio-hosting/upscale-covers.mjs [--only song_001,song_002] [--dry-run]
 *
 * Needs ImageMagick (`magick`) and macOS `sips`. Writes a report to
 * scripts/audio-hosting/upscale-report.json. Upload afterwards with rsync.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const COVERS = path.join(ROOT, 'pwa/public/audio/covers')
const SONGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/songs.json'), 'utf8'))
const LIST = Array.isArray(SONGS) ? SONGS : SONGS.songs
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mx-covers-'))
const UA = { 'User-Agent': 'mxtape-covers/1.0 (martinpaush@gmail.com)' }
const SIZE = 500
/** Same artwork below this (RMSE 0–1 on 32×32 thumbnails); measured: same art ≈ 0.02–0.08, other art > 0.18. */
export const SAME_ART = 0.12

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
const dry = args.includes('--dry-run')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function download(url, file) {
  try {
    const res = await fetch(url, { headers: UA, redirect: 'follow' })
    if (!res.ok) return false
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    return fs.statSync(file).size > 2000
  } catch {
    return false
  }
}

function width(file) {
  try {
    return Number(execFileSync('magick', ['identify', '-format', '%w', file], { encoding: 'utf8' }))
  } catch {
    return 0
  }
}

/** RMSE (0–1) between two images shrunk to 32×32. */
function distance(a, b) {
  const ta = path.join(TMP, 'a.png')
  const tb = path.join(TMP, 'b.png')
  execFileSync('magick', [a, '-resize', '32x32!', '-colorspace', 'sRGB', ta])
  execFileSync('magick', [b, '-resize', '32x32!', '-colorspace', 'sRGB', tb])
  try {
    execFileSync('magick', ['compare', '-metric', 'RMSE', ta, tb, 'null:'], { stdio: ['ignore', 'ignore', 'pipe'] })
    return 0
  } catch (e) {
    const m = /\(([\d.]+)\)/.exec(String(e.stderr))
    return m ? Number(m[1]) : 1
  }
}

/** iTunes artwork for one search (up to 600 px). */
async function itunesSearch(term, entity) {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=6`)
    await sleep(3200) // iTunes allows about 20 searches a minute
    if (!res.ok) return []
    return [...new Set(((await res.json()).results ?? []).filter((r) => r.artworkUrl100).map((r) => r.artworkUrl100.replace(/\/\d+x\d+bb\./, '/600x600bb.')))]
  } catch {
    return []
  }
}

async function caaCandidates(song) {
  if (!song.album) return []
  try {
    const q = `releasegroup:"${song.album.replace(/"/g, '')}" AND artist:"${song.artist.replace(/"/g, '')}"`
    const res = await fetch(`https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(q)}&fmt=json&limit=4`, { headers: UA })
    await sleep(1100)
    if (!res.ok) return []
    return ((await res.json())['release-groups'] ?? []).map((g) => `https://coverartarchive.org/release-group/${g.id}/front-500`)
  } catch {
    return []
  }
}

async function upgrade(song) {
  const current = path.join(COVERS, `${song.id}.jpg`)
  if (!fs.existsSync(current)) return { id: song.id, result: 'no-cover' }
  if (width(current) >= SIZE) return { id: song.id, result: 'already' }
  const searches = [
    ['itunes', () => itunesSearch(`${song.artist} ${song.album || song.title}`, 'album')],
    ['itunes', () => itunesSearch(`${song.artist} ${song.title}`, 'song')],
    ['caa', () => caaCandidates(song)]
  ]
  for (const [n, [source, search]] of searches.entries()) {
    const urls = await search()
    let best = null
    for (const [i, url] of urls.entries()) {
      const file = path.join(TMP, `${song.id}-${n}-${i}`)
      if (!(await download(url, file)) || width(file) < SIZE) continue
      const d = distance(current, file)
      if (d <= SAME_ART && (!best || d < best.d)) best = { file, d, url }
    }
    if (best) {
      if (!dry) execFileSync('sips', ['-s', 'format', 'jpeg', '-z', String(SIZE), String(SIZE), best.file, '--out', current], { stdio: 'ignore' })
      return { id: song.id, result: 'upgraded', source, distance: Number(best.d.toFixed(3)), url: best.url }
    }
  }
  return { id: song.id, result: 'kept' }
}

const songs = LIST.filter((s) => !only || only.includes(s.id))
const report = []
for (const [i, song] of songs.entries()) {
  const r = await upgrade(song)
  report.push(r)
  console.log(`${String(i + 1).padStart(3)}/${songs.length} ${song.id} ${r.result}${r.source ? ` (${r.source}, ${r.distance})` : ''}  ${song.artist} – ${song.title}`)
}
const counts = report.reduce((n, r) => ((n[r.result] = (n[r.result] ?? 0) + 1), n), {})
fs.writeFileSync(path.join(ROOT, 'scripts/audio-hosting/upscale-report.json'), JSON.stringify({ counts, report }, null, 2))
console.log(counts)
fs.rmSync(TMP, { recursive: true, force: true })
