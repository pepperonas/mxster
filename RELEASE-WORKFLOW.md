# Release Workflow für mxster

## Vorbereitung

Stelle sicher, dass alle Änderungen committed sind und das Spiel funktioniert.

## Release-Schritte

### 1. Version bump

```bash
# In pwa/package.json
# Erhöhe version: "0.0.X-beta" -> "0.0.(X+1)-beta"
```

### 2. Build & Deploy PWA

```bash
./deploy.sh
```

### 3. ZIP Archive erstellen

```bash
# SCAD Models (111 Dateien)
zip -r mxster-scad-models-v0.0.X-beta.zip card-generator/models/*.scad -q

# STL Models (111 Dateien)
zip -r mxster-stl-models-v0.0.X-beta.zip card-generator/models/*.stl -q

# Source Code (Git Archive)
git archive --format=zip --prefix=mxster-v0.0.X-beta/ -o mxster-source-v0.0.X-beta.zip HEAD
```

### 4. Git Commit & Push

```bash
git add pwa/package.json pwa/src/main.js
git commit -m "Release v0.0.X-beta: [Kurze Beschreibung]

- [Änderung 1]
- [Änderung 2]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 5. GitHub Release mit versionierten Dateien

```bash
gh release create v0.0.X-beta \
  --title "v0.0.X-beta - [Titel]" \
  --prerelease \
  --notes "## 🎵 mxster v0.0.X-beta

### What's New
- [Feature/Fix 1]
- [Feature/Fix 2]

### Downloads
- **SCAD Models**: OpenSCAD source files for 3D card generation
- **STL Models**: Ready-to-print STL files for all XXX cards
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

### 6. Versionlose Kopien für "latest" Release

```bash
# Erstelle Kopien ohne Versionsnummer
cp mxster-scad-models-v0.0.X-beta.zip mxster-scad-models.zip
cp mxster-stl-models-v0.0.X-beta.zip mxster-stl-models.zip
cp mxster-source-v0.0.X-beta.zip mxster-source.zip

# Upload zu "latest" Release (überschreibt alte Dateien)
gh release upload latest \
  mxster-scad-models.zip \
  mxster-stl-models.zip \
  mxster-source.zip \
  --clobber
```

### 7. Update "latest" Git Tag

```bash
git tag -d latest 2>/dev/null
git tag latest
git push origin latest --force
```

### 8. Update "latest" Release Notes und Status

```bash
# Update Release Notes
gh release edit latest \
  --notes "**Always points to the most recent stable version**

This release is automatically updated with each new version.

Current version: **v0.0.X-beta**

### Downloads
- **SCAD Models**: OpenSCAD source files for 3D card generation
- **STL Models**: Ready-to-print STL files for all cards
- **Source Code**: Complete mxster game source code

For specific versions, see: https://github.com/pepperonas/mxster/releases

---
🔄 Auto-updated: $(date '+%Y-%m-%d %H:%M')"

# Setze "latest" als offizielles Latest Release (erscheint ganz oben)
gh release edit latest --prerelease=false --latest
```

## Download-Links (für Landing Page / README)

**Immer aktuell (latest):**
- SCAD Models: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-scad-models.zip`
- STL Models: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-stl-models.zip`
- Source Code: `https://github.com/pepperonas/mxster/releases/download/latest/mxster-source.zip`

**Spezifische Version:**
- `https://github.com/pepperonas/mxster/releases/tag/v0.0.X-beta`

## Verifizierung

1. ✅ PWA läuft auf https://mxster.de
2. ✅ GitHub Release v0.0.X-beta existiert mit Assets
3. ✅ "latest" Release zeigt korrekte Version in Notes
4. ✅ Download-Links funktionieren
5. ✅ Git Tag `latest` zeigt auf aktuellen Commit

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

**ZIP-Dateien zu groß:**
- SCAD: ~500 KB (normal)
- STL: ~12 MB (normal)
- Source: ~25 MB (normal, enthält node_modules)

**PWA cached alte Version:**
- Hard Refresh im Browser: STRG+SHIFT+R
- Service Worker deregistrieren in DevTools
- Inkognito-Modus testen
