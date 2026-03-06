# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxster** is a music timeline game with virtual and physical gameplay. Play digitally (recommended) or with 3D-printed QR cards. Features guess mode (points-based) and timeline modes (chronological placement).

**Current Version**: v0.1.1
**Song Database**: 209 songs with full genre data

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite 5.0 + TailwindCSS 3.4
- **Audio**: Self-Hosted Primary (209 songs @ 128 kbps MP3, ~933 MB) + Optional Spotify Premium (max 25 users)
- **Auth**: Spotify OAuth2 PKCE (optional for Premium mode)
- **PWA**: vite-plugin-pwa (Workbox service worker)
- **3D Graphics**: Three.js particle animations
- **State**: React Context API (10 contexts)
- **Cards**: Node.js + qrcode + OpenSCAD + pdfkit
- **Testing**: Vitest + @testing-library/react

## Versioning Scheme

Semantic Versioning with auto-increment: after 9 patches (e.g., 0.0.9) → increment MINOR (0.1.0). After 9 minors (e.g., 0.9.x) → increment MAJOR (1.0.0).

**Version locations**: `pwa/package.json` + `pwa/src/components/Sidebar.tsx`

## Development Commands

```bash
# PWA dev server (http://127.0.0.1:5174)
cd pwa && npm run dev

# Production build → pwa/dist/
cd pwa && npm run build

# Root integrity tests (15 tests: JSON structure, sync, fields, IDs, years)
npm test

# PWA unit/integration tests (Vitest, watch mode)
cd pwa && npm test

# PWA tests single run
cd pwa && npm run test:run

# PWA test coverage (target: 80% lines/functions, 75% branches)
cd pwa && npm run test:coverage

# TypeScript check
cd pwa && npx tsc --noEmit

# Deploy to production (https://mxster.de)
./scripts/deployment/deploy.sh
```

### Song Management
```bash
node scripts/song-management/add-song.js "spotify-url"        # Add song
node scripts/song-management/add-song.js --edit "spotify-url"  # Add with interactive genre
node scripts/song-management/edit-song.js                      # Edit existing (wizard)
node scripts/song-management/exchange-song.js                  # Replace song (keeps ID)
```

### Audio Hosting (Self-Hosted Mode)
```bash
cd scripts/audio-hosting
node download-songs.js              # Download all from YouTube (~20 min)
node download-songs.js --limit 5    # Test mode
node upload-to-vps.js               # Upload to VPS via rsync
node update-song-urls.js            # Update previewUrl in songs.json/songs.ts
node validate-audio.js --full       # Test all 209 URLs
```

### Card Generation
```bash
cd extras/card-generator
node generateCard.js            # Standard cards (85.6×53.98mm, STL)
node test-xs-generator.js       # XS 50% embossed (STL)
node test-xs-v2-generator.js    # XS 50% flat multi-color (3MF)
./scripts/build/generate-all-pdfs.sh  # 4 PDF variants
```

## Architecture

### Data Flow
```
Spotify Playlist → docs/songs.json → pwa/src/data/songs.ts + QR codes
YouTube → yt-dlp → MP3 → VPS (mxster.de/audio/) → Howler.js playback
```

### State Management (React Contexts)
- **GameContext** — Game mode, variant, players, turns, current song
- **AchievementContext** — 23 achievements, progress tracking, cross-game stats
- **GameHistoryContext** — Game history, statistics persistence
- **AuthContext** — Spotify OAuth PKCE flow
- **UIContext** — Modals, toasts, notifications
- **InteractionContext** — Particle animation activity levels
- **SettingsContext** — User preferences
- **AchievementNotificationContext** — Unlock animations

### Services Layer
- **MusicPlayerService** — Unified audio abstraction, delegates to Spotify or Preview
- **SpotifyPlayerService** — Singleton, Web Playback SDK wrapper
- **PreviewPlayerService** — Howler.js wrapper for self-hosted MP3s
- **SpotifyAuthService** — OAuth PKCE implementation
- **gameLogic** — Game rules, scoring (5+5+5/2/1), win conditions, tie-breaking
- **botPlayer** + **botStrategies/** — AI opponents (Easy/Medium/Hard)

### Audio System (Dual-Mode)
1. **Self-Hosted (Primary)**: Full songs via `mxster.de/audio/song_XXX.mp3`, password-protected (`ydl`), unlimited users
2. **Spotify Premium (Optional)**: 25 slots max (Development Mode), slot management via `pwa/spotify.slots.json`

### Game Modes
- **Hardcore**: Guess title/artist/year → points (0-15 per song, max 150) → auto-place in timeline
- **Timeline Personal**: Each player builds own chronological timeline → race to 10 correct
- **Timeline Global**: Shared timeline → most cards after 10 total placed

### Game Variants
- **Virtual Mode** (Primary): Random songs from database, no setup
- **Physical Mode**: Scan QR codes from 3D-printed cards

## Critical Configuration

### Environment Files (gitignored)
```bash
# .env (project root) — needed for song management scripts
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# pwa/spotify.config.js — needed for Spotify Premium mode
# Copy from pwa/spotify.config.example.js
```

### Path Aliases (Vite + Vitest)
`@/` → `src/`, `@components/`, `@hooks/`, `@contexts/`, `@services/`, `@utils/`, `@types/`

### Test Setup (`pwa/src/test/setup.ts`)
Mocks: localStorage, matchMedia, Howler, Spotify SDK, QR Scanner, Three.js, IntersectionObserver. `spotify.config.js` is aliased to `spotify.config.mock.js` in test environment.

## Project Structure

```
mxster/
├── pwa/                        # React PWA (main application)
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Router + context providers
│   │   ├── screens/           # Page components (LandingPage, GameScreen, PlayerSetup, etc.)
│   │   ├── components/        # Reusable UI (Modal, Sidebar, MusicPlayer, etc.)
│   │   ├── contexts/          # 10 React contexts for state management
│   │   ├── services/          # Business logic (audio, game, bot AI)
│   │   ├── types/             # TypeScript definitions (index.ts, achievements.ts, spotify.ts)
│   │   ├── utils/             # Animations, auth, persistence
│   │   ├── hooks/             # Custom React hooks
│   │   └── data/songs.ts      # Generated song data (auto-generated from songs.json)
│   ├── public/                # Static assets, sitemap.xml, robots.txt
│   ├── vite.config.ts         # Build config (port 5174, PWA plugin, path aliases)
│   ├── vitest.config.ts       # Test config (jsdom, coverage thresholds)
│   └── spotify.slots.json     # Spotify slot management (25 total)
├── docs/songs.json            # Source of truth for song database
├── extras/
│   ├── card-generator/        # OpenSCAD card generation (STL, 3MF, PDF)
│   └── build/                 # Release archives
├── scripts/
│   ├── song-management/       # add-song.js, edit-song.js, exchange-song.js
│   ├── audio-hosting/         # download-songs.js, upload-to-vps.js, validate-audio.js
│   ├── deployment/deploy.sh   # Production deploy (rsync to VPS, preserves audio)
│   └── build/                 # PDF generation, release workflow
├── test-integrity.js          # 15 cross-project integrity tests
└── .github/workflows/         # CI: test.yml (integrity), ci.yml (vitest + build)
```

## Deployment

- **Domain**: https://mxster.de
- **VPS**: root@mrx3k1.de → `/var/www/html/mxster/`
- **SSL**: Let's Encrypt (auto-renewing)
- **Deploy**: `./scripts/deployment/deploy.sh` — builds PWA, rsync uploads (excludes audio/), preserves 209 audio files on VPS
- **nginx**: SEO exceptions for `robots.txt`/`sitemap.xml` via exact-match `location =` blocks overriding security rules that block `.txt` files

## Key Implementation Details

### Scoring System (Hardcore Mode)
- Title correct: +5 points (fuzzy matching)
- Artist correct: +5 points (fuzzy matching)
- Year exact: +5 | ±1 year: +2 | ±2 years: +1
- Maximum: 15 points per song, 150 total (10 songs)

### Achievement System
23 achievements total. Cross-game tracking via game history. Key thresholds: MUSIC_EXPERT (1000 pts), GRAND_MASTER (5000 pts). Bot victory achievements track by difficulty. `guessDetails` on Song interface enables accurate tracking (titleCorrect, artistCorrect, yearPoints).

### Bot Player System
- 3 difficulties: Easy (30-50% win), Medium (60-75%), Hard (90-95%)
- Strategy Pattern: `HardcoreBotStrategy` and `TimelineBotStrategy`
- Anti-double-execution: `lastBotSongRef` prevents multiple actions per turn
- Only available in Virtual Mode with exactly 1 human player

### MusicPlayer Component
Always kept mounted (never conditionally rendered) — unmounting causes re-initialization delays. SpotifyPlayerService uses polling to wait for both `connect()` success AND `isReady === true` before resolving.

### Sidebar Navigation
3-state system based on `location.pathname` + `isGameStarted`: Landing Page (marketing links), Setup Phase (config links + back warning), In-Game (help + exit with confirmation).

## Best Practices

### TypeScript
- Song type: Always use `export const songs: Song[] = [...]` (not untyped)
- Test regex for songs.ts: `/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/`
- Song interface: Only interface-defined fields allowed

### Song Management
- All scripts require `.env` with Spotify credentials
- Auto-generated files: QR codes, SCAD, STL, songs.json, songs.ts
- Genre field: Optional, suggestions: Pop, Rock, Hip-Hop, Electronic, R&B, Country, Jazz, Metal, Reggae, Soul
- `exchange-song.js` requires `import 'dotenv/config'`

### Modals on Mobile
- Modals use `pt-20 pb-6` backdrop (80px top for ActionBar, 24px bottom safe area)
- Max height: `max-h-[calc(100vh-12rem)] sm:max-h-[85vh]`
- `viewport-fit=cover` in meta tag for iOS/Android safe areas
- All custom dialogs (PasswordProtection, Achievements, etc.) must follow same pattern

### OpenSCAD Performance
All scripts use `--enable=manifold --enable=fast-csg` flags for faster STL generation (requires OpenSCAD 2021.01+).

### Release Checklist
1. Update version in `pwa/package.json` + `pwa/src/components/Sidebar.tsx`
2. Run `node scripts/song-management/update-song-count.js`
3. Commit → `git tag vX.Y.Z` → `git push origin vX.Y.Z` → `gh release create`
4. Deploy: `./scripts/deployment/deploy.sh`
