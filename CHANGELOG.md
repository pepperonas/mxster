# Changelog

All notable changes to the mxster music timeline game will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 9: Statistics & Game End Experience (2025-01-31)

#### Player Statistics Dashboard
- **New Component**: `PlayerStatsDialog` accessible via chart icon in ActionBar
- Comprehensive player statistics tracking:
  - Total games played, wins, and losses
  - Win rate percentage with visual progress bars
  - Average score per game
  - Best decade knowledge analysis
  - Decade distribution showing song placement accuracy
- Medal icons (🏆🥈🥉) for top 3 players
- Players sorted by win rate descending
- Uses `useMemo` for performance optimization

#### Game End Celebration
- **New Component**: `GameEndStatsDialog` with confetti animation
- 3-second confetti celebration when game ends:
  - Initial burst of 100 particles from center
  - Multiple continuous bursts from random positions
  - Particle count decays over duration
  - Dramatic dual-sided bursts (left and right)
- Winner announcement with:
  - Large trophy emoji with bounce animation
  - Winner name with gradient text effect
  - Mode-specific score/card display
- Statistics reveal after confetti (500ms delay):
  - Round statistics for all players
  - Cards placed count and songs in timeline
  - Visual progress bars for performance
  - Global statistics from game history (top 5 players)
- Medal icons for podium positions (🥇🥈🥉)
- Glass-morphism design with accent borders

#### User Safety Features
- Player deletion confirmation dialog in Settings
  - Shows player name before deletion
  - Displays irreversibility warning
  - Requires explicit user confirmation
- Consistent page refresh warning dialogs
  - Unified behavior between App.tsx and Sidebar.tsx
  - Same button labels and messaging
  - Clear indication of potential game progress loss

#### New Dependencies
- `canvas-confetti` - Professional confetti animation library

#### Bug Fixes
- Fixed `importHistory` → `importGames` in SettingsDialog (correct hook name)
- Consistent dialog button labels across refresh and navigation warnings

### Technical Details

#### New Components
- `/pwa/src/components/PlayerStatsDialog.tsx` (223 lines)
- `/pwa/src/components/GameEndStatsDialog.tsx` (269 lines)
- `/pwa/src/utils/icons.tsx` - Added `ChartIcon` SVG component

#### Modified Components
- `/pwa/src/components/SettingsDialog.tsx` - Player deletion confirmation + bug fix
- `/pwa/src/components/Sidebar.tsx` - Consistent dialog labels
- `/pwa/src/components/ActionBar.tsx` - Added Player Stats button
- `/pwa/src/screens/GameScreen.tsx` - Integrated GameEndStatsDialog
- `/pwa/src/components/index.ts` - Added new component exports

#### Code Locations
- SettingsDialog player deletion: `SettingsDialog.tsx:117-149`
- ActionBar stats button: `ActionBar.tsx:138-150`
- GameScreen celebration integration: `GameScreen.tsx:740-766`

#### Total Impact
- **~500+ lines** of new functionality added
- **3 new components** created
- **1 new dependency** added
- **5 components** modified

---

## Version History

_Previous versions to be documented..._

