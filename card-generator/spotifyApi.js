const axios = require('axios');

/**
 * Spotify API Helper
 * Fetches track metadata from Spotify Web API
 */

let accessToken = null;
let tokenExpiry = null;

/**
 * Get Spotify API access token
 * Uses Client Credentials flow (doesn't require user login)
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Spotify credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file'
    );
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        }
      }
    );

    accessToken = response.data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    throw new Error(`Failed to get Spotify access token: ${error.message}`);
  }
}

/**
 * Extract Spotify track ID from URL or URI
 * @param {string} input - Spotify URL or URI
 * @returns {string} Track ID
 */
function extractTrackId(input) {
  // Handle Spotify URI: spotify:track:TRACK_ID
  const uriMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // Handle Spotify URL: https://open.spotify.com/track/TRACK_ID?...
  const urlMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Assume input is already a track ID
  if (/^[a-zA-Z0-9]+$/.test(input)) return input;

  throw new Error(`Invalid Spotify URL or ID: ${input}`);
}

/**
 * Fetch track metadata from Spotify API
 * @param {string} spotifyUrl - Spotify track URL, URI, or ID
 * @returns {Object} Track metadata
 */
async function getTrackMetadata(spotifyUrl) {
  const trackId = extractTrackId(spotifyUrl);
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const track = response.data;

    // Extract release year from album release date (YYYY-MM-DD)
    const releaseYear = parseInt(track.album.release_date.split('-')[0]);

    // Get preview URL (30-second snippet)
    const previewUrl = track.preview_url || '';

    return {
      spotifyId: trackId,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      year: releaseYear,
      album: track.album.name,
      previewUrl: previewUrl,
      albumArt: track.album.images[0]?.url || '',
      duration: Math.floor(track.duration_ms / 1000), // Convert to seconds
      explicit: track.explicit
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Track not found on Spotify: ${trackId}`);
    }
    throw new Error(`Failed to fetch track metadata: ${error.message}`);
  }
}

/**
 * Search for a track on Spotify
 * @param {string} query - Search query (e.g., "artist - title")
 * @returns {Array} Array of track results
 */
async function searchTrack(query) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      'https://api.spotify.com/v1/search',
      {
        params: {
          q: query,
          type: 'track',
          limit: 10
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data.tracks.items.map(track => ({
      spotifyId: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      year: parseInt(track.album.release_date.split('-')[0]),
      album: track.album.name,
      url: track.external_urls.spotify
    }));
  } catch (error) {
    throw new Error(`Failed to search tracks: ${error.message}`);
  }
}

module.exports = {
  getTrackMetadata,
  searchTrack,
  extractTrackId
};
