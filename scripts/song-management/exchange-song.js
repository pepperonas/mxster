#!/usr/bin/env node
/**
 * Replace a song by another one under the same id — without Spotify.
 *
 *   node scripts/song-management/exchange-song.js song_123 "Artist" "Title"
 *   node scripts/song-management/exchange-song.js            (asks for everything)
 *
 * The id stays (history and recently-played lists keep working); title,
 * artist, year, album, genre, audio, cover and fact are replaced. The old
 * fact is dropped unless a new one is given (it was about the old song).
 * Flags: --year --album --genre --fact --yes --no-upload (see lib/songWizard.js).
 */
import { findDuplicate, loadFacts, loadSongs, saveAll } from './lib/songStore.js'
import { createPrompt, fetchMedia, parseArgs, proposeSong } from './lib/songWizard.js'

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const prompt = createPrompt()
  try {
    const songs = loadSongs()
    let [id, artist, title] = positional
    if (!id) {
      const term = await prompt.ask('Welcher Song? (ID oder Suchbegriff): ')
      const hits = songs.filter((s) => s.id === term || `${s.artist} ${s.title}`.toLowerCase().includes(term.toLowerCase()))
      hits.slice(0, 10).forEach((s) => console.log(`   ${s.id}  ${s.artist} – ${s.title} (${s.year})`))
      id = hits.length === 1 ? hits[0].id : await prompt.ask('ID: ')
    }
    const index = songs.findIndex((s) => s.id === id)
    if (index < 0) throw new Error(`Unbekannte ID: ${id}`)
    const old = songs[index]
    console.log(`\n🔁 Ersetze ${old.id}: ${old.artist} – ${old.title} (${old.year})`)

    if (!artist) artist = await prompt.ask('Neuer Interpret: ')
    if (!title) title = await prompt.ask('Neuer Titel: ')
    if (!artist || !title) throw new Error('Interpret und Titel angeben.')
    const dup = findDuplicate(songs, artist, title, id)
    if (dup) throw new Error(`Schon vorhanden als ${dup.id}.`)

    const { meta, cover } = await proposeSong({ artist, title, flags, prompt, current: old })
    const song = {
      id,
      title: meta.title,
      artist: meta.artist,
      year: meta.year,
      ...(meta.album ? { album: meta.album } : {}),
      // No spotifyId: the replacement is a different song and gets a fresh key (songKey falls back to the id)
      previewUrl: old.previewUrl,
      genre: meta.genre || ''
    }

    const media = await fetchMedia(song, cover, flags)
    if (!media.audio) throw new Error('Audio-Download fehlgeschlagen — nichts geändert.')

    const facts = loadFacts()
    delete facts[id]
    if (meta.fact) facts[id] = meta.fact
    saveAll(songs.map((s, i) => (i === index ? song : s)), facts)

    console.log(`\n✨ ${id}: ${song.artist} – ${song.title} (${song.year})`)
    console.log(`   Cover: ${media.cover ?? 'keins'}, Fakt: ${meta.fact ? 'neu' : 'keiner'}`)
    console.log('   Nächster Schritt: ./scripts/deployment/deploy.sh web')
  } finally {
    prompt.close()
  }
}

main().catch((e) => {
  console.error(`\n❌ ${e.message}`)
  process.exit(1)
})
