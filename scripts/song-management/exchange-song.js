#!/usr/bin/env node

/**
 * Interactive Song Exchange Wizard
 *
 * Ersetzt einen bestehenden Song komplett durch einen neuen Song von Spotify.
 * Behält die Song-ID bei, lädt neue Metadaten und aktualisiert docs/songs.json
 * sowie pwa/src/data/songs.ts.
 */

import dotenv from 'dotenv'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import { execSync } from 'child_process'
import { getTrackMetadata } from './lib/spotifyApi.js'

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root (two levels up)
dotenv.config({ path: path.join(__dirname, '../../.env') })

// Farben für Terminal-Output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hilfsfunktion für Fragen
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Hilfsfunktion für farbigen Output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Song-Datenbank laden
function loadSongs() {
  const songsJsonPath = path.join(__dirname, '../../docs', 'songs.json');
  const songsData = fsSync.readFileSync(songsJsonPath, 'utf8');
  return JSON.parse(songsData);
}

// Song-Datenbank speichern
async function saveSongs(songs) {
  const songsJsonPath = path.join(__dirname, '../../docs', 'songs.json');

  // Backup erstellen
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(__dirname, '../../docs', `songs.json.backup-${timestamp}`);
  await fs.copyFile(songsJsonPath, backupPath);
  log(`✅ Backup erstellt: ${backupPath}`, 'green');

  // Speichern
  await fs.writeFile(songsJsonPath, JSON.stringify(songs, null, 2));
  log('✅ songs.json aktualisiert', 'green');
}

// songs.ts aktualisieren
async function updateSongsJs(songs) {
  const songsJsPath = path.join(__dirname, '../../pwa', 'src', 'data', 'songs.ts');
  const content = `import type { Song } from '@/types'\n\nexport const songs: Song[] = ${JSON.stringify(songs, null, 2)}\n`;
  await fs.writeFile(songsJsPath, content);
  log('✅ pwa/src/data/songs.ts aktualisiert', 'green');
}

// Extrahiere Spotify Track ID aus URL
function extractSpotifyId(input) {
  // Wenn bereits nur die ID: direkt zurückgeben
  if (input.match(/^[a-zA-Z0-9]{22}$/)) {
    return input;
  }

  // Aus URL extrahieren
  const match = input.match(/track\/([a-zA-Z0-9]{22})/);
  if (match) {
    return match[1];
  }

  return null;
}

// Hauptfunktion
async function main() {
  log('\n╔════════════════════════════════════════╗', 'bright');
  log('║  🔄  mxster Song Exchange Wizard  🔄   ║', 'bright');
  log('╚════════════════════════════════════════╝\n', 'bright');

  try {
    // Songs laden
    const songs = loadSongs();
    log(`📚 ${songs.length} Songs in der Datenbank gefunden\n`, 'blue');

    // Schritt 1: Song-ID des zu ersetzenden Songs abfragen
    log('Schritt 1/5: Song auswählen zum Ersetzen', 'bright');
    log('──────────────────────────────────────────', 'bright');

    const songId = await question('Song-ID zum Ersetzen (z.B. song_001): ');

    // Song finden
    const songIndex = songs.findIndex(s => s.id === songId);

    if (songIndex === -1) {
      log(`❌ Song mit ID "${songId}" nicht gefunden!`, 'red');
      log('\nVerfügbare Song-IDs:', 'yellow');
      songs.slice(0, 10).forEach(s => {
        log(`  - ${s.id}: ${s.artist} - ${s.title} (${s.year})`, 'yellow');
      });
      if (songs.length > 10) {
        log(`  ... und ${songs.length - 10} weitere`, 'yellow');
      }
      rl.close();
      return;
    }

    const oldSong = songs[songIndex];

    log('\n✅ Song gefunden (wird ersetzt):', 'green');
    log(`   Titel:    ${oldSong.title}`, 'cyan');
    log(`   Interpret: ${oldSong.artist}`, 'cyan');
    log(`   Jahr:     ${oldSong.year}`, 'cyan');
    log(`   Spotify:  ${oldSong.spotifyId}\n`, 'cyan');

    // Schritt 2: Neuen Spotify Track abfragen
    log('Schritt 2/5: Neuen Spotify Track eingeben', 'bright');
    log('─────────────────────────────────────────', 'bright');

    const spotifyInput = await question('Spotify URL oder Track-ID: ');
    const spotifyId = extractSpotifyId(spotifyInput);

    if (!spotifyId) {
      log('❌ Ungültige Spotify URL oder Track-ID!', 'red');
      log('\nBeispiele:', 'yellow');
      log('  - https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv', 'yellow');
      log('  - 4u7EnebtmKWzUH433cf5Qv', 'yellow');
      rl.close();
      return;
    }

    // Schritt 3: Metadaten von Spotify laden
    log('\nSchritt 3/5: Metadaten von Spotify laden', 'bright');
    log('─────────────────────────────────────────', 'bright');

    log('🔍 Lade Track-Informationen von Spotify...', 'cyan');
    const trackData = await getTrackMetadata(`https://open.spotify.com/track/${spotifyId}`);

    log('\n✅ Neuer Track gefunden:', 'green');
    log(`   Titel:    ${trackData.title}`, 'cyan');
    log(`   Interpret: ${trackData.artist}`, 'cyan');
    log(`   Jahr:     ${trackData.year}`, 'cyan');
    log(`   Album:    ${trackData.album}`, 'cyan');
    log(`   Spotify:  ${trackData.spotifyId}\n`, 'cyan');

    // Schritt 4: Bestätigung
    log('Schritt 4/5: Austausch bestätigen', 'bright');
    log('─────────────────────────────────────────', 'bright');

    log('\n🔴 ALT (wird gelöscht):', 'red');
    log(`  ${oldSong.artist} - ${oldSong.title} (${oldSong.year})`, 'red');

    log('\n🟢 NEU (wird eingefügt):', 'green');
    log(`  ${trackData.artist} - ${trackData.title} (${trackData.year})`, 'green');

    log(`\n💡 Song-ID bleibt: ${songId}`, 'yellow');

    const confirm = await question('\nSong austauschen? (j/n): ');

    if (confirm.toLowerCase() !== 'j' && confirm.toLowerCase() !== 'ja') {
      log('\n❌ Abgebrochen', 'yellow');
      rl.close();
      return;
    }

    // Schritt 5: Dateien aktualisieren
    log('\nSchritt 5/5: Dateien aktualisieren', 'bright');
    log('─────────────────────────────────────────', 'bright');

    // 1. Song-Objekt erstellen (behält die alte ID!)
    const newSong = {
      id: songId,  // WICHTIG: Behält die alte ID!
      title: trackData.title,
      artist: trackData.artist,
      year: trackData.year,
      spotifyId: trackData.spotifyId,
      previewUrl: trackData.previewUrl || ''
    };

    // Optional: Genre hinzufügen (falls vorhanden)
    if (trackData.genre) {
      newSong.genre = trackData.genre;
    }

    // 1.5. Download from YouTube and upload to VPS
    log('\n🎵 Downloading and uploading audio...', 'cyan');
    try {
      const { downloadAndUploadSong } = await import('../audio-hosting/download-single-song.js');
      const selfHostedUrl = await downloadAndUploadSong(newSong);

      if (selfHostedUrl) {
        newSong.previewUrl = selfHostedUrl;
        log(`✅ Updated previewUrl to self-hosted: ${selfHostedUrl}`, 'green');
      } else {
        log(`⚠️  Using Spotify preview URL as fallback: ${trackData.previewUrl || 'none'}`, 'yellow');
      }
    } catch (error) {
      log(`❌ Audio download/upload failed: ${error.message}`, 'red');
      log(`⚠️  Using Spotify preview URL as fallback: ${trackData.previewUrl || 'none'}`, 'yellow');
    }

    // 2. In Array ersetzen
    songs[songIndex] = newSong;

    // 3. Datenbanken speichern
    await saveSongs(songs);
    await updateSongsJs(songs);

    // Update song count in README.md
    log('\n📊 Updating song count in README.md...', 'cyan');
    try {
      execSync('node scripts/song-management/update-song-count.js', { cwd: path.join(__dirname, '../..'), stdio: 'inherit' });
    } catch (error) {
      log(`   ⚠️  Could not update README.md: ${error.message}`, 'yellow');
    }

    log('\n╔════════════════════════════════════════╗', 'bright');
    log('║        ✅  Fertig!  ✅             ║', 'green');
    log('╚════════════════════════════════════════╝\n', 'bright');

    log('Aktualisierte Dateien:', 'cyan');
    log('  • docs/songs.json', 'cyan');
    log('  • pwa/src/data/songs.ts', 'cyan');

    log('\n📊 Song-Details:', 'cyan');
    log(`   Alt: ${oldSong.artist} - ${oldSong.title} (${oldSong.year})`, 'red');
    log(`   Neu: ${newSong.artist} - ${newSong.title} (${newSong.year})`, 'green');
    log(`   ID:  ${songId} (unverändert)`, 'yellow');

  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    console.error(error);
  } finally {
    rl.close();
  }
}

// Start
main();
