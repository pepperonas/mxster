# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxster** is a music timeline game with virtual and physical gameplay. Play digitally (recommended) or with 3D-printed QR cards. Features guess mode (points-based) and timeline modes (chronological placement).

**Current Version**: v0.1.1
**Song Database**: 209 songs with full genre data

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite 5.0 + TailwindCSS 3.4
- **Design**: Material 3 Expressive (token layer, dark + light, spring motion) — see "Design System" below
- **Routing**: react-router-dom 7 **data router** (`createBrowserRouter`) — required for View Transitions
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
3-state system based on `location.pathname` + `isGameStarted`: Landing Page (marketing links), Setup Phase (config links + back warning), In-Game (help + exit with confirmation). The `<aside>` stays **mounted when closed** (slides off-canvas, `inert` + `aria-hidden`) so it can animate out.

## Design System — Material 3 Expressive (2026-07)

**Single source of truth: `pwa/src/styles/design-tokens.css`.** Nothing outside it holds raw color. Motion primitives live in `pwa/src/styles/motion.css`, component classes in `pwa/src/styles/tailwind.css`.

**Color.** Tonal ramps generated offline with `@material/material-color-utilities` — primary seed `#00B2E3` (electric cyan), tertiary seed `#FF6B35` (coral, the legacy accent), neutrals derived from the legacy background `#1A1C27` (keeps the indigo tint). Values are **RGB channel triplets** (`--md-sys-color-primary: 104 211 255`) because Tailwind colors are declared as `rgb(var(--…) / <alpha-value>)` — full-color vars would silently drop alpha modifiers like `border-accent/30`.

**Legacy aliases are the leverage point:** `tailwind.config.js` keeps every historic name and repoints it at an M3 role, so ~500 existing utility usages retheme with zero markup churn — `background`→surface, `primary`→**surface-container** (it was always the card background), `secondary`→**M3 primary** (cyan), `accent`→**M3 tertiary** (coral), `border`→outline-variant, `danger`→error, `text-primary`→on-surface, `text-secondary`→on-surface-variant. New code uses the additive `md-*` namespace (`bg-md-surface-container-high`, `text-md-on-primary`). Elevation is expressed through surface tones, not shadows.

**Theming.** `data-theme="dark|light"` on `<html>`, default dark, persisted inside `mxster_settings` (SettingsContext) and applied pre-paint by an inline script in `index.html` (no FOUC). Toggle sits in the ActionBar (🌙/☀️) and SettingsDialog; switching runs an **M3 circular reveal** through the View Transitions API (`utils/themeReveal.ts`), falling back to an instant swap. `theme-color` meta and the manifest/loader colors all mirror the token hexes. The brand gradient (`.text-gradient`) has theme-aware endpoints (`--brand-gradient-from/to`): light tones on dark, tone-50 on light — tone-40 endpoints blend to mud.

**Motion.** Spring tokens: `--m3-spatial-fast|default|slow` (350/500/650 ms, overshoot beziers) for position/size/shape, `--m3-effects-*` (150/200/300 ms, no overshoot) for color/opacity. Duration and easing also exist separately (`--m3-dur-*`/`--m3-ease-*`) because Tailwind needs them apart; utilities are `duration-m3-spatial`/`ease-m3-spatial` etc. **One `prefers-reduced-motion` block collapses every token to 120 ms ease** — that plus a `prefersReducedMotion()` gate in `ParticleBackground` (skips WebGL entirely) and in `utils/ripple.ts` covers the whole app. Speed guide: fast → buttons/switches/press morphs, default → dialogs/sheets/sidebar/cards, slow → route transitions.

**Shape & feedback.** 10-step corner scale (`rounded-m3-xs … m3-full`). Signature move is **shape morphing on press**: `.btn` is a pill that morphs to `--m3-shape-lg` + `scale(0.96)` while pressed; the play button morphs circle→squircle while playing. State layers (`.m3-state-layer`, `::after` overlay in `currentColor`) replace hover-lift; a delegated ripple (`utils/ripple.ts`) adds tactility as progressive enhancement. `.stagger-children` gives lists/grids a 40 ms-stepped spring reveal.

**Route transitions.** `useAppNavigate()` (`hooks/useAppNavigate.ts`) wraps `navigate()` with `viewTransition: true` unless reduced motion — **use it instead of `useNavigate()`**. This requires the data router; under the old `<BrowserRouter>` the option is a silent no-op. Persistent chrome (ActionBar, MusicPlayer, particle canvas, brand mark) carries `view-transition-name` so it stays put instead of being swept into the root snapshot.

**Typography.** Roboto Flex variable font (loaded via `<link>` in `index.html`, Inter as fallback), M3 type scale as utilities (`.text-display-lg` … `.text-label-sm`) plus `.text-emphasized` (variable `wght`/`wdth` axes) for hero moments.

**Gotcha:** `beatAnimations.css` consumes `var(--background)`, `--primary`, `--secondary`, `--accent`, `--border`, `--text-*`. These were referenced but never defined before the token layer existed (the rules were silently inert); they are now real aliases in `design-tokens.css`, so changes there affect the beat UI.

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
- Panel styling comes from the shared `.m3-dialog-panel` class (surface-container-high, 28px corners, spring entrance); scrim uses `bg-md-scrim/60` + the `m3-scrim-in` animation
- Touch targets ≥48px (`.touch-target` for icon buttons); `hoverOnlyWhenSupported` is enabled in `tailwind.config.js`, so `hover:` utilities never fire on touch

### OpenSCAD Performance
All scripts use `--enable=manifold --enable=fast-csg` flags for faster STL generation (requires OpenSCAD 2021.01+).

### Release Checklist
1. Update version in `pwa/package.json` + `pwa/src/components/Sidebar.tsx`
2. Run `node scripts/song-management/update-song-count.js`
3. Commit → `git tag vX.Y.Z` → `git push origin vX.Y.Z` → `gh release create`
4. Deploy: `./scripts/deployment/deploy.sh`
