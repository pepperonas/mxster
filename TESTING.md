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

## Audio File Validation

### Self-Hosted Audio Tests

Das Projekt hostet 209 selbst-gehostete Audio-Dateien (~933 MB) auf dem VPS.

**Validation Script**: `scripts/audio-hosting/validate-audio.js`

### Lokal testen

```bash
cd scripts/audio-hosting

# Sample Test (10 zufällige Songs)
node validate-audio.js

# Full Test (alle 209 Songs)
node validate-audio.js --full
```

### Was wird geprüft?

#### HTTP Erreichbarkeit
- ✅ HTTP Status Code 200 (erfolgreich geladen)
- ✅ Response Time < 5 Sekunden
- ✅ HTTPS-Verbindung funktioniert

#### Audio File Properties
- ✅ Content-Type: `audio/mpeg`
- ✅ File Size: 1-15 MB (typisch 3-5 MB für 128 kbps MP3)
- ✅ File existiert auf Server (nicht 404)

#### URL Format
- ✅ Format: `https://mxster.de/audio/song_XXX.mp3`
- ✅ ID-Matching: song_XXX entspricht songs.json ID
- ✅ Alle 209 Songs haben gültige previewUrl

### Test Output

```
🎵 mxster Audio Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Testing 10 sample songs...

[1/10] song_001 - Michael Jackson - Billie Jean (1983)
  ✅ HTTP 200 | ✅ audio/mpeg | ✅ 4.2 MB | ⏱️ 890ms

[2/10] song_042 - Whitney Houston - I Wanna Dance with Somebody (1987)
  ✅ HTTP 200 | ✅ audio/mpeg | ✅ 3.8 MB | ⏱️ 720ms

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All 10 sample songs validated successfully!

Validation report saved to: docs/validation-report.json
```

### Validation Report

Das Script generiert einen JSON-Report:

**Location**: `docs/validation-report.json`

```json
{
  "timestamp": "2025-11-06T10:30:45.123Z",
  "totalTested": 10,
  "passed": 10,
  "failed": 0,
  "results": [
    {
      "id": "song_001",
      "url": "https://mxster.de/audio/song_001.mp3",
      "status": 200,
      "contentType": "audio/mpeg",
      "size": 4423680,
      "responseTime": 890,
      "success": true
    }
  ]
}
```

### Wann sollte Audio-Validierung laufen?

**Nach Audio-Upload:**
```bash
# Upload songs to VPS
node scripts/audio-hosting/upload-to-vps.js

# Validate accessibility
node scripts/audio-hosting/validate-audio.js --full

# Update README if any failures
```

**Nach nginx-Konfiguration:**
```bash
# After nginx reload
ssh root@mrx3k1.de "sudo systemctl reload nginx"

# Test audio serving
node scripts/audio-hosting/validate-audio.js
```

**Vor Deployment:**
```bash
# Full validation before production deploy
node scripts/audio-hosting/validate-audio.js --full

# If all pass → deploy
./scripts/deployment/deploy.sh
```

### Fehler beheben

#### Fehler: "HTTP 404 Not Found"
```bash
# Check if file exists on VPS
ssh root@mrx3k1.de "ls -lh /var/www/html/mxster/audio/song_XXX.mp3"

# Re-upload missing files
cd scripts/audio-hosting
node upload-to-vps.js
```

#### Fehler: "Wrong Content-Type"
```bash
# Fix nginx MIME type configuration
ssh root@mrx3k1.de "sudo nano /etc/nginx/sites-available/mxster.de"

# Ensure:
# location /audio/ {
#   add_header Content-Type "audio/mpeg";
# }

# Reload nginx
ssh root@mrx3k1.de "sudo systemctl reload nginx"
```

#### Fehler: "File Size Too Small"
```bash
# Re-download corrupted song
cd scripts/audio-hosting
node download-songs.js --limit 1  # Download one specific song

# Re-upload
node upload-to-vps.js
```

### Legal Grey Area Testing

⚠️ **Password Protection (`ydl`) Validation**:

```bash
# Test password dialog (manual)
1. Open https://mxster.de
2. Click "Jetzt spielen (Gratis)"
3. Verify password prompt appears
4. Enter "ydl"
5. Check audio playback works
```

**Purpose**: Ensure legal safeguard (password) is active before granting access to YouTube-downloaded audio files.

## Zukünftige Erweiterungen

Mögliche zusätzliche Tests:
- 🔄 QR-Code tatsächlich decodieren (erfordert externe Library)
- 🔄 Spotify API: IDs existieren noch
- 🔄 PDF-Generierung testen
- 🔄 3D-Modell Validierung (OpenSCAD syntax check)
- 🔄 Bild-Dimensionen prüfen
- ✅ **Audio File Validation** (implemented in v0.0.27)
