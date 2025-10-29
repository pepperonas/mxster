# Release Workflow für mxster

## Release-Strategie

**Zwei Release-Typen:**

1. **"latest" Release** (immer aktuell)
   - Keine Versionsnummer in Dateinamen
   - Wird bei jedem Release aktualisiert
   - Für Landing Page und README Links
   - Assets: 8 Dateien (ZIPs, PDFs, 3MF)

2. **Versionierte Releases** (v0.0.X-beta)
   - Mit Versionsnummer in Dateinamen
   - Als Pre-release markiert
   - Für historische Downloads
   - Assets: 3 Dateien (nur ZIPs)

## Quick Update: Songs hinzufügen/ändern

**Nach add-song.js oder edit-song.js:**

```bash
# Automatischer Workflow (empfohlen)
./update-and-release.sh "Add new song: [Titel] by [Artist]"

# Das Script führt automatisch aus:
# 0. Integrity Tests (bricht bei Fehlern ab)
# 1. PDFs neu generieren
# 2. Git commit & push
# 3. ZIP-Archive erstellen
# 4. GitHub "latest" Release aktualisieren
```

**Was add-song.js / edit-song.js machen:**
- ✅ Aktualisiert `docs/songs.json`
- ✅ Aktualisiert `pwa/src/data/songs.js`
- ✅ Generiert 3D-Modelle (SCAD + STL)
- ✅ Kopiert QR-Code PNG nach `docs/`
- ❌ Kein Git commit/push (das macht `update-and-release.sh`)
- ❌ Keine PDF-Regenerierung (das macht `update-and-release.sh`)
- ❌ Kein Release-Update (das macht `update-and-release.sh`)

## Vorbereitung

Stelle sicher, dass alle Änderungen committed sind und das Spiel funktioniert.

## Vollständiger Release (neue Version)

### 1. Version bump

```bash
# In pwa/package.json
# Erhöhe version: "0.0.X-beta" -> "0.0.(X+1)-beta"
```

### 2. Build & Deploy PWA

```bash
./deploy.sh
```

### 3. Generiere PDFs (111 Songs)

```bash
./generate-all-pdfs.sh
# Erstellt in pwa/:
# - mxster-cards.pdf
# - mxster-cards-bw.pdf
# - mxster-cards-duplex.pdf
# - mxster-cards-bw-duplex.pdf
```

### 4. Erstelle ZIP Archive

```bash
# Versionlose Dateien für "latest"
rm -f mxster-*.zip
zip -r mxster-scad-models.zip card-generator/models/*.scad -q
zip -r mxster-stl-models.zip card-generator/models/*.stl -q
git archive --format=zip --prefix=mxster/ -o mxster-source.zip HEAD

# Versionierte Kopien für v0.0.X-beta
cp mxster-scad-models.zip mxster-scad-models-v0.0.X-beta.zip
cp mxster-stl-models.zip mxster-stl-models-v0.0.X-beta.zip
cp mxster-source.zip mxster-source-v0.0.X-beta.zip
```

### 5. Git Commit & Push

```bash
git add pwa/package.json pwa/src/main.js
git commit -m "Release v0.0.X-beta: [Kurze Beschreibung]

- [Änderung 1]
- [Änderung 2]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 6. GitHub Release mit versionierten Dateien (nur ZIPs)

```bash
gh release create v0.0.X-beta \
  --title "v0.0.X-beta - [Titel]" \
  --prerelease \
  --notes "## 🎵 mxster v0.0.X-beta

### What's New
- [Feature/Fix 1]
- [Feature/Fix 2]

### Downloads
- **SCAD Models**: OpenSCAD source files for 3D card generation (111 cards)
- **STL Models**: Ready-to-print STL files for all 111 cards
- **Source Code**: Complete mxster game source code

### Deployment
- Live at: https://mxster.de
- PWA installable on mobile devices

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)" \
  mxster-scad-models-v0.0.X-beta.zip \
  mxster-stl-models-v0.0.X-beta.zip \
  mxster-source-v0.0.X-beta.zip
```

### 7. Update "latest" Release (ALLE Assets)

```bash
# Upload alle 8 Dateien zu "latest" (überschreibt alte Dateien)
gh release upload latest \
  mxster-scad-models.zip \
  mxster-stl-models.zip \
  mxster-source.zip \
  pwa/mxster-cards.pdf \
  pwa/mxster-cards-bw.pdf \
  pwa/mxster-cards-duplex.pdf \
  pwa/mxster-cards-bw-duplex.pdf \
  card-generator/models/all-cards.3mf \
  --clobber
```

### 8. Update "latest" Git Tag

```bash
git tag -d latest 2>/dev/null
git tag latest
git push origin latest --force
```

### 9. Update "latest" Release Notes und Status

```bash
# Update Release Notes
gh release edit latest \
  --notes "**Always points to the most recent stable version**

This release is automatically updated with each new version.

Current version: **v0.0.X-beta**

### Downloads

**3D Models (111 cards):**
- **all-cards.3mf**: All cards combined for 3D printing (12 MB)
- **mxster-scad-models.zip**: OpenSCAD source files (546 KB)
- **mxster-stl-models.zip**: Ready-to-print STL files (12 MB)

**Printable Cards (PDF):**
- **mxster-cards.pdf**: Color cards, single-sided (258 KB)
- **mxster-cards-bw.pdf**: Black & white cards, single-sided (253 KB)
- **mxster-cards-duplex.pdf**: Color cards, double-sided for duplex printing (274 KB)
- **mxster-cards-bw-duplex.pdf**: Black & white cards, double-sided (269 KB)

**Source Code:**
- **mxster-source.zip**: Complete mxster game source code (25 MB)

### Card Layout
- 6 cards per page (A4 landscape, 3x2 grid)
- ISO/IEC 7810 standard size (85.6mm x 53.98mm - credit card size)
- Cut marks included for precise cutting

For specific versions, see: https://github.com/pepperonas/mxster/releases

---
🔄 Auto-updated: $(date '+%Y-%m-%d %H:%M')"

# Setze "latest" als offizielles Latest Release (erscheint ganz oben)
gh release edit latest --prerelease=false --latest
```

## Download-Links (für Landing Page / README)

**Immer aktuell (latest) - 8 Dateien:**
- 3MF: `https://github.com/pepperonas/mxster/releases/download/latest/all-cards.3mf`
- SCAD: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-scad-models.zip`
- STL: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-stl-models.zip`
- PDF Color: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-cards.pdf`
- PDF B&W: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-cards-bw.pdf`
- PDF Duplex Color: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-cards-duplex.pdf`
- PDF Duplex B&W: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-cards-bw-duplex.pdf`
- Source: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-source.zip`

**Spezifische Version (nur ZIPs):**
- `https://github.com/pepperonas/mxster/releases/tag/v0.0.X-beta`

## Verifizierung

1. ✅ PWA läuft auf https://mxster.de
2. ✅ GitHub Release v0.0.X-beta existiert mit 3 Assets (ZIPs)
3. ✅ "latest" Release hat 8 Assets (ZIPs, PDFs, 3MF)
4. ✅ "latest" Release zeigt korrekte Version in Notes
5. ✅ Download-Links funktionieren
6. ✅ Git Tag `latest` zeigt auf aktuellen Commit
7. ✅ "latest" steht ganz oben in Release-Liste

## Wichtige Hinweise

### Dateistruktur

**PDFs werden NUR in `pwa/` generiert:**
- ✅ `pwa/mxster-cards.pdf` (wird für Release verwendet)
- ✅ `pwa/mxster-cards-bw.pdf` (wird für Release verwendet)
- ✅ `pwa/mxster-cards-duplex.pdf` (wird für Release verwendet)
- ✅ `pwa/mxster-cards-bw-duplex.pdf` (wird für Release verwendet)
- ❌ KEINE PDFs im Root-Verzeichnis (sind redundant)

**ZIPs werden im Root generiert:**
- ✅ `mxster-scad-models.zip` (temporär, für Release)
- ✅ `mxster-stl-models.zip` (temporär, für Release)
- ✅ `mxster-source.zip` (temporär, für Release)
- ℹ️ Diese können nach Upload gelöscht werden

**3D-Modelle:**
- `card-generator/models/*.scad` (im Git)
- `card-generator/models/*.stl` (im Git)
- `card-generator/models/all-cards.3mf` (im Git, für Release)

## Troubleshooting

**"release not found" beim Upload zu latest:**
```bash
# Prüfe ob "latest" Release existiert
gh release view latest

# Falls nicht: Erstelle es einmalig
gh release create latest \
  --title "Latest Release" \
  --notes "..." \
  --prerelease \
  mxster-scad-models.zip \
  mxster-stl-models.zip \
  mxster-source.zip
```

**Dateigröße Referenz:**
- SCAD ZIP: ~546 KB (111 Dateien)
- STL ZIP: ~12 MB (111 Dateien)
- Source ZIP: ~25 MB (enthält node_modules)
- PDFs: ~250-280 KB pro Datei
- 3MF: ~12 MB (kombiniert)

**PWA cached alte Version:**
- Hard Refresh im Browser: STRG+SHIFT+R
- Service Worker deregistrieren in DevTools
- Inkognito-Modus testen
