import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'assets/favicon.ico',
        'assets/apple-touch-icon.png',
        'assets/favicon-16x16.png',
        'assets/favicon-32x32.png'
      ],
      manifest: {
        name: 'mxster - Music Timeline Game',
        short_name: 'mxster',
        description: 'Rate Songs und platziere sie in der richtigen zeitlichen Reihenfolge',
        theme_color: '#BB86FC',
        background_color: '#1a1a1a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/assets/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/assets/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/assets/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.spotify\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'spotify-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ]
})
