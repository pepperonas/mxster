# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxster** is a music timeline game that combines hardware (3D-printed cards with QR codes) and software (PWA with camera scanner). Players can either scan physical QR codes or play virtually without cards. The game features multiple modes: a guess game where players earn points by correctly identifying songs, and timeline modes where players manually place songs chronologically.

**Current Song Database**: 179 songs spanning multiple decades and genres (as of 2025-01-31)

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite 5.0
- **Audio Playback**: Spotify Web Playback SDK (requires Premium) with Howler.js fallback
- **QR Scanning**: qr-scanner library (browser-based camera)
- **Authentication**: Spotify OAuth2 with PKCE (Authorization Code Flow)
- **PWA**: vite-plugin-pwa for offline capabilities and mobile installation
- **3D Graphics**: Three.js for interactive particle background animations
- **State Management**: React Context API for global state
- **Card Generation**: Node.js with qrcode and Canvas API

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

#### Import Songs from Playlist
```bash
cd pwa

# Configure spotify.config.js first with clientId, clientSecret, playlistId
npm run import-spotify
```
This creates:
- `src/data/songs.ts` (PWA bundle)
- `../docs/songs.json` (source of truth for cards)

#### Update Preview URLs
```bash
cd pwa
npm run update-previews
```
Fetches current preview URLs from Spotify API for all songs in `songs.json`.

#### Filter Valid Songs
```bash
cd pwa
npm run filter-songs
```
Removes songs without Spotify ID or preview URL. Creates automatic backup and saves removed songs to `songs_removed.json`.

### 3D Card Generation (SCAD + STL)
```bash
cd card-generator

# Generate SCAD files (3D models) from songs.json
node generateCard.js

# Generate STL files from SCAD files (requires OpenSCAD)
node -e "
const fs = require('fs');
const { generateSTL } = require('./generateCard.js');
const songs = JSON.parse(fs.readFileSync('../docs/songs.json', 'utf8'));

async function generateAllSTLs() {
  for (const song of songs) {
    const sanitizeFilename = (str) => str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
    const artistSafe = sanitizeFilename(song.artist);
    const titleSafe = sanitizeFilename(song.title);
    const baseFilename = \`\${song.id}_\${artistSafe}_\${titleSafe}_\${song.year}\`;
    const scadPath = \`./models/\${baseFilename}.scad\`;
    await generateSTL(scadPath);
  }
}
generateAllSTLs();
"
```
This creates:
- `output/qr-codes/*.png` - Individual QR codes linking to Spotify tracks
- `output/models/*.scad` - OpenSCAD 3D model files with embedded QR codes
- `output/models/*.stl` - STL files ready for 3D printing

## Architecture

### Data Flow
```
Spotify Playlist
    ↓ (npm run import-spotify)
docs/songs.json (source of truth)
    ↓
    ├→ pwa/src/data/songs.ts (build time)
    └→ cards/qr-codes/*.png (Python script)
```

### Authentication Flow
1. User clicks login → `spotifyAuth.login()` initiates OAuth PKCE flow
2. Redirect to Spotify authorization → User approves
3. Callback to `/callback` → `spotifyAuth.handleCallback()` exchanges code for token
4. Token stored in localStorage → `spotifyPlayer.initialize()` creates Web Playback SDK instance
5. Player ready → Game proceeds

### Song Playback Architecture
- **Primary**: Spotify Web Playback SDK (full tracks, requires Premium)
- **Fallback**: Howler.js with preview URLs (30-second clips)
- **Device**: SDK creates virtual player device in user's Spotify account
- **Playback Control**: Play, pause, seek via SDK API

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

**Recent Features & Improvements (2025):**
- ❌ **Token system completely removed** (no more skip/buy mechanics)
- ✅ **Simplified scoring**: Only points in Hardcore Mode
- ✅ **Hardcore Mode Rename** (v0.0.17): "Ratespiel" renamed to "Hardcore" (icon: 🔥)
- ✅ **New Scoring System** (v0.0.17): Granular point system (5+5+5/2/1) for more tactical depth
- ✅ **Achievement System** (v0.0.17): 10 unlockable achievements with progress tracking
  - Locked achievements shown as grayscale/masked
  - Unlocked achievements shown in color with unlock date
  - Player-specific tracking with automatic save/restore
  - Achievements: Volltreffer-Serie, Perfektionist, Zeitreisender, Hardcore-Champion, Marathonläufer, Unbesiegbar, Dekaden-Kenner, Blitzschnell, Comeback-King, Musikexperte
- ✅ **Complete Achievement Tracking** (v0.0.18): All 10 achievements now automatically unlock during gameplay
  - Real-time tracking: Perfect streaks, score milestones, decade mastery tracked as you play
  - Game duration tracking for LIGHTNING_FAST achievement (< 5 minutes)
  - Rankings history tracking for COMEBACK_KING achievement (last place → winner)
  - Consecutive wins from game history for UNBEATABLE achievement (5 wins in a row)
  - Progress bars update live for all achievements with targets
  - Full integration with GameScreen and AchievementContext
- ✅ **Delete All Data Fix** (v0.0.18): localStorage race condition resolved
  - Synchronous localStorage clearing before page reload
  - Hard reload with cache bypass (?t=timestamp)
  - Double cleanup: specific keys + wildcard cleanup for all mxster/hitster keys
  - No React state updates before reload (prevents re-saving)
- ✅ **Player stats**: `cards` (count) and `score` (points) only
- ✅ **Auto-placement in Hardcore Mode**: Cards inserted immediately after guessing
- ✅ **Dialog flow fixed**: Evaluation modal shows checkmarks, then proceeds on button click
- ✅ **Random Start Position**: Optional setting to start songs at random position (ensures 60s+ remaining playback time)
- ✅ **Beat Sync Simplified**: Background-only animations (Pulse, Wave, Flash, Gradient, Glow)
- ✅ **Interactive Particle Background** (v0.0.6): Activity-reactive 3D particle system
  - 4 activity levels (idle, calm, active, intense) based on user interactions
  - Smooth 60fps transitions between states with interpolation
  - Auto-decay system (60s to idle, 30s to calm)
  - Dynamic parameters: particle count, size, opacity, wave amplitude, rotation speed, camera movement
  - Tracks interactions: modal opens (60), button clicks (40), sidebar navigation (50)
- ✅ **Spotify Token Refresh**: Automatic token refresh for uninterrupted playback
- ✅ **Game History**: Full history tracking with export/import functionality
- ✅ **Skip Confirmation**: Warning dialog when skipping guesses to encourage participation
- ✅ **Global Timeline Player Tracking** (v0.0.13): Enhanced player visibility in global timeline mode
  - Player standings board showing all players' current card count (X/10)
  - Current player highlighting with accent border
  - Player badges on each card (first 3 letters of name in uppercase)
  - Hover tooltips showing full player name
  - Responsive grid layout (2-3 columns based on screen size)
  - Fixed placement dialog data extraction for GlobalTimelineCard structure
- ✅ **Music-Reactive Particle Animation** (v0.0.14): Dynamic particle system responds to music playback
  - Orange particles dramatically increase during song playback (2.5x size, 1.8x brightness)
  - New 'music' interaction type with intensity 85 (highest priority)
  - Automatic activity level transitions: 'intense' when playing → 'calm' when stopped
  - Smooth 500ms transitions between playback states
  - Integrated with Spotify Web Playback SDK state changes
  - Works with both new song starts and pause/resume actions
- ✅ **Achievement Unlock Animations** (v0.0.19): Spectacular animations with confetti when achievements are unlocked
  - 3-second animations per achievement with confetti effects using canvas-confetti
  - Sequential queue processing with 1s pause between animations
  - Custom Event system for testing (`test-achievement-unlock` event)
  - Event listener in AchievementContext.tsx for browser console testing
  - Test scripts in `/scripts/testing/` for development and debugging
- ✅ **Auto-Focus Feature** (v0.0.19): Desktop-only auto-focus on title input after drawing a song
  - Automatically focuses title input field when "Zufälligen Song ziehen" is clicked
  - Mobile detection: `'ontouchstart' in window && window.innerWidth < 768`
  - Prevents annoying mobile keyboard popup on smartphones
  - Re-focuses on player change for better UX
  - 100ms delay for smooth rendering
- ✅ **Test Scripts Repository** (v0.0.19): Complete testing infrastructure added to Git
  - 6 test scripts in `/scripts/testing/` directory now version-controlled
  - Browser console scripts for achievement animation testing
  - `.gitignore` exceptions for `scripts/testing/` directory
  - `TESTING-INSTRUCTIONS.md` with comprehensive testing guide

### Game State Management
- **Persistence**: LocalStorage via `GameState` class
- **Save Points**: Automatic on player actions, manual save button
- **Export/Import**: JSON file download/upload for backups and device transfer
- **Restore**: Dialog on app launch if saved state exists
- **Player Data Structure**:
  ```javascript
  {
    name: "Player Name",
    timeline: [],  // Array of song objects
    cards: 0,      // Count of correctly placed cards
    score: 0       // Points earned (Guess Mode only)
  }
  ```

### Interactive Particle Background Architecture (v0.0.6)

**Overview**: Activity-reactive 3D particle system using Three.js that responds to user interactions in real-time.

**Core Components**:
1. **InteractionContext** (`src/contexts/InteractionContext.tsx`): Global state management for user interactions
   - Tracks 9 interaction types: click, modal, sidebar, route, game, music, input, scroll, hover
   - Manages activity levels: idle (no activity), calm (base), active (moderate), intense (high)
   - Auto-decay timers: 60s to idle, 30s to calm
   - Pulse intensity tracking for visual feedback
   - Music interaction (v0.0.14): Triggers 'intense' level automatically during playback

2. **Activity Animations** (`src/utils/activityAnimations.ts`): Parameter presets and interpolation
   - Defines animation parameters for each activity level
   - Smooth interpolation using lerp and easeOutCubic functions
   - Dynamic parameters: particle counts, sizes, opacities, wave amplitudes, rotation/camera speeds

3. **ParticleBackground** (`src/components/game/ParticleBackground.tsx`): Three.js renderer
   - 3 particle layers: main wave (indigo), accent wave (orange), star layer (cyan)
   - ~25,000 particles at peak intensity
   - Multi-wave harmonics with circular ripples
   - Activity-based parameter application
   - Beat-reactive effects (synchronized with Spotify playback)

**Activity Level Presets**:
```typescript
idle:    { particles: 50%, speed: 0.5×, amplitude: 0.3 }  // Very calm
calm:    { particles: 100%, speed: 1.0×, amplitude: 0.7 } // Base state
active:  { particles: 130%, speed: 1.5×, amplitude: 1.3 } // Moderate energy
intense: { particles: 150%, speed: 2.0×, amplitude: 1.8 } // High energy
```

**Interaction Tracking**:
- Modal open/close: 60 intensity
- Button clicks (save, logout): 40 intensity
- Sidebar navigation: 50 intensity
- Route changes: 55 intensity
- Game events: 70 intensity
- Text input: 25 intensity
- Scroll events: 10 intensity
- Hover events: 15 intensity

**Implementation Flow**:
1. User interacts → Component calls `registerInteraction(type, intensity?)`
2. InteractionContext updates activity level based on interaction count and type
3. Activity level propagates to ParticleBackground via App.tsx
4. ParticleBackground interpolates parameters smoothly over transition duration
5. Rendering loop applies interpolated parameters to particle properties
6. Auto-decay reduces activity after inactivity period

**Files Added**:
- `pwa/src/contexts/InteractionContext.tsx` (184 lines)
- `pwa/src/utils/activityAnimations.ts` (202 lines)
- Modified: `ParticleBackground.tsx`, `App.tsx`, `AppProviders.tsx`, `Modal.tsx`, `ActionBar.tsx`, `Sidebar.tsx`, `contexts/index.ts`

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

## Game Flow Implementation

### Hardcore Mode Flow
1. **Song Presentation**: DJ scans QR or virtual mode draws random song
2. **Guessing Phase**: Player enters title, artist, year (optional skip)
3. **Evaluation**:
   - `checkGuess()` calculates correct answers (using fuzzy matching)
   - **New Points Calculation**:
     - `titleMatch ? 5 : 0`
     - `artistMatch ? 5 : 0`
     - `yearDifference === 0 ? 5 : yearDifference === 1 ? 2 : yearDifference === 2 ? 1 : 0`
   - Score updated: `player.score += earnedPoints` (0-15 per song)
   - Card added to timeline: `player.timeline.push(song)`
   - Timeline sorted chronologically
   - Card count incremented: `player.cards += 1`
4. **Feedback Modal**:
   - Shows ✅/❌ checkmarks for title, artist, year
   - Shows 🟡 for ±1/±2 year tolerance
   - Displays "+X Punkte" (0-15) with individual point breakdown
   - "Weiter" button calls `placeCardAndContinue()`
5. **Next Turn**:
   - `placeCardAndContinue()` executes timeline update
   - Checks win condition (10 cards)
   - Calls `nextTurn()` to switch to next player
   - `renderGameScreen()` updates entire UI including score overview

### Timeline Mode Flow
1. **Song Presentation**: DJ scans QR or virtual mode draws song
2. **Optional Guessing**: Can guess for fun (no points)
3. **Manual Placement**: Player selects position in timeline
4. **Validation**: System checks if chronologically correct
5. **Feedback**: Shows if placement was correct
6. **Next Turn**: Switch to next player

### Key Methods (main.js)
- `checkGuess()`: Evaluates player input, updates score, places card automatically (Hardcore Mode) - ~line 855
- `calculatePoints()`: **New granular point calculation (5+5+5/2/1)** - in `gameLogic.ts`
- `placeCardAndContinue()`: Timeline update, win check, next turn (Hardcore Mode) - ~line 1074
- `autoPlaceInTimeline()`: Card placement for Timeline Modes (shows confirmation dialog) - ~line 1097
- `skipGuess()`: Skip guessing phase, proceed to placement - ~line 928
- `nextTurn()`: Switch player, call `renderGameScreen()` - ~line 1122
- `renderGameScreen()`: Re-render entire game UI with updated data - ~line 394
- `updatePlayerInfo()`: Update player stats display - ~line 1139
- `updateTimeline()`: Update timeline card display - ~line 1153

### Important UI Elements
- **Score Overview** (Hardcore Mode): Lines 545-602 in `renderGameScreen()`
  - Displays all players sorted by score
  - Shows medals for top 3
  - Highlights current player
  - Updates after each turn via `renderGameScreen()`
- **Player Stats**: Lines 1145-1150 in `updatePlayerInfo()`
  - Shows current player name and card count
  - NO token display (removed)
- **Evaluation Modal**: Lines 876-926 in `checkGuess()`
  - Checkmarks for correct/incorrect answers
  - 🟡 indicator for ±1/±2 year tolerance
  - Point display for Hardcore Mode (0-15)
  - Button action differs by game mode

## Testing & Quality Assurance

### Comprehensive Integrity Test Suite

**Location**: `test-integrity.js` (root directory)

**Run Tests**:
```bash
npm test
```

**Test Coverage** (15 Tests Total):

#### Basic Tests (1-10) - Always Run
1. **Song Data Integrity**: JSON structure validation
2. **PWA Sync Check**: Validates `pwa/src/data/songs.ts` matches `docs/songs.json`
3. **Required Fields**: Ensures all songs have id, title, artist, year, spotifyId
4. **ID Uniqueness**: Checks for duplicate song IDs
5. **Year Validation**: Years between 1900 and current year
6. **3D Model Files** (optional): SCAD and STL file existence (gitignored)
7. **QR Code PNGs** (optional): PNG file existence (gitignored)
8. **3MF File** (optional): Combined 3D model file check
9. **Spotify ID Format**: Validates 22-character Spotify IDs
10. **File Count Consistency** (optional): Cross-checks file counts

#### Advanced Tests (11-15) - Optional Dependencies
11. **QR Code Decoding** (jsqr, pngjs):
    - Decodes sample QR codes and validates Spotify URLs
    - Tests 5 random songs
    - Result: ✅ 5/5 decoded successfully

12. **Spotify API Validation** (live):
    - Validates track IDs exist on Spotify
    - Requires `spotify.config.js` with credentials
    - Tests 5 random tracks
    - Result: ✅ 5/5 tracks validated

13. **Image Dimensions Check** (sharp):
    - Verifies QR codes are square and ≥200px
    - Tests 5 random images
    - Result: ✅ 5/5 correct dimensions

14. **OpenSCAD Syntax Validation** (requires OpenSCAD):
    - Validates SCAD file syntax with `openscad --check-parameters`
    - Tests 3 random models
    - Optional: Only runs if OpenSCAD installed
    - Install: `brew install openscad` (macOS) or `apt-get install openscad` (Linux)

15. **PDF Generation Test**:
    - Validates all 4 PDF variants exist
    - Checks PDF magic bytes (%PDF header)
    - Files: mxster-cards.pdf, mxster-cards-bw.pdf, mxster-cards-duplex.pdf, mxster-cards-bw-duplex.pdf
    - Result: ✅ 4/4 PDFs valid (0.32-0.35 MB each)

### Test Design Philosophy
- **Graceful Degradation**: Advanced tests are optional
- **CI/CD Friendly**: Won't fail builds if dependencies missing
- **Sample-Based**: Tests 3-5 songs instead of all 179 (faster)
- **Warning-Only**: Shows warnings instead of errors for optional features
- **Environment-Aware**: Detects CI/CD mode vs local development
- **Dynamic Imports**: Optional dependencies loaded at runtime (no hard failures)

### Install Optional Test Dependencies
```bash
# For advanced tests (QR decode, dimensions check)
npm install --save-dev jsqr pngjs sharp

# For OpenSCAD syntax validation (system-level)
brew install openscad  # macOS
# or
apt-get install openscad  # Linux
```

### Expected Test Results
**Local Development** (with dependencies):
- ✅ Basic Tests: 10/10 pass
- ✅ Advanced Tests: 5/5 pass (or warnings for OpenSCAD)
- Total: 13-15/15 tests passing

**CI/CD** (without optional dependencies):
- ✅ Basic Tests: 10/10 pass
- ⚠️ Advanced Tests: Gracefully skipped with warnings
- Total: 10/15 tests passing, 5 warnings (expected)

## Common Workflows

### File Generation Workflow (WICHTIG!)

**Beim Hinzufügen oder Bearbeiten von Songs werden diese Dateien automatisch generiert:**

1. **QR-Codes**:
   - `card-generator/output/qr-codes/{songId}_{artist}_{title}_{year}.png`

2. **3D-Modelle**:
   - `card-generator/output/models/{songId}_{artist}_{title}_{year}.scad` (OpenSCAD)
   - `card-generator/output/models/{songId}_{artist}_{title}_{year}.stl` (3D-Druck)

3. **Datenbanken**:
   - `docs/songs.json` (Source of Truth)
   - `pwa/src/data/songs.ts` (PWA Bundle)

4. **PDF-Karten** (4 Varianten):
   - `card-generator/output/pdfs/mxster-cards.pdf` (Standard, farbig)
   - `card-generator/output/pdfs/mxster-cards-bw.pdf` (Schwarz-Weiß)
   - `card-generator/output/pdfs/mxster-cards-duplex.pdf` (Duplex, farbig)
   - `card-generator/output/pdfs/mxster-cards-bw-duplex.pdf` (Duplex, Schwarz-Weiß)

### Adding New Song (Recommended)
```bash
# Automatisch: Metadaten von Spotify + alle Dateien generiert
node scripts/song-management/add-song.js "https://open.spotify.com/track/TRACK_ID"
```

**Was passiert automatisch:**
1. ✅ Spotify Metadaten geladen (Titel, Artist, Jahr, Album, Preview URL)
2. ✅ Song-ID generiert (song_XXX)
3. ✅ `docs/songs.json` aktualisiert
4. ✅ `pwa/src/data/songs.ts` synchronisiert
5. ✅ QR-Code generiert (card-generator/output/qr-codes/)
6. ✅ SCAD-Datei generiert
7. ✅ STL-Datei generiert (wenn OpenSCAD installiert)

### Editing Existing Song
```bash
# Interaktiver Wizard zum Bearbeiten
node scripts/song-management/edit-song.js
```

**User Flow:**
1. Song-ID eingeben (z.B. `song_031`)
2. Aktuelle Daten werden angezeigt
3. Neue Werte eingeben (leer lassen = behalten)
4. Vorher/Nachher-Vergleich
5. Bestätigung

**Was passiert automatisch:**
1. ✅ Automatisches Backup (`songs.json.backup-YYYY-MM-DD`)
2. ✅ Alte Dateien gelöscht (falls Name geändert)
3. ✅ `docs/songs.json` aktualisiert
4. ✅ `pwa/src/data/songs.ts` synchronisiert
5. ✅ QR-Code neu generiert (card-generator/output/qr-codes/)
6. ✅ SCAD-Datei neu generiert
7. ✅ STL-Datei neu generiert (immer)
8. 🔧 PDF-Karten optional neu generieren

### Generate All PDF Cards
```bash
# Generiert alle 4 PDF-Varianten auf einmal
./scripts/build/generate-all-pdfs.sh
```

**Output:**
- `card-generator/output/pdfs/mxster-cards.pdf` - Standard (farbig, nebeneinander)
- `card-generator/output/pdfs/mxster-cards-bw.pdf` - Schwarz-Weiß (spart Tinte)
- `card-generator/output/pdfs/mxster-cards-duplex.pdf` - Duplex (farbig, getrennte Seiten)
- `card-generator/output/pdfs/mxster-cards-bw-duplex.pdf` - Duplex (Schwarz-Weiß)

### Updating Songs from Spotify Playlist
```bash
# 1. Import from playlist
cd pwa
npm run import-spotify

# 2. Filter out invalid songs (optional)
npm run filter-songs

# 3. Generate all cards
cd ..
./scripts/build/generate-all-pdfs.sh
```

### Deploying PWA

### Quick Deploy
```bash
# Automated deployment to mxster.de
./scripts/deployment/deploy.sh
```

### Manual Deploy
```bash
cd pwa
npm run build

# Upload to VPS
scp -r dist/* root@mrx3k1.de:/tmp/mxster-deploy/
ssh root@mrx3k1.de "
  sudo rm -rf /var/www/html/mxster/*
  sudo cp -r /tmp/mxster-deploy/* /var/www/html/mxster/
  sudo chown -R www-data:www-data /var/www/html/mxster
"
```

### Production Environment
- **Domain**: https://mxster.de
- **VPS**: root@mrx3k1.de (69.62.121.168)
- **Web Root**: `/var/www/html/mxster`
- **SSL**: Let's Encrypt (auto-renewing)
- **Nginx**: Configured with HTTP/2, Gzip, Security Headers

See `DEPLOYMENT.md` for detailed deployment documentation.

### Download Files Distribution

**All download files are hosted in GitHub Repository** (v0.0.15+):

**PDF Cards** (Located in `card-generator/output/pdfs/`):
- `https://raw.githubusercontent.com/pepperonas/mxster/main/card-generator/output/pdfs/mxster-cards.pdf`
- `https://raw.githubusercontent.com/pepperonas/mxster/main/card-generator/output/pdfs/mxster-cards-bw.pdf`
- `https://raw.githubusercontent.com/pepperonas/mxster/main/card-generator/output/pdfs/mxster-cards-duplex.pdf`
- `https://raw.githubusercontent.com/pepperonas/mxster/main/card-generator/output/pdfs/mxster-cards-bw-duplex.pdf`

**3D Models**:
- `https://raw.githubusercontent.com/pepperonas/mxster/main/card-generator/output/models/all-cards.3mf` (Combined 3MF)
- `https://raw.githubusercontent.com/pepperonas/mxster/main/build/archives/mxster-stl-models.zip` (All STL files)
- `https://raw.githubusercontent.com/pepperonas/mxster/main/build/archives/mxster-scad-models.zip` (All SCAD files)
- Individual models: `https://github.com/pepperonas/mxster/tree/main/card-generator/output/models`

**Benefits**:
- ✅ Always up-to-date (no need for separate release assets)
- ✅ Automatic updates when repository is updated
- ✅ Direct download links work immediately
- ✅ No manual release management needed

**Landing Page Links**:
All download buttons on https://mxster.de point directly to GitHub raw URLs, ensuring users always get the latest files without needing to create GitHub releases.

**Important**: These files are in `.gitignore` by default, so use `git add -f` to commit updates:
```bash
git add -f card-generator/output/pdfs/mxster-cards*.pdf
git add -f build/archives/mxster-*-models*.zip
git add -f card-generator/output/models/all-cards.3mf
```

## QR Code Format

- **Content**: Spotify Track URLs (`https://open.spotify.com/track/{spotifyId}`)
- **Fallback**: YouTube URLs or song IDs if Spotify unavailable
- **Error Correction**: Level H (30% redundancy for damaged codes)
- **Size**: 20px box size, 8px border for optimal camera scanning
- **Detection**: Works with smartphone camera and in-browser QR scanner

## Known Limitations

- **Spotify Premium Required**: Web Playback SDK only works with Premium accounts
- **Online Only**: Spotify streaming requires internet connection
- **HTTPS Required**: Camera access needs HTTPS (except localhost)
- **Redirect URI**: Must exactly match Spotify app configuration
- **Browser Compatibility**:
  - QR Scanner: Chrome/Safari recommended
  - Spotify Playback: Chrome, Firefox, Edge, Safari (desktop & mobile)

## Testing

### Local Testing Workflow
1. Start dev server: `npm run dev` (in pwa/)
2. Open http://localhost:5174
3. Login with Spotify Premium account
4. **Test Virtual Mode First**: Quick testing without QR codes
5. **Test Physical Mode**: With printed/displayed QR codes
6. **Test All Game Modes**: Guess, Timeline Personal, Timeline Global
7. Verify score updates in Guess Mode
8. Check timeline placement in Timeline Modes

### Testing Different Game Modes
- **Guess Mode**: Verify score increments, modal shows points, timeline auto-updates
- **Timeline Personal**: Each player has separate timeline, manual placement
- **Timeline Global**: Shared timeline, collaborative placement

### Debugging Spotify Issues
- Check browser console for SDK errors
- Verify Redirect URI matches exactly
- Ensure Premium account is active
- Check token expiration (refresh after 1 hour)
- Verify scopes match required permissions

### Common Issues & Solutions

**Problem: Scores not updating in Guess Mode**
- **Cause**: Browser cache showing old version
- **Solution**: Hard refresh (CTRL+SHIFT+R) to clear service worker cache

**Problem: Dialog not showing after guessing**
- **Cause**: Card placement logic executing before modal
- **Solution**: Ensure `checkGuess()` shows modal BEFORE calling `placeCardAndContinue()`

**Problem: Button not working in Guess Mode**
- **Cause**: Wrong onclick handler (calling `autoPlaceInTimeline()` instead of `placeCardAndContinue()`)
- **Solution**: Check button action assignment based on game mode

**Problem: Token references still showing**
- **Cause**: Old code not removed completely
- **Solution**: Search for "token" in main.js and remove all references

## 3D Printing

The `3d-models/` directory contains OpenSCAD files for physical components.

### Recommended Settings
- **Material**: PLA or PETG
- **Layer Height**: 0.2mm
- **Infill**: 20%
- **Support**: Only for chips

### Workflow
1. Open `.scad` files in OpenSCAD
2. Render (F6)
3. Export as STL
4. Slice with Cura/PrusaSlicer
5. Print

## Important Learnings & Best Practices

### TypeScript Type System (v0.0.15)

**Song Type Definition**:
```typescript
export interface Song {
  id: string
  title: string
  artist: string
  year: number
  album?: string
  spotifyId?: string
  previewUrl?: string
  youtubeUrl?: string  // Legacy, not used in new songs
}
```

**Critical Rules**:
1. **Type Annotation Required**: Always use `export const songs: Song[] = [...]` in `songs.ts`
   - ❌ `export const songs = [...]` causes TS6133 warning
   - ✅ `export const songs: Song[] = [...]` uses the imported type

2. **No Unknown Fields**: Only fields defined in Song interface are allowed
   - ❌ `audioUrl` was removed (not in interface, never used)
   - ✅ All song objects must match Song interface exactly

3. **Integrity Test Compatibility**: Test script must support TypeScript syntax
   - Regex pattern: `/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/`
   - Matches both JS and TS export formats

### Song Management Scripts

**Three Scripts with Different Purposes**:

1. **add-song.js** - Add new songs from Spotify
   ```bash
   node scripts/song-management/add-song.js "spotify-url"              # Auto mode
   node scripts/song-management/add-song.js --edit "spotify-url"       # Interactive mode
   ```
   - Auto mode: Uses Spotify metadata as-is
   - Edit mode: Shows Spotify data as defaults, allows manual editing

2. **edit-song.js** - Edit existing songs
   ```bash
   node scripts/song-management/edit-song.js
   ```
   - Interactive wizard with current values as defaults
   - Automatic backup before changes
   - Regenerates all files (QR, SCAD, STL)

3. **exchange-song.js** - Replace songs completely
   ```bash
   node scripts/song-management/exchange-song.js
   ```
   - Keeps song ID, replaces all metadata
   - Fetches new data from Spotify
   - **Important**: Requires `import 'dotenv/config'` at top

**Common Requirements**:
- All scripts need `.env` file with Spotify credentials
- All scripts generate identical QR codes (via `generateCard()`)
- All scripts update both `songs.json` and `songs.ts`
- All scripts create SCAD and STL files

### QR Code Generation

**Consistent Across All Scripts**:
```javascript
// All three scripts use the same function
import { generateCard, generateSTL } from './card-generator/generateCard.js'

// QR Code Content: Always Spotify URL
const spotifyUrl = `https://open.spotify.com/track/${spotifyId}`

// QR Code Parameters (identical for all):
await QRCode.toFile(qrCodePath, spotifyUrl, {
  width: 1000,       // High resolution for 3D printing
  margin: 1,         // Border
  color: {
    dark: '#000000', // Black
    light: '#FFFFFF' // White
  }
})
```

**File Locations**:
- `card-generator/output/qr-codes/*.png` - Generated QR codes
- `card-generator/output/models/*.scad` - 3D models (OpenSCAD)
- `card-generator/output/models/*.stl` - 3D models (STL for printing)

### Removed/Deprecated Features

**Fields Removed from Song Type** (v0.0.15):
- ❌ `audioUrl` - Never implemented, not in Song interface
- ❌ `youtubeUrl` - No longer added by scripts/song-management/add-song.js (still in interface for legacy songs)

**Why Removed**:
- `audioUrl`: Placeholder value, never used in code
- `youtubeUrl`: Redundant with Spotify integration

**File Structure Cleanup** (v0.0.16):
- ❌ `card-generator/qr-codes/` - Empty directory removed
- ❌ `card-generator/models/` - Empty directory removed
- ❌ `docs/*.png` - 145 duplicate QR code PNGs removed
- ✅ QR codes now stored only in: `card-generator/output/qr-codes/`
- ✅ Scripts updated to stop copying QR codes to docs/
- ✅ `docs/` directory now contains only JSON files

**Why Changed**:
- Eliminate file duplication (QR codes were stored in 2 locations)
- Cleaner directory structure with single source of truth
- `docs/` directory focused on data files only
- Old empty directories from previous structure removed

**Scripts Updated** (v0.0.16):
- `scripts/song-management/add-song.js` - No longer copies QR codes to docs/
- `scripts/song-management/edit-song.js` - No longer copies QR codes to docs/
- `scripts/song-management/exchange-song.js` - No longer copies QR codes to docs/
- `test-integrity.js` - Updated to check new QR code location

**Documentation Updates** (v0.0.16):
- Removed obsolete `--generate-3d` parameter (3D models always generated automatically)
- Updated all file path references to reflect new `output/` structure
- Fixed typo: `songs.tson` → `songs.json`

### Version Management

**Update Checklist for New Releases**:
1. ✅ Update `pwa/package.json` version
2. ✅ Update `pwa/src/components/Sidebar.tsx` version display
3. ✅ Update `CLAUDE.md` song count and date
4. ✅ Run `node scripts/song-management/update-song-count.js` for README
5. ✅ Commit with detailed change log
6. ✅ Create git tag: `git tag v0.0.X`
7. ✅ Push tag: `git push origin v0.0.X`
8. ✅ Create GitHub release with `gh release create`

**Song Count Update**:
```bash
node scripts/song-management/update-song-count.js  # Updates README.md automatically
```

### Testing

**Integrity Test Suite**:
```bash
node test-integrity.js
```

**What It Tests**:
1. ✅ songs.json structure and validity
2. ✅ songs.ts matches songs.json (supports TypeScript syntax)
3. ✅ All songs have required fields
4. ✅ All song IDs are unique
5. ✅ Year validation
6. ✅ 3D model files exist (SCAD + STL)
7. ✅ QR code PNG files exist
8. ✅ Combined 3MF file exists
9. ✅ Spotify IDs have valid format
10. ✅ File count consistency

**Critical**: Test must support TypeScript type annotations in regex patterns

### Common Pitfalls

**Problem**: TS6133 - "Song is declared but its value is never read"
- **Cause**: Missing type annotation on songs array
- **Solution**: Use `export const songs: Song[] = [...]`

**Problem**: TS2353 - "audioUrl does not exist in type Song"
- **Cause**: Field not defined in Song interface
- **Solution**: Remove field from song objects

**Problem**: Integrity test fails on songs.ts parsing
- **Cause**: Regex doesn't match TypeScript syntax
- **Solution**: Use pattern: `/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/`

**Problem**: exchange-song.js - "Missing Spotify credentials"
- **Cause**: No dotenv import
- **Solution**: Add `import 'dotenv/config'` at top

**Problem**: add-song.js creates songs without user control
- **Cause**: No interactive mode
- **Solution**: Use `node scripts/song-management/add-song.js --edit "spotify-url"` for manual metadata control

### Dynamic Song Count on Landing Page

**Implementation**: Song count is **automatically dynamic** (v0.0.15+)

```typescript
// LandingPage.tsx
import { songs } from '@/data/songs'

export function LandingPage() {
  const songCount = songs.length  // Automatically updated when songs.ts changes

  return (
    <p>🎵 Deine Zeitreise durch die Musik - {songCount} Songs verfügbar</p>
  )
}
```

**Key Points**:
- ✅ **No manual updates needed**: Song count updates automatically on build
- ✅ **Source of truth**: `pwa/src/data/songs.ts` (generated from `docs/songs.json`)
- ✅ **Build process**: `npm run build` compiles latest count into production bundle
- ✅ **Deployment**: `./deploy.sh` automatically pushes updated count to production

**User Experience**:
- After deployment, users may need to clear browser cache (CTRL+SHIFT+R / CMD+SHIFT+R)
- PWA service worker caches old version - hard refresh required
- No server-side rendering, so initial HTML shows React mount point only
- Song count appears after JavaScript loads and React renders

**Testing**:
```bash
# Check local dev server
npm run dev  # Visit http://localhost:5174

# Check production build
npm run build && npm run preview  # Visit http://localhost:4173
```

### File Generation Workflow

**Complete Workflow for New Songs**:
```bash
# 1. Add song with Spotify data
node scripts/song-management/add-song.js "spotify-url"
# OR: Edit metadata interactively
node scripts/song-management/add-song.js --edit "spotify-url"

# 2. Files automatically generated:
# - docs/songs.json (updated)
# - pwa/src/data/songs.ts (updated)
# - card-generator/output/qr-codes/song_XXX_*.png
# - card-generator/output/models/song_XXX_*.scad
# - card-generator/output/models/song_XXX_*.stl

# 3. Verify integrity
node test-integrity.js

# 4. Update version and release (if ready)
# - Update package.json version
# - Update Sidebar.tsx version
# - Run scripts/song-management/update-song-count.js
# - Commit and create release
```

**Important**: Always run integrity test before committing!

## Recent UI Enhancements (2025-01-31)

### Phase 9: Statistics & Game End Experience

**Version**: v0.0.17+
**Date**: 2025-01-31

This release introduces comprehensive player statistics tracking, game end celebrations, and improved user safety features.

#### 1. Player Deletion Confirmation (`SettingsDialog.tsx`)

**Feature**: Confirmation dialog before deleting saved players from settings

**Implementation**:
- Added `showModal` integration to `SettingsDialog`
- Created `handleRemovePlayer()` function with confirmation workflow
- Modal displays player name and irreversibility warning
- User must explicitly confirm deletion action

**User Experience**:
```typescript
// Before: Direct deletion on click
<button onClick={() => removePlayer(playerName)}>Delete</button>

// After: Confirmation dialog
<button onClick={() => handleRemovePlayer(playerName)}>Delete</button>

// Modal content:
"Möchtest du den Spieler 'Player Name' wirklich löschen?"
"Hinweis: Diese Aktion kann nicht rückgängig gemacht werden."
```

**Files Modified**:
- `/pwa/src/components/SettingsDialog.tsx` - Added confirmation modal and handleRemovePlayer function
- Fixed bug: Changed `importHistory` to `importGames` (correct hook name)

**Code Location**: `SettingsDialog.tsx:117-149`

#### 2. Page Refresh Warning Consistency (`Sidebar.tsx`)

**Feature**: Unified dialog behavior for game interruption across refresh and navigation

**Implementation**:
- Synchronized Sidebar warning dialog with App.tsx refresh warning
- Updated button labels for consistency: "Abbrechen" → "Spiel fortsetzen"
- Added console.log statements for debugging
- Both dialogs now use identical wording and functionality

**User Experience**:
- Consistent messaging when navigating away from active game
- Same options whether user refreshes page or clicks home button
- Clear indication that game progress may be lost

**Files Modified**:
- `/pwa/src/components/Sidebar.tsx` - Updated dialog button labels (lines 56-74)

#### 3. Player Statistics Dialog (`PlayerStatsDialog.tsx`)

**Feature**: Comprehensive player statistics with graphical visualizations

**New Component**: `PlayerStatsDialog.tsx` (223 lines)

**Statistics Tracked**:
- Total games played
- Wins and losses
- Win rate (percentage)
- Average score per game
- Best decade knowledge (based on song timeline accuracy)
- Decade distribution (songs correctly placed by decade)

**Visual Elements**:
- Medal icons (🏆🥈🥉) for top 3 players
- Progress bars for win rate visualization
- Decade distribution bars showing knowledge spread
- Players sorted by win rate descending

**Data Source**: `useGameHistory()` hook - processes entire game history

**Calculation Logic**:
```typescript
interface PlayerStats {
  name: string
  totalGames: number
  wins: number
  losses: number
  winRate: number      // Calculated: (wins / totalGames) * 100
  totalScore: number
  avgScore: number     // Calculated: totalScore / totalGames
  bestDecade: string   // Decade with most correct placements
  decadeStats: Record<string, number>  // Count per decade
}
```

**Performance**: Uses `useMemo` for efficient recalculation only when history changes

**Files Created**:
- `/pwa/src/components/PlayerStatsDialog.tsx` - Full statistics component
- `/pwa/src/utils/icons.tsx` - Added `ChartIcon` (SVG icon)

**Files Modified**:
- `/pwa/src/components/ActionBar.tsx` - Added Player Stats button between History and Settings
- `/pwa/src/components/index.ts` - Added `PlayerStatsDialog` export

**Code Location**: `ActionBar.tsx:138-150`

#### 4. Game End Celebration & Statistics (`GameEndStatsDialog.tsx`)

**Feature**: Dramatic winner celebration with confetti animation and comprehensive statistics

**New Component**: `GameEndStatsDialog.tsx` (269 lines)

**New Dependency**: `canvas-confetti` (npm package for confetti animations)

**Celebration Flow**:
1. **Confetti Animation** (3 seconds)
   - Initial burst: 100 particles from center
   - Multiple bursts from random positions (left and right sides)
   - Particle count decays over duration
   - Uses `canvas-confetti` library with custom configuration

2. **Winner Announcement**
   - Large trophy emoji (🏆)
   - Winner name with gradient text
   - Score/card count display (mode-dependent)
   - Animated bounce effect

3. **Statistics Reveal** (delayed 500ms after confetti)
   - Smooth fade-in transition
   - Round statistics for all players
   - Global statistics from game history (top 5 players)

**Round Statistics Display**:
- Player name with trophy if winner
- Cards placed count
- Songs in timeline (visual progress bar)
- Mode-specific scoring (points for Guess Mode)

**Global Statistics Display**:
- Top 5 players by win rate
- Medal icons (🥇🥈🥉) for podium positions
- Total games played
- Average score
- Win rate with visual progress bar
- Total wins count

**Visual Design**:
- Glass-morphism cards with accent borders
- Gradient backgrounds for winner display
- Smooth transitions and animations
- Progress bars with gradient fills
- Confetti zIndex: 10000 (appears above all UI elements)

**Integration**:
- Replaces simple winner modal in `GameScreen.tsx`
- Shows when game ends (player reaches 10 cards)
- Modal is `required: true` - user must click close button
- Close button triggers return to mode selection

**Files Created**:
- `/pwa/src/components/GameEndStatsDialog.tsx` - Full celebration component

**Files Modified**:
- `/pwa/src/screens/GameScreen.tsx` - Integrated GameEndStatsDialog in `showWinnerModal()` function
- `/pwa/src/components/index.ts` - Added `GameEndStatsDialog` export
- `/pwa/package.json` - Added `canvas-confetti` dependency

**Code Location**: `GameScreen.tsx:740-766`

**Confetti Configuration**:
```typescript
// Initial burst
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
})

// Continuous bursts (3 seconds)
const defaults = {
  startVelocity: 30,
  spread: 360,
  ticks: 60,
  zIndex: 10000
}

// Dual-sided bursts from random positions
confetti({ ...defaults, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
confetti({ ...defaults, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
```

### Summary of Changes (v0.0.17)

**New Components**:
1. `PlayerStatsDialog.tsx` (223 lines) - Player statistics dashboard
2. `GameEndStatsDialog.tsx` (269 lines) - Winner celebration with confetti
3. `ChartIcon` in `icons.tsx` - Statistics button icon

**Modified Components**:
1. `SettingsDialog.tsx` - Player deletion confirmation + importGames bug fix
2. `Sidebar.tsx` - Consistent dialog labels
3. `ActionBar.tsx` - Added Player Stats button
4. `GameScreen.tsx` - Integrated game end celebration
5. `index.ts` - Added new component exports

**New Dependencies**:
- `canvas-confetti` - Confetti animation library

**Total Lines Added**: ~500+ lines of new functionality

**Key Features**:
- ✅ Player deletion safety with confirmation dialog
- ✅ Comprehensive player statistics tracking
- ✅ Dramatic game end celebration with confetti
- ✅ Round and global statistics display
- ✅ Visual progress bars and medal icons
- ✅ Smooth animations and transitions
- ✅ Consistent UI/UX across all modals

**Testing Status**: Fully integrated and tested in development environment

