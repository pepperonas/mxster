# Testing Guide für mxster PWA

Umfassende Dokumentation für automatisierte Tests im mxster-Projekt.

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Quick Start](#quick-start)
- [Test-Infrastruktur](#test-infrastruktur)
- [Test-Kategorien](#test-kategorien)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Übersicht

### Aktueller Test-Stand

- **Test Files**: 2
- **Test Cases**: 145 (alle bestanden ✅)
- **Coverage**: 80%+ auf kritischen Pfaden
- **Framework**: Vitest + React Testing Library

### Was wird getestet

#### ✅ Phase 1+2 (Implementiert)
- **Unit Tests**: Game Logic, Text Matching (145 Tests)
- **Code Coverage**: Game-Logik, Fuzzy Matching, Punkteberechnung

#### 🚧 Phase 3+ (Ausbaubar)
- Component Tests (GameScreen, GuessForm, Timeline)
- Achievement System Tests
- Integration Tests (komplette Spielabläufe)
- E2E Tests (Playwright/Cypress)

---

## Quick Start

### Tests ausführen

```bash
# Watch-Modus (automatisches Re-run bei Änderungen)
npm test

# Einmalig ausführen (CI-Modus)
npm run test:run

# Mit visueller UI
npm run test:ui

# Mit Coverage-Report
npm run test:coverage
```

### Erster Test schreiben

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })
})
```

---

## Test-Infrastruktur

### Framework-Stack

**Vitest** (v4.0.7)
- ESM-native, 100x schneller als Jest für Vite-Projekte
- Kompatibel mit Jest API
- Built-in TypeScript-Support
- Watch-Mode und UI-Mode

**React Testing Library** (v16.3.0)
- User-centric Testing (wie User interagiert, nicht Implementation)
- Best Practices für Accessibility
- Offizielle React-Empfehlung

**jsdom** (v27.1.0)
- Browser-Environment-Simulation für Node.js
- DOM-APIs für React-Component-Tests

### Konfigurationsdateien

#### `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      // ... weitere Aliase
    }
  }
})
```

#### `src/test/setup.ts`

Global Test Setup:
- Cleanup nach jedem Test
- localStorage Mock
- matchMedia Mock (für responsive Components)
- IntersectionObserver Mock
- ResizeObserver Mock
- canvas-confetti Mock
- Howler.js Mock (Audio)
- QR-Scanner Mock
- Three.js Mock (3D Partikel)

### Test-Scripts

```json
{
  "scripts": {
    "test": "vitest",                 // Watch-Modus
    "test:ui": "vitest --ui",          // UI-Modus
    "test:run": "vitest run",          // Einmalig (CI)
    "test:coverage": "vitest run --coverage"  // Mit Coverage
  }
}
```

---

## Test-Kategorien

### 1. Unit Tests (gameLogic.test.ts) - 63 Tests

**Getestet:**
- ✅ `validateGuess()` - Guess-Validierung mit Fuzzy Matching (9 Tests)
- ✅ `calculatePoints()` - Punkteberechnung 0-15 Punkte (12 Tests)
- ✅ `placeCardInTimeline()` - Timeline-Insertion (4 Tests)
- ✅ `sortTimelineByYear()` - Chronologische Sortierung (2 Tests)
- ✅ `isTimelineValid()` - Timeline-Validierung (5 Tests)
- ✅ `checkWinCondition()` - Win-Detection (alle Modi: hardcore, timeline_personal, timeline_global) (7 Tests)
- ✅ `selectRandomSong()` - Zufallsauswahl ohne Duplikate (4 Tests)
- ✅ `getNextPlayerIndex()` / `getNextDJIndex()` - Spielerwechsel (6 Tests)
- ✅ `updatePlayerScore()` / `incrementPlayerCards()` - Player-Updates (4 Tests)
- ✅ `addToPlayedSongs()` / `isSongPlayed()` - Song-Tracking (6 Tests)

**Beispiel:**

```typescript
describe('calculatePoints', () => {
  it('should award 15 points for perfect guess (5+5+5)', () => {
    const points = calculatePoints(true, true, 0)
    expect(points).toBe(15)
  })

  it('should award 12 points for ±1 year (5+5+2)', () => {
    const points = calculatePoints(true, true, 1)
    expect(points).toBe(12)
  })
})
```

### 2. Text Matcher Tests (textMatcher.test.ts) - 82 Tests

**Getestet:**
- ✅ `removeTrackSuffixes()` - Suffix-Removal (300+ Patterns: Remix, Radio Edit, Remaster) (24 Tests)
- ✅ `normalizeText()` - Text-Normalisierung (Umlaute, Special Chars, Phonetic) (21 Tests)
- ✅ `levenshteinDistance()` - Edit-Distance-Algorithmus (12 Tests)
- ✅ `fuzzyMatch()` - Fuzzy Matching mit 15% Toleranz (21 Tests)
- ✅ `checkSongGuess()` - Integration Title+Artist (7 Tests)

**Beispiele:**

```typescript
describe('removeTrackSuffixes', () => {
  it('should remove "- Radio Edit"', () => {
    expect(removeTrackSuffixes('Song Title (Radio Edit)')).toBe('Song Title')
  })
})

describe('fuzzyMatch', () => {
  it('should match with 1-2 typos (under 15% tolerance)', () => {
    expect(fuzzyMatch('Michael Jakson', 'Michael Jackson')).toBe(true)
    expect(fuzzyMatch('Billie Jeen', 'Billie Jean')).toBe(true)
  })

  it('should match ignoring "The" prefix', () => {
    expect(fuzzyMatch('The Beatles', 'Beatles')).toBe(true)
  })
})
```

---

## Best Practices

### Test-Struktur

**AAA-Pattern** (Arrange, Act, Assert):

```typescript
it('should calculate points correctly', () => {
  // Arrange: Setup
  const titleMatch = true
  const artistMatch = true
  const yearDifference = 0

  // Act: Ausführung
  const points = calculatePoints(titleMatch, artistMatch, yearDifference)

  // Assert: Erwartung
  expect(points).toBe(15)
})
```

### Naming Conventions

**Descriptive Test Names:**

```typescript
// ✅ Gut: Beschreibt Verhalten und Erwartung
it('should award 15 points for perfect guess (5+5+5)', () => {})

// ❌ Schlecht: Vage Beschreibung
it('test points calculation', () => {})
```

### Test Data

**Factory Functions:**

```typescript
const createTestSong = (overrides: Partial<Song> = {}): Song => ({
  id: 'song_1',
  title: 'Billie Jean',
  artist: 'Michael Jackson',
  year: 1983,
  spotifyId: 'test123',
  previewUrl: 'https://preview.url',
  ...overrides  // Override einzelne Felder
})

// Usage
const song = createTestSong({ year: 1990 })
```

### Edge Cases

**Immer testen:**
- Empty inputs (`''`, `null`, `undefined`)
- Boundary values (min/max)
- Invalid inputs (negative numbers, wrong types)
- Error cases

```typescript
describe('validateGuess', () => {
  it('should handle empty inputs', () => {
    const result = validateGuess('', '', '', testSong)
    expect(result.correctCount).toBe(0)
  })

  it('should handle invalid year input', () => {
    const result = validateGuess('Title', 'Artist', 'abc', testSong)
    expect(result.yearMatch).toBe(false)
  })
})
```

---

## CI/CD Integration

### GitHub Actions

**.github/workflows/test.yml:**

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd pwa && npm install
      - run: cd pwa && npm run test:run
      - run: cd pwa && npm run test:coverage
```

### Pre-Commit Hook

**Mit Husky:**

```bash
npm install -D husky
npx husky install
npx husky add .husky/pre-commit "cd pwa && npm test -- --run"
```

---

## Troubleshooting

### Häufige Fehler

#### 1. Import-Fehler mit @-Alias

**Problem:**
```
Error: Cannot find module '@/utils/textMatcher'
```

**Lösung:**
Prüfe `vitest.config.ts` Aliase:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

#### 2. localStorage is not defined

**Problem:**
```
ReferenceError: localStorage is not defined
```

**Lösung:**
Mock ist in `test/setup.ts` definiert. Sicherstellen dass `setupFiles` in `vitest.config.ts` korrekt ist.

#### 3. Coverage-Report nicht generiert

**Problem:**
Kein Coverage-Ordner nach `npm run test:coverage`.

**Lösung:**
```bash
npm install -D @vitest/coverage-v8
npm run test:coverage
```

---

## Nächste Schritte (Erweiterung)

### Phase 3: Component Tests

**GameScreen.test.tsx**, **GuessForm.test.tsx**, **TimelineDisplay.test.tsx**

### Phase 4: Achievement Tests

**AchievementContext.test.tsx** - Alle 20 Achievements validieren

### Phase 5: Integration Tests

**gameFlow.test.tsx** - Komplette Spielabläufe

### Phase 6: E2E Tests

Mit Playwright oder Cypress

---

## Ressourcen

- **Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Projekt-Dokumentation**: `../CLAUDE.md`

---

**Stand:** Version 0.0.26 | **Letztes Update:** 2025-11-05
