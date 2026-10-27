#!/usr/bin/env node
/**
 * Add a song to mxtape — without Spotify.
 *
 *   node scripts/song-management/add-song.js "Artist" "Title"
 *   node scripts/song-management/add-song.js "a-ha" "Take on Me" --year 1985 --genre Pop --yes
 *
 * Looks up year and album (MusicBrainz, iTunes), lets you check every field,
 * downloads the audio (yt-dlp) and the cover, uploads both to the VPS and
 * writes docs/songs.json (+ docs/song-facts.json), then regenerates songs.ts.
 * Flags: --year --album --genre --fact --exotic --yes --no-upload (see lib/songWizard.js).
 * Deploy the web app afterwards so the new song is in the bundle.
 */
import { execFileSync } from 'child_process'
import path from 'path'
import { ROOT, findDuplicate, loadFacts, loadSongs, nextId, previewUrlFor, saveAll } from './lib/songStore.js'
import { createPrompt, fetchMedia, parseArgs, proposeSong } from './lib/songWizard.js'

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const prompt = createPrompt()
  try {
    let [artist, title] = positional
    if (!artist) artist = await prompt.ask('Interpret: ')
    if (!title) title = await prompt.ask('Titel: ')
    if (!artist || !title) throw new Error('Interpret und Titel angeben: add-song.js "Artist" "Title"')

    const songs = loadSongs()
    const dup = findDuplicate(songs, artist, title)
    if (dup) {
      console.log(`ℹ️  Schon vorhanden: ${dup.id} ${dup.artist} – ${dup.title} (${dup.year}). Nichts geändert.`)
      return
    }

    const { meta, cover } = await proposeSong({ artist, title, flags, prompt })
    const again = findDuplicate(songs, meta.artist, meta.title)
    if (again) throw new Error(`Schon vorhanden als ${again.id}.`)

    const id = nextId(songs)
    const song = {
      id,
      title: meta.title,
      artist: meta.artist,
      year: meta.year,
      ...(meta.album ? { album: meta.album } : {}),
      previewUrl: previewUrlFor(id),
      genre: meta.genre || '',
      ...(meta.exotic ? { exotic: true } : {})
    }

    const media = await fetchMedia(song, cover, flags)
    if (!media.audio) throw new Error('Audio-Download fehlgeschlagen — Song nicht gespeichert.')

    const facts = loadFacts()
    if (meta.fact) facts[id] = meta.fact
    saveAll([...songs, song], facts)
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/song-management/update-song-count.js')], { stdio: 'ignore' })

    console.log(`\n✨ ${id}: ${song.artist} – ${song.title} (${song.year})${song.album ? `, ${song.album}` : ''}`)
    console.log(`   Audio ${flags.upload ? 'hochgeladen' : 'lokal'}, Cover: ${media.cover ?? 'keins'}, Fakt: ${meta.fact ? 'ja' : 'nein'}`)
    console.log('   Nächster Schritt: ./scripts/deployment/deploy.sh web')
  } finally {
    prompt.close()
  }
}

main().catch((e) => {
  console.error(`\n❌ ${e.message}`)
  process.exit(1)
})
