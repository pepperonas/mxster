/**
 * Mock Spotify Configuration for Tests
 * This file is used during testing when spotify.config.js is not available
 */

export default {
  clientId: 'mock-spotify-client-id',
  clientSecret: 'mock-spotify-client-secret',
  redirectUri: 'http://localhost:5174/callback',
  playlistId: 'mock-playlist-id',
  scopes: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ]
}
