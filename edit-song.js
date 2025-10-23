#!/usr/bin/env node

/**
 * Interactive Song Editor Wizard
 *
 * Ermöglicht das Bearbeiten bestehender Songs in der Datenbank
 * und regeneriert automatisch alle zugehörigen Dateien.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');
const { generateCard, generateSTL } = require('./card-generator/generateCard');

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
  const songsJsonPath = path.join(__dirname, 'docs', 'songs.json');
  const songsData = fsSync.readFileSync(songsJsonPath, 'utf8');
  return JSON.parse(songsData);
}

// Song-Datenbank speichern
async function saveSongs(songs) {
  const songsJsonPath = path.join(__dirname, 'docs', 'songs.json');

  // Backup erstellen
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(__dirname, 'docs', `songs.json.backup-${timestamp}`);
  await fs.copyFile(songsJsonPath, backupPath);
  log(`✅ Backup erstellt: ${backupPath}`, 'green');

  // Speichern
  await fs.writeFile(songsJsonPath, JSON.stringify(songs, null, 2));
  log('✅ songs.json aktualisiert', 'green');
}

// songs.js aktualisieren
async function updateSongsJs(songs) {
  const songsJsPath = path.join(__dirname, 'pwa', 'src', 'data', 'songs.js');
  const content = `export const songs = ${JSON.stringify(songs, null, 2)}\n`;
  await fs.writeFile(songsJsPath, content);
  log('✅ pwa/src/data/songs.js aktualisiert', 'green');
}

// Alte Dateien löschen
async function deleteOldFiles(songId) {
  const oldFiles = [];

  // Finde alle Dateien mit dieser Song-ID
  const docsDir = path.join(__dirname, 'docs');
  const qrCodesDir = path.join(__dirname, 'card-generator', 'qr-codes');
  const modelsDir = path.join(__dirname, 'card-generator', 'models');

  // Suche in docs/
  try {
    const docsFiles = await fs.readdir(docsDir);
    for (const file of docsFiles) {
      if (file.startsWith(songId + '_') && file.endsWith('.png')) {
        const filePath = path.join(docsDir, file);
        await fs.unlink(filePath);
        oldFiles.push(filePath);
      }
    }
  } catch (error) {
    // Verzeichnis existiert nicht
  }

  // Suche in qr-codes/
  try {
    const qrFiles = await fs.readdir(qrCodesDir);
    for (const file of qrFiles) {
      if (file.startsWith(songId + '_') && file.endsWith('.png')) {
        const filePath = path.join(qrCodesDir, file);
        await fs.unlink(filePath);
        oldFiles.push(filePath);
      }
    }
  } catch (error) {
    // Verzeichnis existiert nicht
  }

  // Suche in models/
  try {
    const modelFiles = await fs.readdir(modelsDir);
    for (const file of modelFiles) {
      if (file.startsWith(songId + '_') && (file.endsWith('.scad') || file.endsWith('.stl'))) {
        const filePath = path.join(modelsDir, file);
        await fs.unlink(filePath);
        oldFiles.push(filePath);
      }
    }
  } catch (error) {
    // Verzeichnis existiert nicht
  }

  if (oldFiles.length > 0) {
    log(`🗑️  ${oldFiles.length} alte Dateien gelöscht`, 'yellow');
  }
}

// QR-Code und Karten generieren
async function generateCardFiles(song, include3D = false) {
  log('🔄 Generiere Karten-Dateien...', 'cyan');

  try {
    // Generiere Card (QR-Code + SCAD)
    const result = await generateCard(song);

    // Kopiere QR-Code nach docs/
    const docsQrPath = path.join(__dirname, 'docs', path.basename(result.qrCodePath));
    await fs.copyFile(result.qrCodePath, docsQrPath);
    log(`✅ QR-Code generiert: ${docsQrPath}`, 'green');

    // Generiere STL wenn gewünscht
    if (include3D) {
      try {
        const stlResult = await generateSTL(result.scadPath);
        if (stlResult) {
          log(`✅ 3D-Modelle generiert (SCAD + STL)`, 'green');
        }
      } catch (error) {
        log(`⚠️  STL-Generierung fehlgeschlagen: ${error.message}`, 'yellow');
      }
    } else {
      log(`✅ SCAD-Modell generiert`, 'green');
    }

    return result;
  } catch (error) {
    log(`❌ Fehler beim Generieren der Karten: ${error.message}`, 'red');
    throw error;
  }
}

// Sanitize Dateinamen
function sanitizeFilename(str) {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

// Hauptfunktion
async function main() {
  log('\n╔════════════════════════════════════════════╗', 'bright');
  log('║   🎵  mxster Song Editor Wizard  🎵      ║', 'bright');
  log('╚════════════════════════════════════════════╝\n', 'bright');

  try {
    // Songs laden
    const songs = loadSongs();
    log(`📚 ${songs.length} Songs in der Datenbank gefunden\n`, 'blue');

    // Schritt 1: Song-ID abfragen
    log('Schritt 1/4: Song auswählen', 'bright');
    log('─────────────────────────────', 'bright');

    const songId = await question('Song-ID (z.B. song_001): ');

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

    // Neue Werte zusammenstellen
    const updatedSong = {
      ...oldSong,
      title: newTitle.trim() || oldSong.title,
      artist: newArtist.trim() || oldSong.artist,
      year: newYearInput.trim() ? parseInt(newYearInput.trim()) : oldSong.year
    };

    // Schritt 3: Bestätigung
    log('\nSchritt 3/4: Änderungen bestätigen', 'bright');
    log('───────────────────────────────────', 'bright');

    log('\nVorher:', 'red');
    log(`  ${oldSong.artist} - ${oldSong.title} (${oldSong.year})`, 'red');

    log('\nNachher:', 'green');
    log(`  ${updatedSong.artist} - ${updatedSong.title} (${updatedSong.year})`, 'green');

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

    // 2. Alte Dateien löschen (wenn Titel/Artist geändert)
    const oldFilename = `${oldSong.id}_${sanitizeFilename(oldSong.artist)}_${sanitizeFilename(oldSong.title)}_${oldSong.year}`;
    const newFilename = `${updatedSong.id}_${sanitizeFilename(updatedSong.artist)}_${sanitizeFilename(updatedSong.title)}_${updatedSong.year}`;

    if (oldFilename !== newFilename) {
      await deleteOldFiles(updatedSong.id);
    }

    // 3. Datenbanken speichern
    await saveSongs(songs);
    await updateSongsJs(songs);

    // 4. Karten neu generieren
    const generate3D = await question('\n3D-Modelle neu generieren? (j/n): ');
    const include3D = generate3D.toLowerCase() === 'j' || generate3D.toLowerCase() === 'ja';

    await generateCardFiles(updatedSong, include3D);

    log('\n╔════════════════════════════════════════════╗', 'bright');
    log('║            ✅  Fertig!  ✅                 ║', 'green');
    log('╚════════════════════════════════════════════╝\n', 'bright');

    log('Aktualisierte Dateien:', 'cyan');
    log('  • docs/songs.json', 'cyan');
    log('  • pwa/src/data/songs.js', 'cyan');
    log(`  • docs/${updatedSong.id}_*.png`, 'cyan');
    log(`  • card-generator/qr-codes/${updatedSong.id}_*.png`, 'cyan');
    log(`  • card-generator/models/${updatedSong.id}_*.scad`, 'cyan');
    if (include3D) {
      log(`  • card-generator/models/${updatedSong.id}_*.stl`, 'cyan');
    }

  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    console.error(error);
  } finally {
    rl.close();
  }
}

// Start
main();
