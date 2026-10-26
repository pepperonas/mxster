#!/usr/bin/env node

/**
 * Interactive Song Editor Wizard
 *
 * Ermöglicht das Bearbeiten bestehender Songs in der Datenbank
 * und aktualisiert docs/songs.json sowie pwa/src/data/songs.ts.
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import { execSync } from 'child_process'

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Hauptfunktion
async function main() {
  log('\n╔══════════════════════════════════════════╗', 'bright');
  log('║  🎵  mxster Song Editor Wizard  🎵   ║', 'bright');
  log('╚══════════════════════════════════════════╝\n', 'bright');

  try {
    // Songs laden
    const songs = loadSongs();
    log(`📚 ${songs.length} Songs in der Datenbank gefunden\n`, 'blue');

    // Schritt 1: Song-ID abfragen
    log('Schritt 1/4: Song auswählen', 'bright');
    log('─────────────────────────────', 'bright');

    let songIdInput = await question('Song-ID (z.B. song_001 oder 001): ');
    songIdInput = songIdInput.trim();

    // Normalisiere Song-ID: Füge "song_" hinzu, falls nicht vorhanden
    let songId = songIdInput;
    if (!songIdInput.startsWith('song_')) {
      // Format: "128" oder "095" → "song_128" oder "song_095"
      songId = `song_${songIdInput.padStart(3, '0')}`;
    }

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

    log('\n✅ Song gefunden:', 'green');
    log(`   Titel:    ${oldSong.title}`, 'cyan');
    log(`   Interpret: ${oldSong.artist}`, 'cyan');
    log(`   Jahr:     ${oldSong.year}`, 'cyan');
    log(`   Spotify:  ${oldSong.spotifyId}\n`, 'cyan');

    // Schritt 2: Neue Daten abfragen
    log('Schritt 2/4: Neue Daten eingeben', 'bright');
    log('─────────────────────────────────', 'bright');
    log('(Leer lassen = Wert behalten)\n', 'yellow');

    const newTitle = await question(`Titel [${oldSong.title}]: `);
    const newArtist = await question(`Interpret [${oldSong.artist}]: `);
    const newYearInput = await question(`Jahr [${oldSong.year}]: `);

    log('\n💡 Genre-Vorschläge: Pop, Rock, Hip-Hop, Electronic, R&B, Country, Jazz, Metal, Reggae, Soul', 'cyan');
    const currentGenre = oldSong.genre || 'nicht gesetzt';
    const newGenreInput = await question(`Genre [${currentGenre}]: `);

    // Neue Werte zusammenstellen
    const updatedSong = {
      ...oldSong,
      title: newTitle.trim() || oldSong.title,
      artist: newArtist.trim() || oldSong.artist,
      year: newYearInput.trim() ? parseInt(newYearInput.trim()) : oldSong.year
    };

    // Genre update (nur wenn eingegeben)
    if (newGenreInput.trim()) {
      updatedSong.genre = newGenreInput.trim();
    }

    // Schritt 3: Bestätigung
    log('\nSchritt 3/4: Änderungen bestätigen', 'bright');
    log('───────────────────────────────────', 'bright');

    log('\nVorher:', 'red');
    log(`  ${oldSong.artist} - ${oldSong.title} (${oldSong.year})`, 'red');
    if (oldSong.genre) {
      log(`  Genre: ${oldSong.genre}`, 'red');
    }

    log('\nNachher:', 'green');
    log(`  ${updatedSong.artist} - ${updatedSong.title} (${updatedSong.year})`, 'green');
    if (updatedSong.genre) {
      log(`  Genre: ${updatedSong.genre}`, 'green');
    }

    const confirm = await question('\nÄnderungen übernehmen? (j/n): ');

    if (confirm.toLowerCase() !== 'j' && confirm.toLowerCase() !== 'ja') {
      log('\n❌ Abgebrochen', 'yellow');
      rl.close();
      return;
    }

    // Schritt 4: Dateien aktualisieren
    log('\nSchritt 4/4: Dateien aktualisieren', 'bright');
    log('───────────────────────────────────', 'bright');

    // 1. Songs-Array aktualisieren
    songs[songIndex] = updatedSong;

    // 2. Datenbanken speichern
    await saveSongs(songs);
    await updateSongsJs(songs);

    // Update song count in README.md
    log('\n📊 Updating song count in README.md...', 'cyan');
    try {
      execSync('node update-song-count.js', { cwd: __dirname, stdio: 'inherit' });
    } catch (error) {
      log(`   ⚠️  Could not update README.md: ${error.message}`, 'yellow');
    }

    log('\n╔══════════════════════════════════════════╗', 'bright');
    log('║          ✅  Fertig!  ✅               ║', 'green');
    log('╚══════════════════════════════════════════╝\n', 'bright');

    log('Aktualisierte Dateien:', 'cyan');
    log('  • docs/songs.json', 'cyan');
    log('  • pwa/src/data/songs.ts', 'cyan');
  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    console.error(error);
  } finally {
    rl.close();
  }
}

// Start
main();
