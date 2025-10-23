#!/usr/bin/env node

/**
 * mxster - Add Song CLI Tool
 *
 * Adds a new song to the game and generates 3D printable card
 *
 * Usage:
 *   node add-song.js <spotify-url>
 *   node add-song.js "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv"
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { getTrackMetadata } = require('./card-generator/spotifyApi');
const { generateCard, generateSTL } = require('./card-generator/generateCard');

// Configuration
const SONGS_JSON_PATH = './docs/songs.json';
const PWA_SONGS_PATH = './pwa/src/data/songs.js';

/**
 * Main function
 */
async function main() {
  console.log('\n🎵 mxster - Add Song Tool\n');

  // Get Spotify URL from command line
  const spotifyUrl = process.argv[2];

  if (!spotifyUrl) {
    console.error('❌ Error: Please provide a Spotify URL');
    console.log('\nUsage:');
    console.log('  node add-song.js <spotify-url>');
    console.log('\nExample:');
    console.log('  node add-song.js "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv"');
    process.exit(1);
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

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('\n❓ Generate card anyway? (y/N): ', resolve);
      });
      readline.close();

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

      // 5. Prompt for YouTube URL (optional)
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const youtubeUrl = await new Promise(resolve => {
        readline.question('\n🎬 YouTube URL (optional, Enter to skip): ', resolve);
      });
      readline.close();

      // 6. Create song object
      const newSong = {
        id: trackData.id,
        title: trackData.title,
        artist: trackData.artist,
        year: trackData.year,
        audioUrl: `https://example.com/${trackData.id}.mp3`, // Placeholder
        spotifyId: trackData.spotifyId,
        youtubeUrl: youtubeUrl.trim() || '', // Use provided URL or empty string
        previewUrl: trackData.previewUrl
      };

      // 6. Add to songs array
      songs.push(newSong);
      console.log(`   ✅ Added as ${newSong.id}\n`);

      // 7. Save updated songs.json
      console.log('💾 Saving songs.json...');
      await fs.writeFile(
        SONGS_JSON_PATH,
        JSON.stringify(songs, null, 2),
        'utf8'
      );
      console.log(`   ✅ songs.json updated (${songs.length} songs total)\n`);

      // 8. Update PWA songs.js
      console.log('🔄 Updating PWA songs.js...');
      try {
        const pwaSongsContent = `export const songs = ${JSON.stringify(songs, null, 2)}\n`;
        await fs.writeFile(PWA_SONGS_PATH, pwaSongsContent, 'utf8');
        console.log(`   ✅ PWA songs.js updated\n`);
      } catch (error) {
        console.log(`   ⚠️  Could not update PWA songs.js: ${error.message}\n`);
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

    // 10. Copy QR code PNG to docs/ directory
    console.log('📋 Copying QR code to docs/...');
    const docsQrPath = path.join('./docs', path.basename(result.qrCodePath));
    try {
      await fs.copyFile(result.qrCodePath, docsQrPath);
      console.log(`   ✅ QR code copied: ${docsQrPath}\n`);
    } catch (error) {
      console.log(`   ⚠️  Could not copy QR code to docs/: ${error.message}\n`);
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
    console.log(`   QR Code (card-generator): ${result.qrCodePath}`);
    console.log(`   QR Code (docs):           ${docsQrPath}`);
    console.log(`   OpenSCAD:                 ${result.scadPath}`);
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
