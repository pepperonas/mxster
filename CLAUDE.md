# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxster** is a music timeline game with virtual and physical gameplay. Play digitally (recommended) or with 3D-printed QR cards. Features guess mode (points-based) and timeline modes (chronological placement).

**Current Version**: v0.3.0 (real motion & physics on top of the M3 Expressive design system from v0.2.0)
**Song Database**: 211 songs with full genre data (source of truth: `docs/songs.json`; root `package.json` version is stale and unused)

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite 5.0 + TailwindCSS 3.4
- **Design**: Material 3 Expressive (token layer, dark + light) — see "Design System" below
- **Motion**: `motion` (motion.dev, `motion/react` via LazyMotion + `m.*`) for physical springs, gestures, layout and exit animations; CSS uses the same springs as generated `linear()` tokens
- **Routing**: react-router-dom 7 **data router** (`createBrowserRouter`) — required for View Transitions
- **Audio**: Self-Hosted Primary (211 songs @ 128 kbps MP3, ~0.9 GB) + Optional Spotify Premium (max 25 users)
- **Auth**: Spotify OAuth2 PKCE (optional for Premium mode) + Google sign-in via Google Identity Services (client-only, player identity)
- **PWA**: vite-plugin-pwa (Workbox service worker)
- **3D Graphics**: Three.js particle animations
- **State**: React Context API (9 contexts, composed in `contexts/AppProviders.tsx`)
- **Cards**: Node.js + qrcode + OpenSCAD + pdfkit
- **Testing**: Vitest + @testing-library/react

## Versioning Scheme

Semantic Versioning with auto-increment: after 9 patches (e.g., 0.0.9) → increment MINOR (0.1.0). After 9 minors (e.g., 0.9.x) → increment MAJOR (1.0.0).

**Version locations**: `pwa/package.json` + hard-coded string `Version X.Y.Z` in `pwa/src/components/Sidebar.tsx` (~line 426) — keep both in sync.

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

# Single test file / single test name
cd pwa && npx vitest run src/services/__tests__/gameLogic.test.ts
cd pwa && npx vitest run -t "test name substring"

# PWA test coverage (target: 80% lines/functions, 75% branches)
cd pwa && npm run test:coverage

# TypeScript check
cd pwa && npx tsc --noEmit

# Deploy to production (https://mxster.celox.io)
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
node validate-audio.js --full       # Test all audio URLs
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
YouTube → yt-dlp → MP3 → VPS (mxster.celox.io/audio/) → Howler.js playback
```

### State Management (React Contexts)
- **GameContext** — Game mode, variant, players, turns, current song
- **AchievementContext** — 23 achievements, progress tracking, cross-game stats
- **GameHistoryContext** — Game history, statistics persistence
- **AuthContext** — Spotify OAuth PKCE flow
- **GoogleAuthContext** — Google sign-in (profile only); see "Google Sign-In" below
- **UIContext** — Modals (keyed, `closeModal(): Promise` resolves on exit), toasts, sidebar
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

### Game Loop (`src/game/`)
`useTurnFlow` is an explicit phase machine — `idle → placing` (timeline modes) / `guessing` (hardcore) `→ revealed → next turn | over`. GameScreen only renders the phase; rules come from pure modules: `placement.ts` (`evaluatePlacement`, equal years allowed either side, `gapLabel`), `guess.ts` (5/5/5-2-1 breakdown), `skipRules.ts` (33 % per extra skip, 95 % cap), `achievementRules.ts` (returns ordered unlock/progress effects). Credit timing is part of the rules: timeline modes credit a correct card **on placement** and check the win on "Nächster Spieler"; hardcore credits card + points on "Weiter". Dialogs remain only for real decisions (skip penalty/danger zone — `required`, so dismissing can't stall a turn — leaving, game end).

The board (`components/game/TimelineBoard.tsx`) is one vertical list with real insertion gaps (`<button>`s with spoken labels). Placing = drag the dock card (`PlacementDock`) or tap a gap → preview in the gap → one confirm. Drag target = `computeInsertionIndex` (`game/boardGeometry.ts`): gap centres measured on grab, velocity projection capped at one row, 8 px hysteresis; the highlight changes only transform/colour so the measured layout stays valid. The pending card shares `layoutId="pending-card"` between dock and board. **Never render the year of a pending card** (tests check the DOM).

### Audio System (Dual-Mode)
1. **Self-Hosted (Primary)**: Full songs via `mxster.celox.io/audio/song_XXX.mp3`, behind a client-side password dialog (`PasswordProtectionDialog`; not real access control — nginx serves the MP3s unauthenticated), unlimited users
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
│   │   ├── contexts/          # 9 React contexts + AppProviders
│   │   ├── game/              # Pure game rules + useTurnFlow phase machine + drag geometry (all tested)
│   │   ├── motion/            # Springs (single source), reduced-motion policy, view-transition gate, providers
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

- **Domain**: https://mxster.celox.io (since 2026-10-04; `mxster.de` was given up — its vHost is now a pure 301 to the new domain while its DNS still points here)
- **VPS**: root@69.62.121.168 → `/var/www/html/mxster/`, nginx vHost `/etc/nginx/sites-available/mxster.celox.io` (symlinked; cert via certbot webroot + `renew_hook`). ⚠️ Before 2026-10-04 `sites-enabled/mxster.de` was a standalone file that had drifted from the stale `sites-available` copy — always edit the file nginx actually loads (`nginx -T`)
- **Spotify**: redirect URI is `https://mxster.celox.io/callback` (`SpotifyAuthService.getRedirectUri`) and must be registered in the Spotify Developer Dashboard
- **Build env**: `deploy.sh` builds locally, so `pwa/.env.production` on the deploying machine is what ships
- **SSL**: Let's Encrypt (auto-renewing)
- **Deploy**: `./scripts/deployment/deploy.sh` — builds PWA, rsyncs `dist/` to `/tmp` staging on the VPS (excludes `audio/`), then swaps it in; the MP3s on the VPS are never touched
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
- Bots play through the same `placeCard`/`submitGuess` entry points as humans (`useTurnFlow`, via `useEffectEvent`); a `botBusy` ref keeps a song change mid-think from starting a second turn
- Only available in Virtual Mode with exactly 1 human player

### MusicPlayer Component
Always kept mounted (never conditionally rendered) — unmounting causes re-initialization delays. SpotifyPlayerService uses polling to wait for both `connect()` success AND `isReady === true` before resolving.

### Sidebar Navigation
3-state system based on `location.pathname` + `isGameStarted`: Landing Page (marketing links), Setup Phase (config links + back warning), In-Game (help + exit with confirmation). The `<aside>` stays **mounted when closed** (slides off-canvas, `inert` + `aria-hidden`) so it can animate out.

## Design System — Material 3 Expressive (2026-07)

**Single source of truth: `pwa/src/styles/design-tokens.css`.** Nothing outside it holds raw color. Motion primitives live in `pwa/src/styles/motion.css`, component classes in `pwa/src/styles/tailwind.css`.

**Color.** Tonal ramps generated offline with `@material/material-color-utilities` — primary seed `#00B2E3` (electric cyan), tertiary seed `#FF6B35` (coral, the legacy accent), neutrals derived from the legacy background `#1A1C27` (keeps the indigo tint). Values are **RGB channel triplets** (`--md-sys-color-primary: 104 211 255`) because Tailwind colors are declared as `rgb(var(--…) / <alpha-value>)` — full-color vars would silently drop alpha modifiers like `border-accent/30`.

**Legacy aliases are the leverage point:** `tailwind.config.js` keeps every historic name and repoints it at an M3 role, so ~500 existing utility usages retheme with zero markup churn — `background`→surface, `primary`→**surface-container** (it was always the card background), `secondary`→**M3 primary** (cyan), `accent`→**M3 tertiary** (coral), `border`→outline-variant, `danger`→error, `text-primary`→on-surface, `text-secondary`→on-surface-variant. New code uses the additive `md-*` namespace (`bg-md-surface-container-high`, `text-md-on-primary`). Elevation is expressed through surface tones, not shadows.

**Theming.** `data-theme="dark|light"` on `<html>`, default dark, persisted inside `mxster_settings` (SettingsContext) and applied pre-paint by an inline script in `index.html` (no FOUC). Toggle sits in the ActionBar (🌙/☀️) and SettingsDialog; switching runs an **M3 circular reveal** through the View Transitions API (`utils/themeReveal.ts`), falling back to an instant swap. `theme-color` meta and the manifest/loader colors all mirror the token hexes. **No text gradients (v0.2.1 premium pass):** `.text-gradient` is kept as a class name but now renders solid `on-surface`; the single brand accent is `.text-brand` (solid cyan), reserved for the wordmark and hero data numbers. The `--brand-gradient-from/to` tokens still exist but are no longer used for text. Shadows use the M3 elevation scale `shadow-m3-1…5` (the neon-era `glow-*` names are gone).

**Motion & physics (v0.3.0).** One source: `src/motion/springs.ts` holds the M3 Expressive specs (stiffness + damping ratio: spatial fast/default/slow 800·0.6 / 380·0.8 / 200·0.8, effects 3800/1600/800 at ζ 1). Motion gets them as real springs (`spring.spatialDefault`, damping = 2ζ√k — velocity survives interruption). CSS gets the same springs sampled from the closed-form solution as `linear()` easings in a **generated block** in `design-tokens.css` (bezier values above it are the fallback) — after changing a spec run `UPDATE_SPRING_CSS=1 npx vitest run springs`; the test fails if the block drifts. Spatial = position/size/shape (may overshoot), effects = colour/opacity (never). Speed guide: fast → buttons/switches/chips, default → dialogs/sheets/cards/board, slow → route-level and celebrations.

**One reduced-motion policy** (`motion/policy.ts`, live media query): `MotionConfig reducedMotion="user"` makes transforms instant, CSS spatial tokens become 0 ms, effects keep a 120 ms fade, smooth scroll is off, the WebGL background is replaced by a static gradient (live), confetti and the ripple are skipped. Decorative infinite loops (`animate-bounce/ping/pulse`) stop; spinners keep turning.

Motion is loaded with `<LazyMotion strict features={domMax async}>` (`motion/MotionProvider.tsx`) — **only `m.*` components; importing `motion` throws** (and a test greps for it). Building blocks: `AnimatedNumber` (spring count, aria-safe), `SegmentedControl` (sliding pill via layoutId), `Switch` (thumb travels on a spring), `celebrate()` (confetti in token colours), `FeedbackLayer` (reactions + aria-live announcements; no full-screen effects).

**Shape & feedback.** 10-step corner scale (`rounded-m3-xs … m3-full`). Signature move is **shape morphing on press**: `.btn` is a pill that morphs to `--m3-shape-lg` + `scale(0.96)` while pressed; the play button morphs circle→squircle while playing. State layers (`.m3-state-layer`, `::after` overlay in `currentColor`) replace hover-lift; a delegated two-phase ripple (`utils/ripple.ts`: spreads while held, fades on release) adds tactility. `.stagger-children` grids and `[data-reveal]` blocks reveal when scrolled into view (`motion/useScrollReveal.ts`, IntersectionObserver; without it everything shows). Elevation: `shadow-m3-1…5` (`--md-sys-elevation-*`).

**Route transitions.** `useAppNavigate()` (`hooks/useAppNavigate.ts`) wraps `navigate()` with `viewTransition: true` unless reduced motion — **use it instead of `useNavigate()`**. This requires the data router; under the old `<BrowserRouter>` the option is a silent no-op. Persistent chrome (ActionBar, particle canvas, brand mark) carries `view-transition-name` so it stays put. **Routes stay on View Transitions; Motion animates only within a page** — never give one element both a `view-transition-name` and a Motion `layout` prop, and `layoutId` does not cross routes. Shared elements across the setup flow use VT names (`SelectionTrail`: the tapped mode/variant icon travels into the next screen's chips). `motion/viewTransitionGate.ts` wraps `document.startViewTransition` and sets `html.vt-active` while one runs, so page-entry keyframes finish instantly instead of animating twice.

**Typography.** Roboto Flex variable font (loaded via `<link>` in `index.html`, Inter as fallback), M3 type scale as utilities (`.text-display-lg` … `.text-label-sm`) plus `.text-emphasized` (variable `wght`/`wdth` axes) for hero moments.

**Motion gotchas (all hit during v0.3.0):**
- `.m3-dialog-panel` is a surface style only — CSS entrance keyframes live in `.m3-dialog-enter` (for dialogs not driven by Motion). Combining CSS keyframes and Motion on one element makes them fight (the dialog froze at 28 % opacity).
- `<Modal>` dialogs take their content as a **prop snapshot**: an exiting dialog reading live context would show the next dialog's content while leaving. `closeModal()` returns a promise that resolves on exit (700 ms safety net); `AnimatePresence mode="wait"` sequences consecutive dialogs — no `setTimeout` chains.
- Closing a dialog pops its history entry with `history.back()`, whose popstate arrives **asynchronously**; one global listener swallows self-caused pops (otherwise it closed the next dialog).
- In tests, wrap `m.*` components in `test/MotionTestProvider` (sync features — without them exits never complete) and don't `await act(() => closeModal())` (deadlocks until the safety net); close in a sync act, then `waitFor`. `MotionGlobalConfig.skipAnimations` is set in `test/setup.ts`; `setReducedMotion()` from `test/motion.ts`.
- The particle background must never use React state per frame: parameters live in refs and the loop interpolates them (`motion/backgroundControl.quietBackground()` lets a gesture lower its frame rate). three.js is lazy-loaded in `App.tsx`; keep it out of the `components/game` barrel.
- The `InteractionContext` pulse is an event (`pulseIntensity` + `pulseSeq`), not a decaying state.
- After changing `tailwind.config.js`, restart the dev server — new utility classes (e.g. colour roles) are otherwise not generated.

## Google Sign-In

Client-only (no backend): `services/googleIdentity.ts` lazy-loads `accounts.google.com/gsi/client`, Google's button returns an ID token, `profileFromCredential` checks `aud`/`iss`/`exp`/`email_verified` and keeps only `{sub,email,name,givenName,picture}` in localStorage `mxster_google_profile` — **the token is never stored**. The signature is not verifiable without a server, so the profile is display-only; anything security-relevant (cloud sync, leaderboards) needs server-side verification first.

- Configured via `VITE_GOOGLE_CLIENT_ID` in `pwa/.env.production` / `.env.local` (gitignored; template `pwa/.env.example`). Empty = all Google UI hidden. No client secret exists in this flow — never add one.
- **Two-step on purpose:** nothing talks to Google until the user taps our own "Mit Google anmelden"; only then the script loads and Google's official button renders. Keep it that way (privacy).
- **The button slot is owned by Google:** `renderButton` clears the slot element, so React must never render children into it (a React-owned "Lädt…" inside it crashed with `NotFoundError` — caught by `GoogleSignIn.test.tsx`).
- Google Cloud Console: OAuth client type "Web application", authorized JavaScript origins `https://mxster.celox.io`, `http://localhost:5174`, `http://127.0.0.1:5174`; no redirect URIs needed.

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
- `<Modal>` renders a centred spring dialog on desktop and a **bottom sheet** on phones (`COMPACT_QUERY`); dismissible sheets close with a downward fling from the handle, `required` dialogs never close by gesture/Escape/backdrop. Focus moves in, Tab is trapped, `#app` is `inert`, focus returns to the opener.
- Custom dialogs (PasswordProtection, Achievements, Settings) use `.m3-dialog-panel` + `.m3-dialog-enter`
- Touch targets ≥48px (`.touch-target` for icon buttons); `hoverOnlyWhenSupported` is enabled in `tailwind.config.js`, so `hover:` utilities never fire on touch

### OpenSCAD Performance
All scripts use `--enable=manifold --enable=fast-csg` flags for faster STL generation (requires OpenSCAD 2021.01+).

### Release Checklist
1. Update version in `pwa/package.json` + `pwa/src/components/Sidebar.tsx`
2. Run `node scripts/song-management/update-song-count.js`
3. Commit → `git tag vX.Y.Z` → `git push origin vX.Y.Z` → `gh release create`
4. Deploy: `./scripts/deployment/deploy.sh`
