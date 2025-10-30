# mxster Testing Guide

## Automatisierte Integrity Tests

Das Projekt verwendet automatisierte Tests, um die Integrität aller Daten und Dateien zu überprüfen.

## Lokal testen

```bash
# Einfacher Test
npm test

# Oder direkt
node test-integrity.js
```

## Was wird getestet?

### 1. **Song Daten-Integrität**
- ✅ songs.json kann geladen werden
- ✅ PWA songs.ts stimmt mit songs.json überein
- ✅ Alle Songs haben Pflichtfelder: id, title, artist, year, spotifyId
- ✅ Jahre sind im gültigen Bereich (1900-heute)

### 2. **ID-Eindeutigkeit**
- ✅ Keine doppelten Song-IDs
- ✅ Spotify-IDs haben korrektes Format (22 alphanumerische Zeichen)

### 3. **3D-Modell-Vollständigkeit**
- ✅ Jeder Song hat SCAD-Datei (card-generator/models/)
- ✅ Jeder Song hat STL-Datei (card-generator/models/)
- ✅ all-cards.3mf existiert und hat valide Größe

### 4. **QR-Code-Vollständigkeit**
- ✅ Jeder Song hat PNG-Datei mit QR-Code (docs/)
- ✅ Dateinamen-Konsistenz zwischen allen Dateien

### 5. **Datei-Anzahl-Konsistenz**
- ✅ Anzahl Songs = Anzahl SCAD = Anzahl STL = Anzahl PNG

## Test-Output Beispiel

```
╔════════════════════════════════════════════╗
║   🧪 mxster Integrity Test Suite 🧪      ║
╚════════════════════════════════════════════╝

[Test 1] Loading songs.json...
✅ Loaded 111 songs from songs.json

[Test 2] Validating PWA songs.ts...
✅ PWA songs.ts matches songs.json (111 songs)

[Test 3] Validating song data structure...
✅ All songs have required fields

...

╔════════════════════════════════════════════╗
║              Test Summary                  ║
╚════════════════════════════════════════════╝

Passed: 9
Failed: 0

✅ All tests passed!
```

## GitHub Actions

Tests laufen automatisch auf GitHub bei:
- ✅ Push auf `main` Branch
- ✅ Pull Requests
- ✅ Manuell über "Actions" Tab

### Status Badge

Füge dies zu README.md hinzu:

```markdown
![Tests](https://github.com/pepperonas/mxster/actions/workflows/test.yml/badge.svg)
```

## Wann sollten Tests laufen?

### Lokal (empfohlen):
```bash
# Nach add-song.js / edit-song.js
node add-song.js "spotify-url"
npm test  # ← Prüfe Integrität

# Vor Git Commit
npm test
git add .
git commit -m "..."
```

### Automatisch auf GitHub:
- Tests laufen bei jedem Push
- Fehler werden sofort erkannt
- PR-Merge nur wenn Tests bestehen

## Test-Fehler beheben

### Fehler: "Missing SCAD/STL file"
```bash
# Regeneriere fehlende 3D-Modelle
node card-generator/generateCard.js
```

### Fehler: "PWA songs.ts count mismatch"
```bash
# Sync PWA mit songs.json
node -e "const songs = require('./docs/songs.json'); require('fs').writeFileSync('pwa/src/data/songs.js', 'export const songs = ' + JSON.stringify(songs, null, 2))"
```

### Fehler: "Duplicate IDs found"
```bash
# Prüfe songs.json auf doppelte IDs
grep -o '"id": "[^"]*"' docs/songs.json | sort | uniq -d
```

## Integration mit update-and-release.sh

Das automatische Update-Script führt keine Tests aus. Empfohlen:

```bash
# Manuell vor Release testen
npm test

# Dann erst Release
./update-and-release.sh "message"
```

Oder erweitere `update-and-release.sh`:

```bash
# Am Anfang hinzufügen
echo "Running integrity tests..."
npm test || { echo "Tests failed! Aborting."; exit 1; }
```

## Vorteile

### Lokale Tests:
- ✅ Schnell (Sekunden)
- ✅ Sofortiges Feedback
- ✅ Kein Internet nötig
- ✅ Vor Commit prüfen

### GitHub Actions:
- ✅ Automatisch bei jedem Push
- ✅ Verhindert fehlerhafte Commits
- ✅ PR-Review-Prozess
- ✅ Öffentlicher Status

## Empfehlung

**Beste Strategie: Beides nutzen**

1. **Lokal testen** während Entwicklung (schnell, direktes Feedback)
2. **GitHub Actions** als Safety-Net (automatisch, immer aktiv)

```bash
# Workflow
node add-song.js "url"     # Song hinzufügen
npm test                   # Lokal prüfen ✅
git add . && git commit    # Wenn Tests OK
git push                   # GitHub Actions prüft nochmal ✅
```

## Zukünftige Erweiterungen

Mögliche zusätzliche Tests:
- 🔄 QR-Code tatsächlich decodieren (erfordert externe Library)
- 🔄 Spotify API: IDs existieren noch
- 🔄 PDF-Generierung testen
- 🔄 3D-Modell Validierung (OpenSCAD syntax check)
- 🔄 Bild-Dimensionen prüfen
