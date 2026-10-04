/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_SPOTIFY_REDIRECT_URI: string
  readonly VITE_APP_VERSION: string
  /** Google OAuth Web Client ID (public). Empty/unset = Google sign-in hidden. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
