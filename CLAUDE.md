# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxster** is a music timeline game combining hardware (3D-printed QR cards) and software (PWA with camera scanner). Players scan physical cards or play virtually. Features guess mode (points-based) and timeline modes (chronological placement).

**Current Song Database**: 209 songs with full genre data (as of 2025-11-04)

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite 5.0
- **Audio**: Hybrid System - Spotify Web Playback SDK (Premium, max 25 users) + Howler.js (Preview, unlimited users)
- **Auth**: Spotify OAuth2 PKCE (optional for Premium mode)
- **PWA**: vite-plugin-pwa
- **3D Graphics**: Three.js particle animations
- **State**: React Context API
- **Cards**: Node.js + qrcode + Canvas

## Development Commands

### PWA Development
```bash
cd pwa

# Development server (localhost:5174)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Spotify Integration
```bash
cd pwa
npm run import-spotify  # Import from playlist (creates songs.ts + songs.json)
npm run update-previews # Fetch current preview URLs
npm run filter-songs    # Remove invalid songs (auto-backup)
```

### 3D Card Generation (SCAD + STL + 3MF)

**Three Generator Variants Available:**

#### 1. Standard Generator (Full Size)
```bash
cd card-generator
node generateCard.js
```
Outputs: `output/models/*.scad`, `*.stl`
- **Dimensions**: 85.6mm × 53.98mm × 1.6mm (credit card size)
- **QR Code**: 48mm, engraved
- **Text**: Engraved on back

#### 2. XS Generator (50% Test Prints - Embossed)
```bash
cd card-generator
node test-xs-generator.js
```
Outputs: `output/models-xs/*.scad`, `*.stl`
- **Dimensions**: 42.8mm × 26.99mm × 0.96mm (50% width/length, 60% height)
- **QR Code**: 24mm, **embossed** (raised) on top
- **Text**: **Embossed** (raised) on bottom, mirrored for readability
- **Use Case**: Quick test prints, manual color assignment in slicer
- **Watermark**: Removed
- **Documentation**: `README-XS.md`

#### 3. XS-V2 Generator (50% Test Prints - Flat Multi-Color)
```bash
cd card-generator
node test-xs-v2-generator.js
```
Outputs: `output/models-xs-v2/*.scad`, `*.3mf`
- **Dimensions**: 42.8mm × 26.99mm × 0.96mm (same as XS)
- **Surface**: Completely flat (no embossing)
- **QR Code**: 24mm, flat with `color("black")` definition
- **Text**: Flat with `color("black")` definition, mirrored
- **Export Format**: **3MF with embedded colors** (not STL)
- **Use Case**: Multi-material printers (MMU2, AMS), automatic color assignment
- **Color Layers**: 0.02mm thin (just for color definition, not physical relief)
- **Documentation**: `README-XS-V2.md`

**File Structure:**
```
card-generator/output/
├── qr-codes/           # Standard QR codes
├── qr-codes-xs/        # XS QR codes (same as standard)
├── qr-codes-xs-v2/     # XS-V2 QR codes (same as standard)
├── models/             # Standard SCAD + STL
│   └── all-cards.3mf   # Combined 3MF for all standard cards
├── models-xs/          # XS SCAD + STL (embossed)
└── models-xs-v2/       # XS-V2 SCAD + 3MF (flat multi-color)
```

**When to Use Each:**
- **Standard**: Production cards, full size
- **XS**: Test prints, single-material printer with manual color changes
- **XS-V2**: Test prints, multi-material printer (MMU2/AMS), automatic workflow

## Architecture

### Data Flow
```
Spotify Playlist → docs/songs.json → pwa/src/data/songs.ts + qr-codes/*.png
```

### Hybrid Audio System (v0.0.27)

**Problem:** Spotify Development Mode limits apps to 25 authenticated users. Extended Quota Mode requires registered company + 250k users.

**Solution:** Dual-mode audio system with automatic fallback:

**Audio Modes:**
1. **Preview Mode** (Default, Unlimited Users):
   - 30-second clips from `song.previewUrl`
   - No authentication required
   - Howler.js HTML5 Audio player
   - Pre-fetched URLs stored in songs.ts
   - Ideal for quiz gameplay

2. **Spotify Premium** (Optional, Max 25 Users):
   - Full song playback via Web Playback SDK
   - Requires Spotify Premium + OAuth login
   - High-quality audio streaming
   - Optional for VIP experience

**Architecture:**
```
MusicPlayerService (Abstraction Layer)
├── SpotifyPlayerService (Spotify Web Playback SDK)
│   ├── Full songs, Premium only, max 25 users
│   └── OAuth PKCE authentication
└── PreviewPlayerService (Howler.js)
    ├── 30s clips, no auth, unlimited users
    └── Static preview URLs from songs.ts
```

**User Flow:**
```
Landing Page
├── Button 1: "Jetzt spielen (Gratis)" → Preview Mode
└── Button 2: "Mit Spotify Premium" → Spotify Mode
    ↓
localStorage.setItem('audio_mode_preference', mode)
    ↓
MusicPlayer reads preference → initializes correct player
    ↓
Automatic fallback: Spotify fails → Preview → Error
```

**Key Files:**
- `pwa/src/services/PreviewPlayerService.ts` - Howler.js wrapper (270 lines)
- `pwa/src/services/MusicPlayerService.ts` - Unified abstraction (298 lines)
- `pwa/src/screens/LandingPage.tsx` - Two-button selection + comparison
- `pwa/src/components/game/MusicPlayer.tsx` - Mode badges, unified controls
- `pwa/src/screens/GameScreen.tsx` - Transparent integration

**Preview URL Management:**
```bash
# Fetch all preview URLs (requires Spotify token, one-time operation)
cd pwa
npm run update-previews

# Updates songs.json with current preview URLs
# Then commit to git - users access cached URLs without auth
```

**Auth & Playback:**
- **Spotify Mode**: OAuth PKCE → localStorage token → Web Playback SDK
- **Preview Mode**: No auth → Direct URL playback via Howler.js
- **Fallback Chain**: Spotify → Preview → Error toast

### Game Modes & Variants

**Game Variants:**
- **Physical Mode**: Scan QR codes from physical cards, one player acts as DJ
- **Virtual Mode**: No QR scanner needed, songs randomly drawn from database

**Game Modes:**
1. **Hardcore Mode (GAME_MODES.HARDCORE)**:
   - Players guess title, artist, and year
   - **New Scoring System**:
     - Title correct: **+5 points**
     - Artist correct: **+5 points**
     - Year exact: **+5 points** | ±1 year: **+2 points** | ±2 years: **+1 point**
     - Maximum: **15 points per song** (150 points total)
   - Cards automatically placed chronologically in timeline
   - Score overview displayed with live updates
   - Winner: Most points after 10 cards

2. **Timeline Personal (GAME_MODES.TIMELINE_PERSONAL)**:
   - Each player builds their own timeline
   - Manual placement of cards in chronological order
   - No points system, only card count
   - Winner: First player with 10 correctly placed cards

3. **Timeline Global (GAME_MODES.TIMELINE_GLOBAL)**:
   - All players share one global timeline
   - Manual placement in shared timeline
   - Winner: First player with 10 correctly placed cards

**Key Features (v0.0.17-0.0.24):**
- ✅ Scoring: 5+5+5/2/1 points (title/artist/year±2) in Hardcore Mode only
- ✅ Achievements: 20 unlockable (10 standard + 10 new, fixed in v0.0.24) with progress tracking, confetti animations
- ✅ Interactive Particles: Activity-reactive 3D system (idle/calm/active/intense), music-reactive
- ✅ Statistics: Player stats, game history, decade analysis
- ✅ UX: Auto-focus (desktop), skip confirmation, random start position

### State & Particles
- **State**: LocalStorage persistence, JSON export/import, auto-save
- **Particles**: 3-layer Three.js system (indigo/orange/cyan), 4 activity levels, music-reactive, auto-decay (60s/30s)

## Critical Configuration

### Spotify Developer Setup
**Required before running the app:**
1. Create app at https://developer.spotify.com/dashboard
2. Add Redirect URIs in app settings:
   - Development: `http://localhost:5174/callback`
   - Production: `https://your-domain.com/callback`
3. Copy Client ID and Client Secret

### spotify.config.js Structure
```javascript
export default {
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'http://localhost:5174/callback',
  playlistId: 'SPOTIFY_PLAYLIST_ID',
  scopes: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ]
}
```

**Note**: This file is gitignored. Must be created manually for development.

## Project Structure

```
mxster/
├── docs/                              # Source of Truth
│   ├── songs.json                     # Primary song database
│   ├── song_template.json
│   ├── songs_removed.json
│   └── *.png                          # QR code PNGs (in Git for docs)
├── card-generator/                    # Card generation tools
│   ├── *.js                          # Generation scripts (generateCard.js, qrToScad.js, spotifyApi.js)
│   ├── template.scad
│   └── output/                       # All generated files (gitignored)
│       ├── qr-codes/                 # Generated QR codes
│       ├── models/                   # SCAD, STL, 3MF files
│       │   ├── *.scad               # OpenSCAD 3D models
│       │   ├── *.stl                # STL files for 3D printing
│       │   └── all-cards.3mf        # Combined 3MF file
│       └── pdfs/                     # Generated PDF cards
│           ├── mxster-cards.pdf
│           ├── mxster-cards-bw.pdf
│           ├── mxster-cards-duplex.pdf
│           └── mxster-cards-bw-duplex.pdf
├── build/                             # Release artifacts (gitignored)
│   └── archives/                     # ZIP archives for releases
│       ├── mxster-scad-models.zip
│       ├── mxster-stl-models.zip
│       └── mxster-source.zip
├── pwa/                               # Progressive Web App (React + TypeScript)
│   ├── src/
│   │   ├── main.tsx                  # App entry point
│   │   ├── data/songs.ts             # Generated song data
│   │   ├── components/               # React components
│   │   ├── utils/
│   │   │   ├── spotifyAuth.js       # OAuth PKCE implementation
│   │   │   ├── spotifyPlayer.js     # Web Playback SDK wrapper
│   │   │   ├── spotifyImport.js     # Playlist import utility
│   │   │   └── gameState.js         # LocalStorage persistence
│   │   └── styles/
│   ├── public/
│   │   ├── manifest.webmanifest     # PWA configuration
│   │   └── assets/
│   ├── vite.config.js               # Vite + PWA plugin config
│   ├── spotify.config.js            # Spotify credentials (gitignored)
│   ├── filter-valid-songs.js        # Song validation script
│   ├── update-preview-urls.js       # Preview URL updater
│   ├── generate-cards.js            # PDF card generator script
│   └── package.json
└── scripts/                           # Organized utility scripts
    ├── song-management/
    │   ├── add-song.js              # CLI: Add new song with Spotify metadata
    │   ├── edit-song.js             # CLI: Edit existing song (interactive wizard)
    │   ├── exchange-song.js         # CLI: Replace existing song
    │   └── update-song-count.js     # CLI: Update song count in README
    ├── build/
    │   ├── generate-all-pdfs.sh     # Generate all 4 PDF variants at once
    │   └── update-and-release.sh    # Automated build and release workflow
    ├── deployment/
    │   └── deploy.sh                # Deploy PWA to production server
    └── setup/
        └── install_dependencies.sh  # Install project dependencies
```

## Game Flow

### Hardcore Mode
1. Song → Guess (title/artist/year) → `checkGuess()` → Points (0-15) → Auto-place in timeline → Next player
2. Win: 10 cards → Confetti + stats modal

### Timeline Modes
1. Song → Optional guess → Manual placement → Validation → Next player
2. Win: First to 10 correct cards

### Key Methods
- `checkGuess()`: Fuzzy matching, point calc (5+5+5/2/1), auto-placement
- `showWinnerModal()`: Game end, confetti, stats (requires `gameOver` flag)
- `placeCardAndContinue()`: Timeline update, win check, next turn

## Testing

### Integrity Test Suite
```bash
npm test  # Runs test-integrity.js
```

**15 Tests**: 10 basic (always run) + 5 advanced (optional deps)
- Basic: JSON structure, sync, fields, IDs, years, file existence
- Advanced: QR decode, Spotify API, dimensions, OpenSCAD syntax, PDFs
- Philosophy: Graceful degradation, sample-based (3-5 songs), CI/CD friendly

**Optional deps**: `npm install --save-dev jsqr pngjs sharp` + `brew install openscad`

## Workflows

### Song Management
```bash
# Add new song (auto-generates all files)
node scripts/song-management/add-song.js "spotify-url"
node scripts/song-management/add-song.js --edit "spotify-url"  # Interactive with genre

# Edit existing song (wizard, auto-backup)
node scripts/song-management/edit-song.js  # Includes genre editing

# Exchange song (keeps ID, replaces metadata)
node scripts/song-management/exchange-song.js  # Preserves genre if available

# Generate PDFs (4 variants: color/bw, standard/duplex)
./scripts/build/generate-all-pdfs.sh
```

**Auto-generated files**: QR codes, SCAD, STL, songs.json, songs.ts
**Genre field**: Optional field for GENRE_HOPPER achievement (added v0.0.24)
- Suggestions: Pop, Rock, Hip-Hop, Electronic, R&B, Country, Jazz, Metal, Reggae, Soul
- Safely handled: GENRE_HOPPER filters `undefined`/`null` values
- Scripts: All song management scripts support genre input/editing

### Deployment
```bash
./scripts/deployment/deploy.sh  # Quick deploy to mxster.de
```

**Production**: https://mxster.de (VPS: root@mrx3k1.de, `/var/www/html/mxster`)

### Downloads
All files hosted via GitHub raw URLs (auto-update, no manual releases):
- PDFs: `card-generator/output/pdfs/*.pdf` (4 variants)
- 3D: `all-cards.3mf`, `build/archives/*.zip` (SCAD/STL)
- Commit: `git add -f` (files are gitignored by default)

## QR & 3D Printing

### QR Codes
- **Content**: Spotify URLs (`https://open.spotify.com/track/{spotifyId}`)
- **Specs**: Error correction H (30%), 20px box, 8px border

### 3D Printing
- **Settings**: PLA/PETG, 0.2mm layer, 20% infill
- **Workflow**: OpenSCAD (F6 render) → STL export → Slice (Cura/PrusaSlicer) → Print

## Troubleshooting

### Common Issues
- **Scores not updating**: Hard refresh (CTRL+SHIFT+R) to clear service worker cache
- **Spotify errors**: Check console, verify Redirect URI, ensure Premium account, check token expiry (1h)
- **Dialog issues**: Ensure `checkGuess()` shows modal BEFORE `placeCardAndContinue()`

### Known Limitations
- Spotify Premium required, HTTPS required (camera), online-only streaming

## Best Practices

### TypeScript
- **Song Type**: Always use `export const songs: Song[] = [...]` (not `export const songs = [...]`)
- **Fields**: Only interface-defined fields allowed (no `audioUrl`, `youtubeUrl` deprecated)
- **Test Regex**: `/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/` for TS/JS compatibility

### Scripts
- **add-song.js**: Auto/interactive mode, Spotify metadata
- **edit-song.js**: Interactive wizard, auto-backup, regenerates files
- **exchange-song.js**: Keeps ID, replaces metadata (requires `import 'dotenv/config'`)
- **Common**: Require `.env`, generate identical QR codes (1000px, margin 1, B&W), update songs.json + songs.ts

### Deprecated
- **v0.0.15**: Removed `audioUrl` (never used), deprecated `youtubeUrl` (Spotify-only now)
- **v0.0.16**: Cleanup - removed duplicate QR codes from `docs/`, consolidated to `card-generator/output/qr-codes/`

### Release Checklist
1. Update `package.json` + `Sidebar.tsx` version
2. Run `node scripts/song-management/update-song-count.js`
3. Update `CLAUDE.md` song count
4. Commit → `git tag v0.0.X` → `git push origin v0.0.X` → `gh release create`

### Common Pitfalls
- **TS6133**: Missing type annotation → Use `export const songs: Song[] = [...]`
- **Integrity test fails**: Regex issue → Use `/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/`
- **Missing credentials**: Add `import 'dotenv/config'` to exchange-song.js
- **Song count**: Auto-dynamic via `songs.length` in LandingPage.tsx (updates on build)

## Recent Changes

### v0.0.27 (2025-11-05) - Self-Hosted Audio System
**Complete self-hosting infrastructure for unlimited users without Spotify limitations:**

**Core Implementation:**
- ✅ **download-songs.js**: Downloads 209 songs from YouTube (128 kbps MP3, ~933 MB total)
  - 3 concurrent downloads, 3 retries per song, batch processing
  - Options: `--limit N` (test mode), `--resume` (skip existing)
  - Output: `pwa/public/audio/*.mp3` (gitignored)
- ✅ **upload-to-vps.js**: Uploads to VPS via rsync
  - Incremental sync, permission setting (644), nginx verification
  - Options: `--dry-run` (preview changes)
  - Target: `root@mrx3k1.de:/var/www/html/mxster/audio/`
- ✅ **update-song-urls.js**: Updates previewUrl in songs.json and songs.ts
  - Auto-backup (.backup-YYYY-MM-DD), 100% coverage verification
  - Options: `--dry-run` (preview changes)
  - URL format: `https://mxster.de/audio/song_XXX.mp3`
- ✅ **validate-audio.js**: HTTPS accessibility validation
  - HTTP status 200, content-type audio/mpeg, file size checks (1-15 MB)
  - Options: `--full` (all 209 songs), default: 10 sample songs
  - Report: `docs/validation-report.json`

**nginx Configuration:**
```nginx
location /audio/ {
    alias /var/www/html/mxster/audio/;
    add_header Cache-Control "public, max-age=31536000";
    add_header Access-Control-Allow-Origin "*";
    add_header Content-Type "audio/mpeg";
    add_header Accept-Ranges bytes;
}
```

**Bug Fixes:**
- Fixed random start position for preview mode (now works with self-hosted audio)
- Fixed Timeline Global win condition (counts total cards across all players, winner = most cards after 10 total)
- Fixed game end dialog not closing when clicking buttons

**Benefits:**
- 🌟 Unlimited users (no 25-user Development Mode limit)
- 🎵 Full songs (3-5 minutes) instead of 30-second previews
- 🔓 No authentication required
- 💾 Offline-ready (PWA can cache songs)

**Technical Details:**
- Average song size: 4.47 MB (128 kbps MP3)
- Total storage: 933.43 MB on VPS
- Quality: 128 kbps MP3 (balance of size vs quality)
- All 64 unit tests passing

### v0.0.25 (2025-11-03) - Achievement System Bugfixes
**Fixed 3 critical achievement bugs identified through thorough code analysis:**

**1. NAME_DROPPER (Artist Streak)** ❌→✅
- **Bug**: Used `points >= 10` to detect artist correctness (impossible - can't distinguish Title+Artist from Title+Year)
- **Fix**: Added `guessDetails` to Song interface with `artistCorrect` boolean
- **Impact**: Now accurately tracks 5-artist streaks without false positives

**2. PERFECT_STREAK (3 Perfect Guesses)** ⚠️→✅
- **Bug**: Only checked `points === 15`, may fail if points not persisted correctly
- **Fix**: Dual verification - checks both `points === 15` OR all `guessDetails` fields correct
- **Impact**: More reliable perfect streak detection

**3. COMEBACK_PROFI (5 Comeback Wins)** ⚠️→✅
- **Bug**: Weak logic - only checked final scores, didn't track actual comebacks
- **Fix**: Checks if winner had fewer cards OR came from behind (opponent had equal/more cards but lower score)
- **Impact**: Better comeback detection logic

**Implementation Details:**
- **Song Interface**: Added `guessDetails?: { titleCorrect, artistCorrect, yearPoints }` (v0.0.25)
- **gameLogic.ts**: Updated `placeCardInTimeline()` to store guess details
- **GameScreen.tsx**: Calculate and pass guessDetails when placing cards
- **Achievement Debugging**: Added summary log after each game showing progress for all players

**All 20 Achievements Now Fully Functional** ✅

### v0.0.24++ (2025-11-04) - Genre Analysis & Testing Tools
**Analysis & Testing Improvements**:
- ✅ **generate-decade-report.js**: Added genre distribution analysis alongside decade analysis
  - Interactive HTML report with bar charts for both decades and genres
  - 208 songs across 7 decades and 9 genres
  - Genre color coding with vibrant colors per genre
  - Detailed song listings by decade and genre
- ✅ **generate-game-history.js**: Updated to generate 1000 realistic test games + ALL 20 ACHIEVEMENTS
  - 3 players (m, n, o) with different skill levels (80%, 60%, 40%)
  - Random game modes (hardcore, timeline_personal, timeline_global)
  - Random variants (physical, virtual)
  - **CRITICAL FIX**: Now includes all 20 achievements (was missing 10 new ones)
  - **GRAND_MASTER unlocks correctly** with 5000+ points (Player "m" gets ~35000 points)
  - For testing achievements, statistics, and history features
- ✅ **unlock-all-achievements.js**: Updated to include all 20 achievements
  - Player "m": All 20 unlocked (100%)
  - Player "n": 10 unlocked, 10 locked with progress (50%)
  - Includes GRAND_MASTER and GENRE_HOPPER

### v0.0.24+ (2025-11-03) - Genre Field Support
**Added genre field to song management system** to support GENRE_HOPPER achievement:
- ✅ **Genre field added** to Song interface (optional, already in v0.0.24)
- ✅ **add-song.js**: Genre input with suggestions in `--edit` mode
- ✅ **edit-song.js**: Genre editing with visual before/after comparison
- ✅ **exchange-song.js**: Preserves genre field when exchanging songs
- ✅ **GENRE_HOPPER**: Already safely filters `undefined`/`null` values
- ✅ **songs.json**: All 208 songs now have genre data (100% coverage)
- ✅ **song_template.json**: Updated with genre field, removed deprecated fields
- 📝 **Genre suggestions**: Pop, Rock, Hip-Hop, Electronic, R&B, Country, Jazz, Metal, Reggae, Soul
- 📊 **Genre distribution**: Pop (67), Rock (45), Electronic (44), Soul (18), Hip-Hop (17), R&B (7), Metal (6), Reggae (2), Country (1)

### v0.0.26 (2025-11-05) - Visual Feedback & UX Improvements

**🎨 Animation System Implementation**

**New Animation Files**:
- `pwa/src/utils/placementAnimations.ts` - Timeline placement feedback (confetti + thunder/rain)
- `pwa/src/utils/guessAnimations.ts` - Hardcore mode score-based animations (5 levels)
- `pwa/src/utils/animationHelpers.ts` - Shared randomization utilities
- `pwa/src/styles/animations.css` - CSS keyframes (lightning, rain, shake, pulse, fade)

**Timeline Placement Animations**:
- **Correct (✅)**: 3 randomized confetti patterns
  - Center Burst: 360° explosion from center (80-150 particles)
  - Side Cannons: Simultaneous left + right cannons (50-100 particles each)
  - Spiral: Bottom-to-top spiral effect (2-3 seconds duration)
- **Incorrect (❌)**: Thunder/rain animation
  - Dark storm overlay (opacity 0.3-0.6, randomized)
  - 30-60 falling raindrops (randomized positions & speeds)
  - 2-4 lightning bolts (randomized positions & timing)
  - Screen shake effect (0.5s)

**Hardcore Mode Guess Animations** (score-based):
- **15 Points (Perfect)**: Gold confetti + "PERFECT!" text + golden glow (3s)
- **10-14 Points (Great)**: Silver confetti + "GREAT!" text + cyan glow (2s)
- **5-9 Points (Good)**: Green particles + "NICE!" text + green glow (1.5s)
- **1-4 Points (Partial)**: Yellow sparks + "+X" points + weak glow (1s)
- **0 Points (Wrong)**: Falling ❌ symbols + screen shake + red flash (1s)

**Randomization Features**:
- 8 theme colors palette (indigo, orange, cyan, pink, purple, green, amber, red)
- Randomized particle counts, spread angles, velocities, gravity
- Randomized lightning positions, rain intensity, timing delays
- Mobile optimization: 50% fewer particles on devices < 768px width
- Accessibility: `prefers-reduced-motion` support

**UI Improvements**:
- **Enlarged Placement Buttons**: All timeline placement buttons now `text-2xl md:text-3xl font-bold`
  - "📍 Erste Karte platzieren"
  - "📍 Zwischen X und Y"
  - "⬆️ Vor X"
  - "⬇️ Nach X"
- **Keyboard Shortcuts**: All evaluation/result modals now support:
  - **Enter**: Trigger primary button action
  - **ESC**: Close modal (if not `required: true`)
  - Implemented via `variant: 'primary'` on modal buttons

**Technical Details**:
- Dependencies: Uses existing `canvas-confetti` v1.9.3
- Build size: +7 KB (animations + CSS)
- Integration: `GameScreen.tsx` - animations trigger before modals
- Non-blocking: All animations run asynchronously
- TypeScript: Fully typed

**Files Modified**:
- `pwa/src/main.tsx`: Import animations.css
- `pwa/src/screens/GameScreen.tsx`:
  - Added animation imports
  - Trigger animations in `handleManualPlacement()` (line 761-766)
  - Trigger animations in `showEvaluationModal()` (line 385-396)
  - Enlarged placement button text (lines 660, 672, 694, 709)
  - Added `variant: 'primary'` to 3 modal buttons (lines 473, 823, 875)

### v0.0.24 (2025-11-03) - Achievement Fixes & Replacements
**Fixed 5 broken achievements from v0.0.23** with creative, functional alternatives:
- **Removed broken achievements**:
  - SPEED_DEMON (race condition + timing complexity)
  - YEAR_PERFECTIONIST (impossible: ≥13 points doesn't exist)
  - DIVERSE_TASTE (impossible: requires all decades in 10 cards)
  - ARTIST_EXPERT (false positives: counted wrong songs)
- **New functional achievements**:
  - ⏰ **ZEITMASCHINE**: 3 different decades (realistic + achievable)
  - 🌈 **GENRE_HOPPER**: 4 different genres (requires genre field)
  - 🎤 **NAME_DROPPER**: 5 artist streak (streak-based = more engaging)
  - 🏆 **PUNKTEJÄGER**: 75+ points (entry-level version of HARDCORE_CHAMPION)
  - 🔥 **COMEBACK_PROFI**: 5x comeback wins (cross-game achievement)
- **Bug fixes**:
  - Property name consistency: `earnedPoints` → `points` in PERFECT_STREAK
  - Removed entire timing system (songStartTimes, playerSongTimes)
- **New fields**:
  - Song interface: Added optional `genre?: string` field (v0.0.24)
- **Files Modified**:
  - types/achievements.ts: Renamed 5 IDs + updated definitions
  - types/index.ts: Added genre field to Song interface
  - screens/GameScreen.tsx: Replaced 6 achievement checks, removed timing
  - contexts/AchievementContext.tsx: Added COMEBACK_PROFI check

**TODO for later**: Add Genre-Bender achievement (BPM-based)

### v0.0.23 (2025-11-03) - 10 New Achievements (DEPRECATED - had bugs)
**Achievement System Expansion**: Doubled achievements from 10 to 20
- **5 Normal Achievements**:
  - ⚡🔥 **SPEED_DEMON**: 3 songs in a row guessed in <10s each (with song timing system)
  - 📅 **YEAR_PERFECTIONIST**: 5 songs with exact year match
  - 🎵 **DIVERSE_TASTE**: Cover all available decades in one game
  - 👥 **SOCIAL_BUTTERFLY**: Play with 5 different players (cross-game)
  - 🎤 **ARTIST_EXPERT**: 10 artists correctly guessed in one game
- **5 Very Hard Achievements**:
  - 💎 **FLAWLESS_VICTORY**: Win with perfect 150/150 points
  - 🌟 **LEGENDARY_STREAK**: Win 10 consecutive games (cross-game)
  - 💯 **CENTURION**: Play 100 games (cross-game)
  - ⏱️ **MASTER_OF_TIME**: Complete game in <3 minutes
  - 👑💎 **GRAND_MASTER**: Earn 5000 total points (cross-game)
- **New Systems**: Song timing tracking (start time + elapsed time per song)
- **Files Modified**:
  - `types/achievements.ts`: +10 IDs, +10 definitions
  - `screens/GameScreen.tsx`: +6 per-game checks, timing system
  - `contexts/AchievementContext.tsx`: +4 cross-game checks
- **UI**: Auto-scales to show "X / 20" progress

### v0.0.20 (2025-02-01) - TypeScript Cleanup
- Fixed 15+ TS errors: `GameHistory` → `GameHistoryData`, modal button interface (`text` not `label`)
- Migrated to `useGameHistory` hook, removed unused code
- New: `generate-decade-report.js` analysis script (207 songs, 7 decades, interactive HTML)

### v0.0.17-19 (2025-01-31) - UI & Stats
- **Stats**: `PlayerStatsDialog` (win rate, avg score, decade mastery), `GameEndStatsDialog` (confetti + round/global stats)
- **Safety**: Player deletion confirmation, consistent navigation warnings
- **Dependency**: `canvas-confetti` for winner animations
- **Components**: 500+ lines (PlayerStatsDialog, GameEndStatsDialog, ChartIcon)

