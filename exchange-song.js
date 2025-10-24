#!/usr/bin/env node

/**
 * Interactive Song Exchange Wizard
 *
 * Ersetzt einen bestehenden Song komplett durch einen neuen Song von Spotify.
 * Behält die Song-ID bei, lädt neue Metadaten und regeneriert alle Dateien.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');
const { getTrackMetadata } = require('./card-generator/spotifyApi');
const { generateCard, generateSTL } = require('./card-generator/generateCard');
const { execSync } = require('child_process');

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

// QR-Code und Karten generieren (inkl. 3D-Modelle)
async function generateCardFiles(song) {
  log('🔄 Generiere Karten-Dateien (QR-Code + 3D-Modelle)...', 'cyan');

  try {
    // Generiere Card (QR-Code + SCAD)
    const result = await generateCard(song);

    // Kopiere QR-Code nach docs/
    const docsQrPath = path.join(__dirname, 'docs', path.basename(result.qrCodePath));
    await fs.copyFile(result.qrCodePath, docsQrPath);
    log(`✅ QR-Code generiert: ${docsQrPath}`, 'green');

    // Generiere STL (IMMER)
    try {
      const stlResult = await generateSTL(result.scadPath);
      if (stlResult) {
        log(`✅ 3D-Modelle generiert (SCAD + STL)`, 'green');
      }
    } catch (error) {
      log(`⚠️  STL-Generierung fehlgeschlagen: ${error.message}`, 'yellow');
      log(`   💡 Tipp: Installiere OpenSCAD von https://openscad.org/`, 'yellow');
    }

    return result;
  } catch (error) {
    log(`❌ Fehler beim Generieren der Karten: ${error.message}`, 'red');
    throw error;
  }
}

// PDF-Karten generieren (alle Songs)
async function generatePDFCards() {
  log('🔄 Generiere PDF-Karten (alle Songs)...', 'cyan');

  try {
    const pdfScript = path.join(__dirname, 'generate-all-pdfs.sh');
    execSync(`"${pdfScript}"`, {
      cwd: __dirname,
      stdio: 'inherit'
    });

    log('✅ PDF-Karten generiert', 'green');
  } catch (error) {
    log(`❌ Fehler beim Generieren der PDF-Karten: ${error.message}`, 'red');
  }
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

    // 1. Alte Dateien löschen
    await deleteOldFiles(songId);

    // 2. Song-Objekt erstellen (behält die alte ID!)
    const newSong = {
      id: songId,  // WICHTIG: Behält die alte ID!
      title: trackData.title,
      artist: trackData.artist,
      year: trackData.year,
      audioUrl: `https://example.com/${songId}.mp3`,
      spotifyId: trackData.spotifyId,
      youtubeUrl: '',
      previewUrl: trackData.previewUrl || ''
    };

    // 3. In Array ersetzen
    songs[songIndex] = newSong;

    // 4. Datenbanken speichern
    await saveSongs(songs);
    await updateSongsJs(songs);

    // 5. Karten neu generieren (QR-Code + SCAD + STL)
    await generateCardFiles(newSong);

    // 6. PDF-Karten generieren (optional)
    const generatePDF = await question('\nPDF-Karten neu generieren (alle Songs)? (j/n): ');
    if (generatePDF.toLowerCase() === 'j' || generatePDF.toLowerCase() === 'ja') {
      await generatePDFCards();
    }

    log('\n╔════════════════════════════════════════╗', 'bright');
    log('║        ✅  Fertig!  ✅             ║', 'green');
    log('╚════════════════════════════════════════╝\n', 'bright');

    log('Aktualisierte Dateien:', 'cyan');
    log('  • docs/songs.json', 'cyan');
    log('  • pwa/src/data/songs.js', 'cyan');
    log(`  • docs/${songId}_*.png`, 'cyan');
    log(`  • card-generator/qr-codes/${songId}_*.png`, 'cyan');
    log(`  • card-generator/models/${songId}_*.scad`, 'cyan');
    log(`  • card-generator/models/${songId}_*.stl`, 'cyan');
    if (generatePDF.toLowerCase() === 'j' || generatePDF.toLowerCase() === 'ja') {
      log(`  • pwa/mxster-cards-*.pdf`, 'cyan');
    }

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
