#!/usr/bin/env node

/**
 * mxster - Add Song CLI Tool
 *
 * Adds a new song to the game and generates 3D printable card
 *
 * Usage:
 *   node add-song.js <spotify-url>
 *   node add-song.js "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv"
 *   node add-song.js --edit <spotify-url>  # Interaktiver Modus mit Vorauswahl
 */

import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import { execSync } from 'child_process'
import { getTrackMetadata } from '../../card-generator/spotifyApi.js'
import { generateCard, generateSTL } from '../../card-generator/generateCard.js'

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root (two levels up)
dotenv.config({ path: path.join(__dirname, '../../.env') })

// Configuration
const SONGS_JSON_PATH = path.join(__dirname, '../../docs/songs.json');
const PWA_SONGS_PATH = path.join(__dirname, '../../pwa/src/data/songs.ts');

/**
 * Main function
 */
async function main() {
  console.log('\n🎵 mxster - Add Song Tool\n');

  // Check for --edit parameter
  const editMode = process.argv[2] === '--edit';
  const spotifyUrl = editMode ? process.argv[3] : process.argv[2];

  if (!spotifyUrl) {
    console.error('❌ Error: Please provide a Spotify URL');
    console.log('\nUsage:');
    console.log('  node add-song.js <spotify-url>');
    console.log('  node add-song.js --edit <spotify-url>  # Interaktiver Modus');
    console.log('\nExample:');
    console.log('  node add-song.js "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv"');
    console.log('  node add-song.js --edit "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv"');
    process.exit(1);
  }

  if (editMode) {
    console.log('🔧 Interaktiver Modus: Spotify-Metadaten können bearbeitet werden\n');
  }

  try {
    // 1. Fetch track metadata from Spotify
    console.log('🔍 Fetching track metadata from Spotify...');
    const trackData = await getTrackMetadata(spotifyUrl);
    console.log(`   ✅ Found: "${trackData.title}" by ${trackData.artist} (${trackData.year})\n`);

    // 2. Load existing songs
    console.log('📖 Loading existing songs...');
    let songs = [];
    try {
      const songsData = await fs.readFile(SONGS_JSON_PATH, 'utf8');
      songs = JSON.parse(songsData);
      console.log(`   ℹ️  Current song count: ${songs.length}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('   ℹ️  songs.json not found, creating new file');
      } else {
        throw error;
      }
    }

    // 3. Check for duplicates
    const duplicate = songs.find(s => s.spotifyId === trackData.spotifyId);
    if (duplicate) {
      console.log(`\n⚠️  Song already exists in database:`);
      console.log(`   ID: ${duplicate.id}`);
      console.log(`   Title: ${duplicate.title}`);
      console.log(`   Artist: ${duplicate.artist}`);
      console.log(`   Year: ${duplicate.year}`);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('\n❓ Generate card anyway? (y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }

      // Use existing song ID
      trackData.id = duplicate.id;
    } else {
      // 4. Generate new song ID
      const maxId = songs.reduce((max, song) => {
        const num = parseInt(song.id.replace('song_', ''));
        return num > max ? num : max;
      }, 0);
      const newId = `song_${String(maxId + 1).padStart(3, '0')}`;
      trackData.id = newId;

      // 5. Interactive mode: Allow editing Spotify metadata
      if (editMode) {
        console.log('\n📝 Metadaten bearbeiten (leer lassen = Wert von Spotify behalten)\n');

        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const newTitle = await new Promise(resolve => {
          rl2.question(`Titel [${trackData.title}]: `, resolve);
        });

        const newArtist = await new Promise(resolve => {
          rl2.question(`Interpret [${trackData.artist}]: `, resolve);
        });

        const newYearInput = await new Promise(resolve => {
          rl2.question(`Jahr [${trackData.year}]: `, resolve);
        });

        console.log('\n💡 Genre-Vorschläge: Pop, Rock, Hip-Hop, Electronic, R&B, Country, Jazz, Metal, Reggae, Soul');
        const newGenreInput = await new Promise(resolve => {
          rl2.question(`Genre (optional): `, resolve);
        });

        rl2.close();

        // Update trackData with user input (if provided)
        if (newTitle.trim()) {
          trackData.title = newTitle.trim();
        }
        if (newArtist.trim()) {
          trackData.artist = newArtist.trim();
        }
        if (newYearInput.trim()) {
          trackData.year = parseInt(newYearInput.trim());
        }
        if (newGenreInput.trim()) {
          trackData.genre = newGenreInput.trim();
        }

        console.log('\n✅ Verwendete Metadaten:');
        console.log(`   Titel:    ${trackData.title}`);
        console.log(`   Interpret: ${trackData.artist}`);
        console.log(`   Jahr:     ${trackData.year}`);
        if (trackData.genre) {
          console.log(`   Genre:    ${trackData.genre}`);
        }
        console.log('');
      }

      // 6. Create song object
      const newSong = {
        id: trackData.id,
        title: trackData.title,
        artist: trackData.artist,
        year: trackData.year,
        spotifyId: trackData.spotifyId,
        previewUrl: trackData.previewUrl
      };

      // Add genre if provided
      if (trackData.genre) {
        newSong.genre = trackData.genre;
      }

      // 6. Add to songs array
      songs.push(newSong);
      console.log(`   ✅ Added as ${newSong.id}\n`);

      // 6.5. Download from YouTube and upload to VPS
      try {
        const { downloadAndUploadSong } = await import('../audio-hosting/download-single-song.js');
        const selfHostedUrl = await downloadAndUploadSong(newSong);

        if (selfHostedUrl) {
          newSong.previewUrl = selfHostedUrl;
          console.log(`   ✅ Updated previewUrl to self-hosted: ${selfHostedUrl}\n`);
        } else {
          console.log(`   ⚠️  Using Spotify preview URL as fallback: ${trackData.previewUrl || 'none'}\n`);
        }
      } catch (error) {
        console.error(`   ❌ Audio download/upload failed: ${error.message}`);
        console.log(`   ⚠️  Using Spotify preview URL as fallback: ${trackData.previewUrl || 'none'}\n`);
      }

      // 7. Save updated songs.json
      console.log('💾 Saving songs.json...');
      await fs.writeFile(
        SONGS_JSON_PATH,
        JSON.stringify(songs, null, 2),
        'utf8'
      );
      console.log(`   ✅ songs.json updated (${songs.length} songs total)\n`);

      // 8. Update PWA songs.ts
      console.log('🔄 Updating PWA songs.ts...');
      try {
        const pwaSongsContent = `import type { Song } from '@/types'\n\nexport const songs: Song[] = ${JSON.stringify(songs, null, 2)}\n`;
        await fs.writeFile(PWA_SONGS_PATH, pwaSongsContent, 'utf8');
        console.log(`   ✅ PWA songs.ts updated\n`);
      } catch (error) {
        console.log(`   ⚠️  Could not update PWA songs.ts: ${error.message}\n`);
      }
    }

    // 9. Generate 3D card files
    console.log('🎴 Generating 3D card files...');
    const songForCard = duplicate || {
      id: trackData.id,
      title: trackData.title,
      artist: trackData.artist,
      year: trackData.year,
      spotifyId: trackData.spotifyId
    };

    const result = await generateCard(songForCard);
    console.log(`\n`);

    // 10. Update song count in README.md
    console.log('📊 Updating song count in README.md...');
    try {
      execSync('node update-song-count.js', { cwd: __dirname, stdio: 'inherit' });
    } catch (error) {
      console.log(`   ⚠️  Could not update README.md: ${error.message}\n`);
    }

    // 11. Try to generate STL files (optional)
    try {
      const stlFiles = await generateSTL(result.scadPath);
      if (stlFiles) {
        console.log(`\n`);
      }
    } catch (error) {
      // STL generation is optional, continue even if it fails
    }

    // 12. Summary
    console.log('✨ Success! Card files generated:\n');
    console.log(`   QR Code:  ${result.qrCodePath}`);
    console.log(`   OpenSCAD: ${result.scadPath}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Open ${result.scadPath} in OpenSCAD`);
    console.log(`   2. Preview with F5, Render with F6`);
    console.log(`   3. Export to STL: File → Export → Export as STL`);
    console.log(`   4. Load STL in slicer and print (QR-Code nach unten!)\n`);

    console.log(`📊 Song Details:`);
    console.log(`   Title:      ${trackData.title}`);
    console.log(`   Artist:     ${trackData.artist}`);
    console.log(`   Year:       ${trackData.year}`);
    console.log(`   Album:      ${trackData.album}`);
    console.log(`   Spotify ID: ${trackData.spotifyId}`);
    console.log(`   Preview:    ${trackData.previewUrl ? 'Available' : 'Not available'}\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);

    if (error.message.includes('Spotify credentials')) {
      console.log('\n💡 Setup instructions:');
      console.log('   1. Go to https://developer.spotify.com/dashboard');
      console.log('   2. Create an app and get Client ID and Client Secret');
      console.log('   3. Create a .env file in the project root:');
      console.log('      SPOTIFY_CLIENT_ID=your_client_id');
      console.log('      SPOTIFY_CLIENT_SECRET=your_client_secret\n');
    }

    process.exit(1);
  }
}

// Run the tool
main();
