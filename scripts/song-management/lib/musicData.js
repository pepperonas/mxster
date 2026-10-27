/**
 * Song metadata and covers from open sources — no Spotify, no account.
 *
 *  - MusicBrainz (https://musicbrainz.org/doc/MusicBrainz_API): recording
 *    search → first release date (the year the recording first came out) and
 *    the release group it first appeared on (album). Max 1 request per second,
 *    descriptive User-Agent required.
 *  - Cover Art Archive: front cover of that release group.
 *  - iTunes Search API: fallback for album name and cover.
 *
 * Every value is a suggestion; the scripts show it and let you correct it.
 * Original release years are hard to get right automatically (remasters,
 * compilations) — check the year before saving.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const UA = 'mxster-songdata/1.0 (martin.pfeffer@celox.io)'
let lastMb = 0

async function mbGet(url) {
  const wait = lastMb + 1100 - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastMb = Date.now()
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`MusicBrainz ${res.status}`)
  return res.json()
}

const quote = (s) => `"${s.replace(/["\\]/g, ' ')}"`
const yearOf = (date) => (date && /^\d{4}/.test(date) ? parseInt(date.slice(0, 4), 10) : null)

const norm = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '')

const BAD_SECONDARY = ['Compilation', 'Live', 'DJ-mix', 'Mixtape/Street', 'Remix', 'Demo']

/**
 * Best guess for a recording. Year: the earliest first release among
 * recordings credited to exactly this artist (compilations and covers by
 * others do not count). Album: the earliest album/single/EP that recording
 * appeared on, never a compilation, live album or DJ mix.
 * Returns { year, album, releaseGroupId, candidates } — candidates for display.
 */
export async function lookupRecording(artist, title) {
  const q = `recording:${quote(title)} AND artist:${quote(artist)}`
  const data = await mbGet(`https://musicbrainz.org/ws/2/recording?fmt=json&limit=100&query=${encodeURIComponent(q)}`)
  const wanted = norm(artist)
  const credited = (r) => norm((r['artist-credit'] ?? []).map((c) => c.name + (c.joinphrase ?? '')).join(''))
  const matches = (data.recordings ?? []).filter((r) => (r.score ?? 0) >= 85 && credited(r).startsWith(wanted) && r['first-release-date'])

  const candidates = matches
    .map((r) => ({
      id: r.id,
      year: yearOf(r['first-release-date']),
      title: r.title,
      artist: (r['artist-credit'] ?? []).map((c) => c.name + (c.joinphrase ?? '')).join(''),
      lengthS: r.length ? Math.round(r.length / 1000) : null
    }))
    .filter((c) => c.year)
    .sort((a, b) => a.year - b.year)

  const best = candidates[0]
  if (!best) return { year: null, album: null, releaseGroupId: null, candidates }

  // The original album of that recording (one more request)
  const rec = await mbGet(`https://musicbrainz.org/ws/2/recording/${best.id}?fmt=json&inc=releases+release-groups`)
  const groups = (rec.releases ?? [])
    .filter((rel) => rel['release-group'])
    .map((rel) => ({ date: rel.date || '9999', group: rel['release-group'] }))
    .filter(({ group }) => ['Album', 'Single', 'EP'].includes(group['primary-type']))
    .filter(({ group }) => !(group['secondary-types'] ?? []).some((t) => BAD_SECONDARY.includes(t)))
    .sort((a, b) => a.date.localeCompare(b.date))
  // An album beats a single of the same year: that's where people know the song from
  const firstYear = groups[0]?.date.slice(0, 4)
  const pick = groups.find((g) => g.date.startsWith(firstYear ?? '') && g.group['primary-type'] === 'Album') ?? groups[0]
  for (const c of candidates) c.album = c.id === best.id ? pick?.group.title ?? null : null

  return { year: best.year, album: pick?.group.title ?? null, releaseGroupId: pick?.group.id ?? null, candidates }
}

/** iTunes fallback: album name and a 300 px artwork URL. */
export async function lookupItunes(artist, title) {
  const term = encodeURIComponent(`${artist} ${title}`)
  const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=5`)
  if (!res.ok) return null
  const data = await res.json()
  const hit = (data.results ?? [])[0]
  if (!hit) return null
  return {
    album: hit.collectionName ?? null,
    artwork: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100bb', '300x300bb') : null,
    year: yearOf(hit.releaseDate)
  }
}

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) return false
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return fs.statSync(file).size > 2000
}

/**
 * Saves a 300×300 jpg cover to `file`: Cover Art Archive first, iTunes second.
 * Returns the source used, or null.
 */
export async function fetchCover({ releaseGroupId, itunesArtwork }, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.download`
  let source = null
  if (releaseGroupId && (await download(`https://coverartarchive.org/release-group/${releaseGroupId}/front-500`, tmp))) {
    source = 'Cover Art Archive'
  } else if (itunesArtwork && (await download(itunesArtwork, tmp))) {
    source = 'iTunes'
  }
  if (!source) {
    fs.rmSync(tmp, { force: true })
    return null
  }
  try {
    // macOS: scale and convert to jpg; elsewhere keep the file as delivered
    execFileSync('sips', ['-s', 'format', 'jpeg', '-z', '300', '300', tmp, '--out', file], { stdio: 'ignore' })
    fs.rmSync(tmp, { force: true })
  } catch {
    fs.renameSync(tmp, file)
  }
  return source
}
