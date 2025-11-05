# 🎵 mxster Audio Hosting Scripts

Self-hosting-Lösung für mxster Musik-Dateien. Diese Skripte ermöglichen es, volle Songs (128 kbps MP3) via yt-dlp herunterzuladen, auf den VPS hochzuladen und in der App zu verwenden.

## ⚠️ Rechtlicher Hinweis

**YouTube-DL für Musik-Downloads ist rechtlich umstritten.** Die Nutzung erfolgt auf eigenes Risiko und sollte nur für private, nicht-kommerzielle Zwecke erfolgen. Prüfe die Rechtslage in deinem Land.

## 🚀 Schnellstart (Komplett-Workflow)

```bash
# 1. yt-dlp installieren (einmalig)
pip install yt-dlp
# oder
npm install -g yt-dlp

# 2. Songs herunterladen (dauert 30-60 Minuten für 209 Songs)
node scripts/audio-hosting/download-songs.js

# 3. Auf VPS hochladen
node scripts/audio-hosting/upload-to-vps.js

# 4. URLs in songs.json/songs.ts aktualisieren
node scripts/audio-hosting/update-song-urls.js

# 5. Validierung durchführen
node scripts/audio-hosting/validate-audio.js

# 6. PWA bauen und deployen
cd pwa && npm run build
cd .. && ./scripts/deployment/deploy.sh
```

## 📋 Skripte im Detail

### 1. `download-songs.js` - Song Download

Downloads volle Songs (3-5 Minuten) als 128 kbps MP3 von YouTube.

**Basis-Verwendung:**
```bash
node scripts/audio-hosting/download-songs.js
```

**Optionen:**
```bash
# Test mit ersten 10 Songs
node scripts/audio-hosting/download-songs.js --limit 10

# Nur fehlende Songs herunterladen (skip existing)
node scripts/audio-hosting/download-songs.js --resume
```

**Was passiert:**
- Liest `docs/songs.json` (209 Songs)
- Sucht auf YouTube: `"Artist - Title"`
- Downloaded MP3 (128 kbps) nach `pwa/public/audio/`
- Erstellt `docs/download-report.json` mit Erfolg/Fehler-Status

**Features:**
- ✅ 3 parallele Downloads (konfigurierbar)
- ✅ Bis zu 3 Retry-Versuche pro Song
- ✅ Überspringt vorhandene Dateien (--resume)
- ✅ Fortschritts-Tracking mit Batch-Anzeige

**Speicherbedarf:**
- ~730 MB für 209 Songs (128 kbps, durchschnittlich 3.5 MB pro Song)

**Erwartete Dauer:**
- ~30-60 Minuten für alle 209 Songs (abhängig von Internet-Geschwindigkeit)

---

### 2. `upload-to-vps.js` - VPS Upload

Uploaded MP3-Dateien via rsync auf den VPS.

**Basis-Verwendung:**
```bash
node scripts/audio-hosting/upload-to-vps.js
```

**Optionen:**
```bash
# Dry-run (zeigt was passieren würde)
node scripts/audio-hosting/upload-to-vps.js --dry-run
```

**Was passiert:**
- Uploaded `pwa/public/audio/*.mp3` nach `root@mrx3k1.de:/var/www/html/mxster/audio/`
- Nutzt rsync (nur neue/geänderte Dateien)
- Setzt Berechtigungen (644)
- Prüft nginx-Konfiguration
- Testet HTTPS-Zugriff

**Voraussetzungen:**
- SSH-Zugriff zum VPS (`ssh root@mrx3k1.de` muss funktionieren)
- rsync installiert (auf macOS/Linux standardmäßig vorhanden)

**nginx Konfiguration:**

Falls noch nicht vorhanden, füge zu `/etc/nginx/sites-available/mxster.de` hinzu:

```nginx
location /audio/ {
    alias /var/www/html/mxster/audio/;
    add_header Cache-Control "public, max-age=31536000";
    add_header Access-Control-Allow-Origin "*";
    add_header Content-Type "audio/mpeg";
}
```

Dann nginx neu laden:
```bash
ssh root@mrx3k1.de "sudo nginx -t && sudo systemctl reload nginx"
```

---

### 3. `update-song-urls.js` - URL Update

Aktualisiert `previewUrl` in `songs.json` und `songs.ts`.

**Basis-Verwendung:**
```bash
node scripts/audio-hosting/update-song-urls.js
```

**Optionen:**
```bash
# Dry-run (zeigt Änderungen ohne zu speichern)
node scripts/audio-hosting/update-song-urls.js --dry-run
```

**Was passiert:**
- Liest `pwa/public/audio/` (verfügbare MP3s)
- Aktualisiert `docs/songs.json`: `previewUrl: "https://mxster.de/audio/song_XXX.mp3"`
- Aktualisiert `pwa/src/data/songs.ts` mit neuen URLs
- Erstellt Backups vor Änderungen (`.backup-YYYY-MM-DD`)

**Beispiel Änderung:**
```json
// Vorher
{
  "id": "song_000",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley",
  "year": 1987,
  "spotifyId": "4PTG3Z6ehGkBFwjybzWkR8",
  "previewUrl": ""
}

// Nachher
{
  "id": "song_000",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley",
  "year": 1987,
  "spotifyId": "4PTG3Z6ehGkBFwjybzWkR8",
  "previewUrl": "https://mxster.de/audio/song_000.mp3"
}
```

---

### 4. `validate-audio.js` - Validierung

Prüft ob alle Audio-URLs via HTTPS erreichbar sind.

**Basis-Verwendung:**
```bash
node scripts/audio-hosting/validate-audio.js
```

**Optionen:**
```bash
# Alle 209 Songs prüfen (langsam)
node scripts/audio-hosting/validate-audio.js --full
```

**Was wird geprüft:**
- ✅ HTTP Status 200 (erfolgreich)
- ✅ Content-Type: audio/mpeg
- ✅ Dateigröße (1-15 MB Bereich)
- ⚠️ Warnung bei zu kleinen (<1 MB) oder großen (>15 MB) Dateien

**Quick Check (Standard):**
- Prüft 10 zufällige Songs
- Dauert ~5-10 Sekunden
- Gut für schnelle Checks

**Full Check (--full):**
- Prüft alle 209 Songs
- Dauert ~2-3 Minuten
- Vor Production-Deployment empfohlen

**Report:**
Erstellt `docs/validation-report.json` mit:
- Erfolgreiche URLs
- Fehlgeschlagene URLs + Fehlergrund
- Warnungen (ungewöhnliche Dateigrößen)
- Statistiken (Success Rate, Durchschnittsgröße, etc.)

---

## 📂 Verzeichnisstruktur

Nach Ausführung aller Skripte:

```
mxster/
├── scripts/audio-hosting/
│   ├── download-songs.js
│   ├── upload-to-vps.js
│   ├── update-song-urls.js
│   ├── validate-audio.js
│   └── README.md
├── pwa/public/audio/           # Lokal (gitignored)
│   ├── song_000.mp3
│   ├── song_001.mp3
│   └── ... (209 total)
└── docs/
    ├── songs.json              # Aktualisiert mit previewUrl
    ├── download-report.json    # Download-Status
    └── validation-report.json  # Validierungs-Status
```

VPS:
```
/var/www/html/mxster/
└── audio/
    ├── song_000.mp3
    ├── song_001.mp3
    └── ... (209 total)
```

---

## 🔄 Typische Workflows

### Erstmaliges Setup

```bash
# 1. Downloads (30-60 min)
node scripts/audio-hosting/download-songs.js

# 2. Upload (5-10 min)
node scripts/audio-hosting/upload-to-vps.js

# 3. URLs aktualisieren
node scripts/audio-hosting/update-song-urls.js

# 4. Validieren
node scripts/audio-hosting/validate-audio.js --full

# 5. Deploy
cd pwa && npm run build
cd .. && ./scripts/deployment/deploy.sh
```

### Einzelne Songs nachträglich hinzufügen

```bash
# 1. Neuen Song zur Datenbank hinzufügen
node scripts/song-management/add-song.js "spotify-url"

# 2. MP3 für neuen Song herunterladen
node scripts/audio-hosting/download-songs.js --resume

# 3. Neuen Song hochladen
node scripts/audio-hosting/upload-to-vps.js

# 4. URLs aktualisieren
node scripts/audio-hosting/update-song-urls.js

# 5. Neuen Song validieren
node scripts/audio-hosting/validate-audio.js
```

### Fehlgeschlagene Downloads wiederholen

```bash
# Download-Report ansehen
cat docs/download-report.json

# Nur fehlende Songs herunterladen
node scripts/audio-hosting/download-songs.js --resume

# Upload + Update + Validierung
node scripts/audio-hosting/upload-to-vps.js
node scripts/audio-hosting/update-song-urls.js
node scripts/audio-hosting/validate-audio.js
```

---

## 🐛 Troubleshooting

### Download schlägt fehl

**Problem:** `yt-dlp not found`

**Lösung:**
```bash
pip install yt-dlp
# oder
npm install -g yt-dlp
```

**Problem:** `Error: File not created`

**Lösung:**
- Song ist auf YouTube nicht verfügbar
- YouTube hat API-Limit erreicht (warte 1 Stunde)
- Nutze `--resume` um fehlerhafte Songs zu überspringen

### Upload schlägt fehl

**Problem:** `Cannot connect to VPS`

**Lösung:**
```bash
# Teste SSH-Verbindung
ssh root@mrx3k1.de

# Falls nicht konfiguriert, füge SSH-Key hinzu
ssh-copy-id root@mrx3k1.de
```

**Problem:** `Permission denied`

**Lösung:**
```bash
# VPS-Verzeichnis-Berechtigungen prüfen
ssh root@mrx3k1.de "ls -la /var/www/html/mxster/"

# Falls nötig, Besitzer ändern
ssh root@mrx3k1.de "sudo chown -R www-data:www-data /var/www/html/mxster/audio/"
```

### Validierung schlägt fehl

**Problem:** `HTTP 404 Not Found`

**Lösung:**
- nginx `/audio/` location nicht konfiguriert (siehe nginx-Konfiguration oben)
- Dateien nicht hochgeladen (run `upload-to-vps.js`)

**Problem:** `HTTP 403 Forbidden`

**Lösung:**
```bash
# Berechtigungen auf VPS prüfen
ssh root@mrx3k1.de "ls -la /var/www/html/mxster/audio/"

# Berechtigungen korrigieren
ssh root@mrx3k1.de "chmod 644 /var/www/html/mxster/audio/*.mp3"
```

**Problem:** `Invalid content-type`

**Lösung:**
- nginx sendet falschen Content-Type
- Füge zu nginx config hinzu: `add_header Content-Type "audio/mpeg";`

---

## 📊 Statistiken

**Geschätzte Werte für 209 Songs:**

| Metrik | Wert |
|--------|------|
| Durchschnittliche Song-Länge | 3-4 Minuten |
| Durchschnittliche Dateigröße (128 kbps) | 3.5 MB |
| Gesamtgröße lokal | ~730 MB |
| Gesamtgröße VPS | ~730 MB |
| Download-Dauer | 30-60 Minuten |
| Upload-Dauer | 5-10 Minuten |
| Bandwidth pro Nutzer (Song-Start) | ~3.5 MB |
| Monatlicher Traffic (100 aktive Nutzer) | ~35 GB |

**Kostenvergleich:**

| Option | User-Limit | Audio-Qualität | Kosten |
|--------|-----------|----------------|--------|
| Spotify Premium | 25 Nutzer | Hoch (320 kbps) | $0 (API kostenlos) |
| **Self-Hosted** | **Unbegrenzt** | **Mittel (128 kbps)** | **~$5-10/Monat (VPS Traffic)** |

---

## ✨ Vorteile Self-Hosting

✅ **Unbegrenzte Nutzer** - Kein 25-User-Limit
✅ **Volle Songs** - 3-5 Minuten statt 30 Sekunden
✅ **Eigene Kontrolle** - Keine Abhängigkeit von Spotify API
✅ **Offline-fähig** - PWA kann Songs cachen
✅ **Keine Auth nötig** - Direkter Audio-Download

## ⚠️ Nachteile Self-Hosting

❌ **Rechtliche Grauzone** - yt-dlp für Musik-Downloads
❌ **Speicherplatz** - ~730 MB auf VPS
❌ **Traffic-Kosten** - Nutzer laden volle Songs
❌ **Wartungsaufwand** - Songs manuell nachpflegen
❌ **Audio-Qualität** - 128 kbps vs. 320 kbps (Spotify)

---

## 🔒 Sicherheit & Best Practices

1. **VPS-Zugriff beschränken:**
   ```bash
   # Nur root@mrx3k1.de kann hochladen
   ssh root@mrx3k1.de "chmod 755 /var/www/html/mxster/audio/"
   ```

2. **CORS richtig konfigurieren:**
   ```nginx
   add_header Access-Control-Allow-Origin "https://mxster.de";
   ```

3. **Hotlinking verhindern (optional):**
   ```nginx
   valid_referers none blocked mxster.de *.mxster.de;
   if ($invalid_referer) {
       return 403;
   }
   ```

4. **Rate Limiting (optional):**
   ```nginx
   limit_req_zone $binary_remote_addr zone=audio:10m rate=10r/s;

   location /audio/ {
       limit_req zone=audio burst=20;
       ...
   }
   ```

---

## 📞 Support

Bei Problemen:
1. Prüfe `docs/download-report.json` und `docs/validation-report.json`
2. Teste nginx config: `ssh root@mrx3k1.de "sudo nginx -t"`
3. Prüfe nginx logs: `ssh root@mrx3k1.de "tail -100 /var/log/nginx/mxster.de.error.log"`

---

**Made with ❤️ for mxster** | © 2025
