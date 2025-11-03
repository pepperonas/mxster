# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxster** is a music timeline game combining hardware (3D-printed QR cards) and software (PWA with camera scanner). Players scan physical cards or play virtually. Features guess mode (points-based) and timeline modes (chronological placement).

**Current Song Database**: 208 songs with full genre data (as of 2025-11-03)

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite 5.0
- **Audio**: Spotify Web Playback SDK (Premium) / Howler.js fallback
- **Auth**: Spotify OAuth2 PKCE
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

### Auth & Playback
- **Auth**: OAuth PKCE → localStorage token → Web Playback SDK
- **Playback**: Spotify SDK (Premium, full tracks) / Howler.js fallback (30s clips)

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

### v0.0.24++ (2025-11-03) - Genre Analysis & Testing Tools
**Analysis & Testing Improvements**:
- ✅ **generate-decade-report.js**: Added genre distribution analysis alongside decade analysis
  - Interactive HTML report with bar charts for both decades and genres
  - 208 songs across 7 decades and 9 genres
  - Genre color coding with vibrant colors per genre
  - Detailed song listings by decade and genre
- ✅ **generate-game-history.js**: Updated to generate 1000 realistic test games
  - 3 players (m, n, o) with different skill levels (80%, 60%, 40%)
  - Random game modes (hardcore, timeline_personal, timeline_global)
  - Random variants (physical, virtual)
  - For testing achievements, statistics, and history features

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

