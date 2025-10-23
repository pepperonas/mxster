export default {
  clientId: 'YOUR_SPOTIFY_CLIENT_ID',
  clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET',
  playlistId: 'YOUR_SPOTIFY_PLAYLIST_ID',
  // Note: Redirect URI is determined automatically in spotifyAuth.js
  // Development: http://localhost:5174/callback
  // Production: https://mxster.de/callback
  scopes: [
    'streaming',              // Web Playback SDK
    'user-read-email',        // User info
    'user-read-private',      // User info
    'user-modify-playback-state',  // Control playback
    'user-read-playback-state'     // Read playback state
  ]
}
