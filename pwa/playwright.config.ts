/**
 * End-to-end: two browsers play an online round against the real API and the
 * dev server (npm run e2e). The API runs on a throwaway database with the
 * local dev login; nothing touches the live site.
 */
import { defineConfig } from '@playwright/test'

const DB = `/tmp/mxtape-e2e-${process.pid}.db`

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    channel: 'chrome',
    locale: 'de-DE',
    headless: true,
    viewport: { width: 1280, height: 900 },
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] }
  },
  webServer: [
    {
      command: `cd ../server && MX_DB_PATH=${DB} MX_DEV_LOGIN=true MX_ENV=dev .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 4274`,
      url: 'http://127.0.0.1:4274/api/health',
      reuseExistingServer: true,
      timeout: 30_000
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: true,
      timeout: 60_000
    }
  ]
})
