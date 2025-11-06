# 🎵 mxster - Music Timeline Game

**Das ultimative Musikquiz für Musikfans!** Rate Songs, platziere sie chronologisch und teste dein Musikwissen. Spiele mit Freunden, sammle Punkte und werde zum Musik-Champion!

[![App](https://img.shields.io/badge/App-mxster.de-blue?style=for-the-badge)](https://mxster.de)
[![Version](https://img.shields.io/badge/Version-v0.0.36-purple?style=for-the-badge)](https://github.com/pepperonas/mxster/releases)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
![Songs](https://img.shields.io/badge/Songs-209-orange?style=for-the-badge)
![Audio](https://img.shields.io/badge/Audio-Self--Hosted-red?style=for-the-badge)
[![Tests](https://github.com/pepperonas/mxster/actions/workflows/test.yml/badge.svg)](https://github.com/pepperonas/mxster/actions/workflows/test.yml)

![mxster Banner](https://mxster.de/assets/mxster.jpg)

## 🎮 Was ist mxster?

mxster ist ein **Multiplayer-Musikquiz** mit drei verschiedenen Spielmodi:

- 🔥 **Hardcore**: Rate Titel, Künstler und Erscheinungsjahr - bis zu 15 Punkte pro Song!
- 👤 **Timeline (Persönlich)**: Baue deine eigene Timeline chronologisch auf
- 🌍 **Timeline (Global)**: Alle Spieler teilen eine gemeinsame Timeline

### 🃏 Zwei Spielvarianten

- **Physische Karten**: Drucke PDF-Karten aus oder erstelle 3D-gedruckte Karten mit QR-Codes
- **Virtuelle Karten**: Spiele komplett digital ohne physische Karten

## ✨ Features

- 🎵 **Self-Hosted Audio** - 209 volle Songs (3-5 Min), unbegrenzte Nutzer, keine Authentifizierung
- 🎧 **Optional: Spotify Premium** - 320 kbps Studio-Qualität, 20/25 Slots verfügbar
- 🎯 **Tolerantes Raten** - Fuzzy Matching erkennt Tippfehler (bis zu 3 Fehler)
- 📱 **Progressive Web App** - Installierbar auf Smartphone & Desktop, offline-fähig
- 🏆 **Live Punktesystem** - Echtzeit-Updates nach jeder Runde (5+5+5/2/1 Punkte)
- 🎖️ **20 Achievements** - Volltreffer-Serie, Marathonläufer, Genre-Hopper, Großmeister
- 📊 **Spielerstatistiken** - Winrate, Dekaden-Verteilung, Genre-Analyse, Siegesserien
- 📈 **Spielhistorie** - Vollständige Aufzeichnung aller Spiele mit Export-Funktion
- 📸 **QR-Code Scanner** - Scanne Karten mit Smartphone-Kamera
- 💾 **Auto-Save** - Kein Fortschritt geht verloren, selbst bei Page Refresh
- 🔄 **Backup & Restore** - Exportiere und importiere alle Daten als JSON
- 🗑️ **Datenverwaltung** - Lösche einzelne Spieler oder alle Daten mit Bestätigung
- 🎮 **Multiplayer** - Spiele mit beliebig vielen Freunden
- ✏️ **Song-Editor** - Bearbeite Songs nachträglich mit interaktivem Wizard
- ✨ **Music-Reactive Particles** - 3D-Partikelhintergrund reagiert auf Musikwiedergabe
- 🎉 **Unlock Animations** - Konfetti beim Freischalten von Achievements
- 🎨 **Gameplay Feedback** - Konfetti bei richtigen, Gewitter bei falschen Antworten
- 🏆 **Score-Based Effects** - 5 Animationen je nach Punktzahl (Gold-Konfetti, Blitze, etc.)
- ⌨️ **Keyboard Shortcuts** - Enter/ESC zum Schließen von Dialogen
- ⌨️ **Auto-Focus** - Automatischer Fokus auf Eingabefelder (Desktop/Laptop)
- 🤖 **Bot-Spieler (NEU v0.0.32)** - Spiele gegen 1-3 KI-Gegner (Virtual Mode)
  - **3 Schwierigkeitsgrade**: Easy (😊), Medium (🎯), Hard (🔥)
  - **Realistische KI**: Tippfehler-Simulation, Denkzeit-Delays, schwierigkeitsbasierte Genauigkeit
  - **Visuelle Indikatoren**: Bot-Emoji, farbcodierte Schwierigkeits-Badges, "Bot denkt nach..." Animation
  - **Alle Modi unterstützt**: Hardcore, Timeline Personal, Timeline Global

## 🎵 Audio-Modi

### 1. Gratis-Modus (Empfohlen) ⭐

**Self-Hosted Audio System** - Die Hauptlösung für unbegrenztes Spielen:

- ✅ **Volle Songs** (3-5 Minuten, 128 kbps MP3)
- ✅ **Unbegrenzte Spieler** (keine 25-User-Limitierung)
- ✅ **Keine Authentifizierung** (kein Spotify-Login nötig)
- ✅ **Sofort verfügbar** (209 Songs auf VPS gehostet)
- ⚠️ **Rechtlicher Hinweis**: YouTube-Downloads via yt-dlp, rechtliche Grauzone, nur für private/nicht-kommerzielle/bildungsbasierte Zwecke

**Technische Details:**
- 209 Songs auf `https://mxster.de/audio/` gehostet
- Gesamtgröße: ~933 MB (Ø 4.47 MB pro Song)
- Qualität: 128 kbps MP3 (gut genug für Quiz-Spiele)
- nginx-served mit CORS und Caching
- Passwortschutz: `ydl` (einmalig, rechtlicher Schutz)

**Architektur:**
```
YouTube → yt-dlp → MP3 (128kbps) → VPS → nginx → Browser
```

### 2. Spotify Premium (Optional) 🎧

**Nur für Audiophile mit Spotify Premium Account:**

- ✅ **Höchste Audioqualität** (320 kbps)
- ✅ **100% legal** über Spotify Web Playback SDK
- ✅ **Unbegrenzte Songlänge**
- ⚠️ **Nur 20/25 Slots verfügbar** (Spotify Development Mode Limitierung)
- ⚠️ **Spotify Premium erforderlich**

**Warum nur 25 Slots? - Spotify API Hürde:**

Die App mxster nutzt Spotifys Standard-Web-API mit Playback-Scopes. Damit läuft sie automatisch im **Development Mode**, der auf **25 registrierte Nutzer** begrenzt ist.

**Spotify's Quota-Modelle:**
- **Development Mode**: Max 25 Nutzer (aktuell aktiv)
- **Extended Quota Mode**: Benötigt registrierte Firma + 250.000+ aktive Nutzer
- **Indie-Sperre**: Seit Mai 2025 keine Anträge von Einzelpersonen möglich

**Realität**: Von 25 direkt auf 250.000 ist kein "Wachstumsmodell", sondern eine Sperre. Spotify will damit verhindern, dass kleine Projekte massenhaft Musik streamen. Das schneidet genau jene kreative Nische ab, aus der viele innovative Ideen kommen.

**Slot anfragen**: Noch **20 von 25 Slots** frei. Sende eine E-Mail an **martin.pfeffer@celox.io** mit der E-Mail-Adresse deines Spotify-Kontos.

### Audioqualität im Vergleich

- **Gratis-Modus** (128 kbps): Gut genug für Quiz-Spiele, die meisten merken keinen Unterschied
- **Spotify Premium** (320 kbps): Studio-Qualität, nur für echte Audiophile wahrnehmbar besser

## 🎫 Spotify Slot Management

**Slot-Konfiguration:** `pwa/spotify.slots.json`

```json
{
  "totalSlots": 25,
  "usedSlots": 5,
  "availableSlots": 20,
  "contactEmail": "martin.pfeffer@celox.io"
}
```

### Slot-Counter aktualisieren

1. JSON-Datei bearbeiten (`usedSlots` ändern)
2. `cd pwa && npm run build`
3. `./scripts/deployment/deploy.sh`
4. Dynamisch: Anzeige aktualisiert sich automatisch auf Landing Page

### Nutzer hinzufügen (Spotify Developer Dashboard)

1. Öffne https://developer.spotify.com/dashboard
2. Wähle mxster App
3. User Management → E-Mail-Adresse eintragen
4. `spotify.slots.json` aktualisieren (usedSlots++)

## 🎵 Self-Hosted Audio System

**Architektur:**
```
YouTube → yt-dlp → MP3 (128kbps) → VPS → nginx → Browser
```

**Scripts:** `scripts/audio-hosting/` (siehe [Audio Hosting README](scripts/audio-hosting/README.md) für Details)

### 1. Download (download-songs.js)

```bash
cd scripts/audio-hosting
node download-songs.js         # Alle 209 Songs (~933 MB, ~20 Min)
node download-songs.js --limit 5   # Test mit 5 Songs
node download-songs.js --resume    # Überspringe existierende
```

**Features:**
- Concurrent: 3 parallele Downloads
- Retries: 3 Versuche pro Song
- Qualität: 128 kbps MP3
- Output: `pwa/public/audio/*.mp3`

### 2. Upload (upload-to-vps.js)

```bash
node upload-to-vps.js           # Upload via rsync
node upload-to-vps.js --dry-run # Preview Änderungen
```

**Features:**
- Incremental sync
- Permission: 644
- Target: `root@mrx3k1.de:/var/www/html/mxster/audio/`

### 3. Update URLs (update-song-urls.js)

```bash
node update-song-urls.js           # Aktualisiere songs.json + songs.ts
node update-song-urls.js --dry-run # Preview Änderungen
```

**Features:**
- Auto-backup (.backup-YYYY-MM-DD)
- URL-Format: `https://mxster.de/audio/song_XXX.mp3`
- 100% Coverage Verification

### 4. Validate (validate-audio.js)

```bash
node validate-audio.js        # Test 10 Sample-Songs
node validate-audio.js --full # Test alle 209 Songs
```

**Checks:**
- HTTP Status 200
- Content-Type: audio/mpeg
- File Size: 1-15 MB
- Report: `docs/validation-report.json`

### nginx Konfiguration

```nginx
location /audio/ {
    alias /var/www/html/mxster/audio/;
    add_header Cache-Control "public, max-age=31536000";
    add_header Access-Control-Allow-Origin "*";
    add_header Content-Type "audio/mpeg";
    add_header Accept-Ranges bytes;
}
```

### Rechtlicher Hinweis

- ⚠️ **YouTube-Downloads** via yt-dlp
- ⚠️ **Rechtliche Grauzone** - Urheberrechtlich bedenklich
- ⚠️ **Passwortschutz** als rechtlicher Schutz (Passwort: `ydl`)
- ⚠️ **Nur für private, nicht-kommerzielle, bildungsbasierte Zwecke**

Die Passwortabfrage dient dem rechtlichen Schutz des Entwicklers und signalisiert, dass die Nutzung auf eigene Verantwortung erfolgt.

## 🏆 Achievements

Schalte 20 spannende Erfolge frei und zeige dein Können!

### Standard Achievements (1-10)

- 🎯 **Volltreffer-Serie** - 3x hintereinander alle Felder (Titel, Artist, Jahr) richtig erraten
- ⭐ **Perfektionist** - Alle Songs in einem Spiel richtig einsortiert
- 🕰️ **Zeitreisender** - Songs aus 5 verschiedenen Dekaden korrekt platziert
- 🏆 **Hardcore-Champion** - 100+ Punkte in einem einzelnen Hardcore-Spiel erreicht
- 🏃 **Marathonläufer** - 50 Spiele gespielt
- 👑 **Unbesiegbar** - 5 Spiele in Folge gewonnen
- 🎸 **Dekaden-Kenner** - 10 Songs einer Dekade perfekt erraten
- ⚡ **Blitzschnell** - Ein Spiel in unter 5 Minuten abgeschlossen
- 🔥 **Comeback-King** - Vom letzten Platz zum Gewinner aufgestiegen
- 🎓 **Musikexperte** - 1000 Gesamtpunkte über alle Spiele erreicht

### Neue Achievements (11-20) - v0.0.24 (Fixed)

#### Normal Schwierigkeit
- ⏰ **Zeitmaschine** - Songs aus 3 verschiedenen Dekaden erraten
- 🌈 **Genre-Hopper** - Songs aus 4 verschiedenen Musikrichtungen erraten
- 🎤 **Name-Dropper** - 5 Künstler hintereinander richtig erraten (Streak!)
- 👥 **Gesellschaftsmensch** - Mit 5 verschiedenen Spielern gespielt
- 🏆 **Punktejäger** - 75+ Punkte in einem Hardcore-Spiel erreicht

#### Sehr Schwierig ⚠️
- 💎 **Makellos** - Ein Spiel mit 150/150 Punkten gewinnen (10 perfekte Songs!)
- 🌟 **Legendäre Serie** - 10 Spiele in Folge gewonnen
- 💯 **Zenturio** - 100 Spiele gespielt
- ⏱️ **Meister der Zeit** - Ein Spiel in unter 3 Minuten abgeschlossen
- 🔥 **Comeback-Profi** - 5x vom Rückstand zum Sieg gekommen
- 👑💎 **Großmeister** - 5000 Gesamtpunkte über alle Spiele erreicht

**Features:**
- Noch nicht freigeschaltete Achievements sind schwarz maskiert
- Freigeschaltete Achievements werden in Farbe mit Unlock-Datum angezeigt
- Fortschrittsbalken für wiederholbare Achievements
- Spieler-spezifisches Tracking (jeder Spieler hat eigene Achievements)
- Automatisches Speichern und Restore-Funktion

## 🚀 Schnellstart für Anfänger

### Option 1: Online spielen (am einfachsten!)

1. **Öffne** [mxster.de](https://mxster.de)
2. **Klicke** "Jetzt spielen (Gratis)" → Passwort: `ydl`
3. **Wähle** Spielmodus & Variante
4. **Füge** Spieler hinzu (min. 2)
5. **Los geht's!** 🎉

**Optional**: Spotify Premium nutzen → "Mit Spotify Premium" → OAuth Login (20/25 Slots verfügbar)

**Fertig!** Du brauchst nichts zu installieren.

### Option 2: Eigene Version hosten (für Entwickler)

**Voraussetzungen:**
- [Node.js](https://nodejs.org/) (Version 18 oder höher)
- [Git](https://git-scm.com/)
- [Spotify Premium Account](https://www.spotify.com/premium/)
- [Spotify Developer Account](https://developer.spotify.com/dashboard) (kostenlos)

**Installation:**

```bash
# 1. Repository klonen
git clone https://github.com/pepperonas/mxster.git
cd mxster

# 2. PWA Dependencies installieren
cd pwa
npm install

# 3. Spotify App erstellen
# Gehe zu: https://developer.spotify.com/dashboard
# Erstelle eine neue App
# Kopiere Client ID und Client Secret
```

**Konfiguration:**

Erstelle `pwa/spotify.config.js`:

```javascript
export default {
  clientId: 'DEINE_CLIENT_ID',        // Von Spotify Dashboard
  clientSecret: 'DEIN_CLIENT_SECRET',  // Von Spotify Dashboard
  redirectUri: 'http://localhost:5174/callback',
  playlistId: '',  // Optional: Spotify Playlist ID
  scopes: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ]
}
```

**Wichtig:** Füge in deiner Spotify App die Redirect URI hinzu:
- Development: `http://localhost:5174/callback`
- Production: `https://deine-domain.com/callback`

**App starten:**

```bash
# Im pwa/ Verzeichnis
npm run dev
```

Öffne http://localhost:5174 - Fertig! 🚀

## 🎯 Spielmodi erklärt

### 🔥 Hardcore Modus

**Ziel:** Sammle die meisten Punkte durch richtiges Raten! **Maximum: 150 Punkte (15 pro Song × 10 Songs)**

1. **Song abspielen:** DJ scannt QR-Code oder virtueller Modus zieht zufälligen Song
2. **Raten:** Spieler gibt Titel, Künstler und Jahr ein
3. **Fuzzy Matching:** System akzeptiert auch ähnliche Schreibweisen (z.B. "Fleetwood Mac" = "Fleetwood Mack")
4. **Punkte vergeben:**
   - ✅ Titel richtig: **+5 Punkte**
   - ✅ Künstler richtig: **+5 Punkte**
   - ✅ Jahr exakt richtig: **+5 Punkte**
   - ✅ Jahr ±1 Jahr: **+2 Punkte**
   - ✅ Jahr ±2 Jahre: **+1 Punkt**
5. **Automatische Platzierung:** Karte wird sofort chronologisch in die Timeline einsortiert
6. **Live-Rangliste:** Score-Overview zeigt alle Spieler sortiert nach Punkten
7. **Gewinner:** Spieler mit den meisten Punkten nach 10 Karten

**Besonderheiten:**
- Keine manuelle Platzierung nötig
- Timeline wird automatisch sortiert
- Skip-Funktion verfügbar (0 Punkte, Karte wird trotzdem platziert)
- **Granulares Punktesystem** ermöglicht mehr taktische Tiefe

**⚠️ Progressive Skip-Strafe:**
Ein Spieler kann einen Track überspringen, wenn er ihn nicht kennt und sich sicher ist, dass sein Gegner ihn auch nicht kennt. **ABER:** Wenn jeder Spieler den gleichen Song bereits mindestens 1x übersprungen hat, besteht ab dem 2. Skip die Möglichkeit einer **-3 Punkte Strafe**:

- ✅ **1. Skip pro Spieler:** Keine Strafe
- ⚠️ **2. Skip (wenn alle einmal übersprungen):** 33% Chance auf -3 Punkte
- ⚠️ **3. Skip:** 66% Chance auf -3 Punkte
- ⚠️ **4.+ Skip:** 95% Chance auf -3 Punkte

**Bei Strafanwendung:**
- Spieler verliert 3 Punkte (kann ins **Negative** gehen!)
- Ein neuer zufälliger Song wird automatisch gezogen
- Nächster Spieler ist dran
- Skip-Zähler wird für den neuen Song zurückgesetzt

**Warndialog:**
Sobald alle Spieler mindestens 1x übersprungen haben, erscheint vor dem Spielerwechsel ein Warndialog mit:
- Aktueller Strafe-Wahrscheinlichkeit für den nächsten Skip
- Empfehlung zum Raten statt Überspringen
- "Verstanden"-Button zum Fortfahren

Diese Mechanik verhindert, dass schwierige Songs permanent übersprungen werden und fördert aktives Raten.

### 👤 Timeline (Persönlich)

**Ziel:** Baue deine eigene Timeline mit 10 Karten auf!

1. **Individuelle Timelines:** Jeder Spieler baut seine eigene separate Timeline
2. **Song abspielen:** DJ scannt QR-Code oder virtueller Modus
3. **Optional raten:** Spieler kann zum Spaß raten (keine Punkte)
4. **Automatische Platzierung:** Karte wird chronologisch in die persönliche Timeline eingefügt
5. **Bestätigung:** Dialog zeigt an, an welcher Position die Karte eingefügt wurde
6. **Spielerwechsel:** Timeline wechselt zur Timeline des nächsten Spielers
7. **Gewinner:** Erster Spieler, der 10 Karten in seiner Timeline hat

**Besonderheiten:**
- Kein Punktesystem
- Jeder Spieler sieht nur seine eigene Timeline
- Automatische chronologische Sortierung
- Nur Kartenzählung entscheidet

### 🌍 Timeline (Global)

**Ziel:** Gemeinsam eine Timeline aufbauen - Wer erreicht zuerst 10 Karten?

1. **Geteilte Timeline:** ALLE Spieler teilen EINE gemeinsame Timeline
2. **Song abspielen:** DJ scannt QR-Code oder virtueller Modus
3. **Optional raten:** Spieler kann zum Spaß raten (keine Punkte)
4. **Automatische Platzierung:** Karte wird in die globale Timeline eingefügt
5. **Timeline bleibt gleich:** Beim Spielerwechsel sehen alle die gleiche Timeline
6. **Kooperativ:** Alle bauen gemeinsam an einer chronologischen Timeline
7. **Gewinner:** Erster Spieler, der insgesamt 10 Karten platziert hat

**Besonderheiten:**
- Kein Punktesystem
- Timeline ändert sich NICHT beim Spielerwechsel
- Alle sehen immer die gleiche globale Timeline
- Kooperatives Timeline-Building
- Nur Kartenzählung pro Spieler entscheidet

## 🎮 Detaillierte Spielregeln & Mechaniken

### DJ-Rotation System
- DJ wechselt jede Runde im Uhrzeigersinn
- DJ scannt die Karte (sichtbar im Header: 🎧 DJ: Name)
- Aktiver Spieler platziert die Karte (🎮 Spieler: Name)
- Spieler links vom DJ beginnt
- Nach jedem Spielerzug wechselt zum nächsten Spieler
- Wenn nächster Spieler = aktueller DJ → DJ wechselt auch
- Ensures: DJ spielt nie mit seiner eigenen gescannten Karte

### Spielfluss

#### Phase 1: Song scannen
- DJ scannt QR-Code mit Kamera (oder virtuelle Karte wird gezogen)
- Song beginnt zu spielen (Spotify oder Preview)
- Titel & Artist werden **nicht** angezeigt

#### Phase 2: Raten (Optional)
- Eingabefelder für Titel & Artist
- Button "✅ Prüfen" oder "⏭️ Überspringen"
- **Ratespiel-Modus**: Bei richtigem Guess werden Punkte vergeben
- **Timeline-Modi**: Raten zum Spaß (keine Punkte)
- Nach Guess/Skip: Song-Info wird enthüllt

#### Phase 3: Platzierung
- **Ratespiel**: Automatische chronologische Platzierung nach Bewertung
- **Timeline-Modi**: Automatische Platzierung mit Bestätigungsdialog
- System prüft ob Timeline noch korrekt sortiert ist
- Songs mit gleichem Jahr sind in beliebiger Reihenfolge erlaubt

#### Phase 4: Bewertung
- **Ratespiel**:
  - Dialog zeigt ✅/❌ Checkmarks für Titel, Artist, Jahr
  - Punkte werden vergeben (0-3 pro Song)
  - Score Overview wird aktualisiert
- **Timeline-Modi**:
  - Bestätigung der Platzierung
  - Kartenzähler erhöht sich

### Anzeige-Elemente

#### Spieler-Info (Header)
```
🎧 DJ: [Name]
🎮 Spieler: [Name] (🎵 X/10 Karten)
```
**Ratespiel zusätzlich:** Punktestand sichtbar

#### Timeline
- Zeigt alle korrekt platzierten Karten des aktiven Spielers
- Sortiert nach Jahr (älteste links)
- Format pro Karte:
  - Jahr (groß)
  - Song-Titel
  - Artist

#### Scoreboard (Ratespiel)
- Zeigt für alle Spieler:
  - Name
  - Punktestand
  - Karten-Anzahl (X/10)
- Live-Updates nach jeder Runde
- Medaillen für Top 3

### 🎯 Fuzzy Matching System

Das Spiel verwendet **tolerantes Fuzzy-Matching** für Song-Raten, damit Spieler nicht an Tippfehlern scheitern.

#### Features

**Groß-/Kleinschreibung ignoriert:**
```javascript
"Bohemian Rhapsody" = "bohemian rhapsody" = "BOHEMIAN RHAPSODY"
```

**Sonderzeichen ignoriert:**
```javascript
"Don't Stop" = "Dont Stop" = "Don't Stop!"
"What's Up?" = "Whats Up" = "Whats Up"
```

**Umlaute normalisiert:**
```javascript
"Für Elise" = "Fur Elise"
"Café del Mar" = "Cafe del Mar"
```

**Bindestriche → Leerzeichen:**
```javascript
"Re-mix" = "Re mix" = "Remix"
```

**Ampersand → "and":**
```javascript
"Rock & Roll" = "Rock and Roll"
```

**3 Tippfehler erlaubt (pro Feld):**

Das System verwendet die **Levenshtein-Distanz** um Tippfehler zu erkennen:

- ✅ **1 Tippfehler**: "Bohemian Rhapsody" → "Bohemain Rhapsody"
- ✅ **2 Tippfehler**: "Fine Young Cannibals" → "Fin Young Cannibls"
- ✅ **3 Tippfehler**: "She Drives Me Crazy" → "She Drivs Me Crzy"
- ❌ **4+ Tippfehler**: "She Drives Me Crazy" → "She Drvs M Crzy"

**Teilstring-Matching:**
```javascript
"Drives Me Crazy" matcht "She Drives Me Crazy"
"Fine Young" matcht "Fine Young Cannibals"
```

**Phonetische Ähnlichkeit:**
```javascript
"Freddie Mercury" = "Freddy Mercury"
"Philip" = "Phil"
"Eric" = "Erik"
```

**Abkürzungen & Slashes:**
```javascript
"AC/DC" = "ACDC" = "AC DC"
"N.W.A." = "nwa"
```

**"The" Präfix ignoriert:**
```javascript
"The Beatles" = "Beatles"
"The Rolling Stones" = "Rolling Stones"
```

**Track-Suffixe ignoriert (wichtig!):**

Spieler müssen keine Remix/Version-Informationen eingeben:

```javascript
"Like a Prayer" = "Like a Prayer - 12" Extended Remix"
"Drop the Pressure" = "Drop the Pressure - Club Mix"
"Totoish" = "Totoish - Radio Cut"
"Song Name" = "Song Name (Extended Version)"
"Song Name" = "Song Name [Club Mix]"
"Song Name" = "Song Name 2024 Remastered"
```

Erkannte Suffixe:
- `12"`, `7"` (Vinyl-Formate)
- `Extended`, `Radio`, `Club`, `Vocal`, `Instrumental`
- `Remix`, `Mix`, `Edit`, `Version`, `Cut`
- `Remaster`, `Remastered` (auch mit Jahreszahlen)
- `Live`, `Original`
- `Single Version`, `Album Version`

#### Technische Details

**Normalisierung:**
```javascript
function normalizeText(text) {
  return text
    .toLowerCase()                          // Lowercase
    .normalize('NFD')                       // Unicode decomposition
    .replace(/[\u0300-\u036f]/g, '')        // Entferne diakritische Zeichen
    .replace(/[''`]/g, '')                  // Entferne Apostrophe
    .replace(/[.,?!;:]/g, '')               // Entferne Interpunktion
    .replace(/[-_]/g, ' ')                  // Bindestriche → Leerzeichen
    .replace(/&/g, 'and')                   // & → "and"
    .replace(/\s+/g, ' ')                   // Mehrfache Leerzeichen → einzelnes
    .trim()
}
```

**Matching-Logik:**
```javascript
function fuzzyMatch(guess, correct, maxErrors = 3) {
  const normalizedGuess = normalizeText(guess)
  const normalizedCorrect = normalizeText(correct)

  // 1. Exakter Match nach Normalisierung
  if (normalizedGuess === normalizedCorrect) return true

  // 2. Substring-Match
  if (normalizedCorrect.includes(normalizedGuess) ||
      normalizedGuess.includes(normalizedCorrect)) return true

  // 3. Levenshtein-Distanz Check
  const distance = levenshteinDistance(normalizedGuess, normalizedCorrect)
  return distance <= maxErrors
}
```

**Performance:**
- Normalisierung: ~0.1ms
- Levenshtein (20 Zeichen): ~0.2ms
- Gesamt pro Guess: ~0.5ms
- Vernachlässigbar für User Experience

### Automatische Spielstand-Speicherung

Das Spiel speichert den Spielstand **automatisch**:

- ✅ **Automatisch nach jedem Zug** gespeichert
- ✅ **LocalStorage-basiert** - Persistent im Browser
- ✅ **Wiederherstellung beim Neustart** - Dialog fragt nach Fortsetzung
- ✅ **Export/Import** - JSON-Datei Download/Upload für Backups
- ✅ **Geräte-Wechsel möglich** - Exportiere auf Gerät A, importiere auf Gerät B
- ✅ **Manueller Save-Button** - Zusätzlich zur Auto-Save Funktion

**Was wird gespeichert:**
- Alle Spieler mit Namen, Timelines, Punkte, Karten
- Aktueller DJ und aktiver Spieler
- Spielmodus (Ratespiel, Timeline Personal, Timeline Global)
- Aktueller Song-State
- Kompletter Spielverlauf

## 📥 Downloads (Fertige Karten)

**Am einfachsten:** Lade fertige Karten direkt von den [GitHub Releases](https://github.com/pepperonas/mxster/releases) herunter!

### 🖨️ PDF Druckkarten
- [Standard (Farbig)](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards.pdf)
- [Schwarz-Weiß](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards-bw.pdf)
- [Duplex (Farbig)](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards-duplex.pdf)
- [Duplex (Schwarz-Weiß)](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards-bw-duplex.pdf)

### 🎲 3D-Druckmodelle
- [All-Cards (3MF)](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/all-cards.3mf) - Alle Karten in einer Datei
- [STL Modelle (ZIP)](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-stl-models.zip)
- [SCAD Modelle (ZIP)](https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-scad-models.zip)
- [Einzelne Modelle](https://github.com/pepperonas/mxster/tree/main/card-generator/output/models) - Direkt auf GitHub

---

## 🃏 Karten selbst generieren

### 📄 PDF-Karten (Empfohlen für Einsteiger)

Schnell, einfach und kein 3D-Drucker nötig!

#### Alle PDFs auf einmal generieren (empfohlen)

```bash
# Generiert alle 4 Varianten automatisch
./scripts/build/generate-all-pdfs.sh
```

Erstellt:
- `card-generator/output/pdfs/mxster-cards.pdf` - Standard (farbig, nebeneinander)
- `card-generator/output/pdfs/mxster-cards-bw.pdf` - Schwarz-Weiß (nebeneinander)
- `card-generator/output/pdfs/mxster-cards-duplex.pdf` - Duplex (farbig, getrennte Seiten)
- `card-generator/output/pdfs/mxster-cards-bw-duplex.pdf` - Duplex (Schwarz-Weiß, getrennte Seiten)

#### Einzelne Variante generieren

```bash
cd pwa

# Standard: Vorder-/Rückseite nebeneinander (Farbig)
node generate-cards.js

# Schwarz-Weiß (spart Tinte)
node generate-cards.js --bw

# Duplex: Für beidseitigen Druck
node generate-cards.js --duplex

# Duplex + Schwarz-Weiß
node generate-cards.js --duplex --bw
```

**Drucken:**
1. Drucke die PDF-Datei aus
2. Nutze mindestens **200g/m² Papier** oder Karton
3. Schneide entlang der gestrichelten Linien
4. Falten und zusammenkleben oder laminieren
5. Fertig! 🎉

### 📝 Detaillierte Karten-Spezifikation

#### Kartenformat

**Vorderseite (QR-Code):**
- **mxster** Logo oben
- **QR-Code** in der Mitte (Spotify Track URL)
- Anweisung: "Scanne den Code mit der mxster App"
- Song-ID am unteren Rand

**Rückseite (Song-Information):**
- **Jahr** groß und prominent (48pt)
- **Song-Titel** (14pt, fett)
- **Artist** (11pt)
- Dekorative Linie am unteren Rand

**Abmessungen:**
- **Kartengröße**: 2.5" x 3.5" (63mm x 88mm) - Standard Spielkartengröße
- **Papierformat**: A4 (210mm x 297mm)
- **Karten pro Seite**: 1 Karte (Vorderseite + Rückseite nebeneinander)

#### PDF-Struktur

Das generierte PDF enthält:

1. **Titelseite** mit Übersicht (Anzahl der Songs)
2. **Pro Song eine Seite** mit:
   - Vorderseite links (QR-Code)
   - Rückseite rechts (Song-Info)
   - Gestrichelte Schneidelinien
   - Kartennummer (z.B. "Karte 1 von 143")
3. **Anleitungsseite** mit Druckanweisungen

#### Druckanleitung

**Materialien:**
- **Papier**: Mindestens 200g/m² (Karton empfohlen)
- **Drucker**: Farblaserdrucker oder hochwertiger Tintenstrahldrucker
- **Optional**: Laminiergerät oder Selbstklebefolie

**Schritte:**

1. **Drucken**
   - Drucke alle Seiten auf festem Papier (200-300g/m²)
   - Empfehlung: Beidseitiger Druck für professionelles Aussehen

2. **Schneiden**
   - Schneide entlang der gestrichelten Linien
   - Verwende ein Schneidegerät für präzise Kanten
   - Schneide zwischen Vorder- und Rückseite

3. **Zusammenfügen** (Optional)
   - Klebe Vorderseite und Rückseite Rücken an Rücken zusammen
   - Oder: Laminiere jede Seite separat und klebe sie dann zusammen
   - Oder: Falte das Papier in der Mitte, wenn es dünn genug ist

4. **Laminieren** (Empfohlen)
   - Laminiere die fertigen Karten für längere Haltbarkeit
   - Schützt vor Abnutzung und Verschmutzung

#### Farbschema

Die Karten verwenden das mxster Design:

**Vorderseite:**
- Hintergrund: `#1A1C27` (Dunkelgrau)
- Border: `#4A90E2` (Blau)
- Text: `#FFFFFF` (Weiß) / `#B0B3C1` (Hellgrau)

**Rückseite:**
- Hintergrund: `#2C2E3B` (Dunkelgrau)
- Border: `#FF6B35` (Orange)
- Jahr: `#4A90E2` (Blau)
- Titel: `#FFFFFF` (Weiß)
- Artist: `#B0B3C1` (Hellgrau)

#### Technische Details

**Dependencies:**
- `pdfkit` - PDF-Generierung
- `qrcode` - QR-Code Generierung

**Song-Daten:**
Die Karten werden aus `src/data/songs.ts` generiert. Jeder Song benötigt:
- `id` - Eindeutige ID
- `title` - Song-Titel
- `artist` - Künstler
- `year` - Erscheinungsjahr
- `spotifyId` - Spotify Track-ID für QR-Code

**QR-Code Format:**
Der QR-Code enthält die Spotify Track URL im Format:
```
https://open.spotify.com/track/{spotifyId}
```

**Ausgabe:**
- **Dateiname**: `mxster-cards.pdf` (oder `*-bw.pdf`, `*-duplex.pdf`)
- **Speicherort**: `card-generator/output/pdfs/` Verzeichnis
- **Dateigröße**: ~50-100 KB pro Karte (abhängig von QR-Code Komplexität)

#### Anpassungen

**Kartengröße ändern:**
Bearbeite die Konstanten in `pwa/generate-cards.js`:

```javascript
const CARD_WIDTH = 2.5 * 72;  // Breite in inches * 72 (points)
const CARD_HEIGHT = 3.5 * 72; // Höhe in inches * 72 (points)
```

**Farben ändern:**
Passe die Farbwerte in den `drawCardFront()` und `drawCardBack()` Funktionen an.

**Mehr Songs hinzufügen:**
Füge neue Songs zu `docs/songs.json` hinzu und führe das Skript erneut aus.

#### Troubleshooting

**PDF wird nicht generiert:**
- Prüfe, ob alle Dependencies installiert sind: `npm install`
- Stelle sicher, dass Node.js installiert ist (Version 18+)
- Prüfe die Konsole auf Fehlermeldungen

**QR-Codes funktionieren nicht:**
- Stelle sicher, dass die `spotifyId` in `songs.json` korrekt ist
- Teste den QR-Code mit einem Standard-QR-Reader
- Die URL sollte im Format `https://open.spotify.com/track/{id}` sein

**Schlechte Druckqualität:**
- Verwende dickeres Papier (mindestens 200g/m²)
- Stelle den Drucker auf höchste Qualität ein
- Verwende einen Laserdrucker für beste Ergebnisse

### 🎲 3D-Karten (für Fortgeschrittene)

Hochwertige, dauerhafte Karten mit graviertem QR-Code!

**Voraussetzungen:**
- 3D-Drucker
- [OpenSCAD](https://openscad.org/) (optional, für STL-Export)

```bash
# Song hinzufügen (3D-Modelle werden automatisch erstellt)
node scripts/song-management/add-song.js "https://open.spotify.com/track/TRACK_ID"
```

**Druckeinstellungen:**
- Material: PLA oder PETG
- Layer Height: 0.1-0.15mm (wichtig für QR-Details!)
- Infill: 100%
- Support: Nicht nötig

## 🎵 Songs verwalten

### Einzelnen Song hinzufügen (einfachste Methode)

```bash
# Im Hauptverzeichnis
node scripts/song-management/add-song.js "https://open.spotify.com/track/DEINE_TRACK_ID"
```

**Was passiert automatisch:**
1. ✅ Metadaten von Spotify geladen
2. ✅ Song-ID generiert
3. ✅ Datenbank aktualisiert
4. ✅ QR-Code erstellt
5. ✅ PWA-Daten synchronisiert

### Song bearbeiten (interaktiver Wizard)

Du hast einen Tippfehler oder möchtest Metadaten korrigieren? Nutze den Song-Editor:

```bash
# Im Hauptverzeichnis
node scripts/song-management/edit-song.js
```

**Der Wizard führt dich durch:**
1. 🔍 Song-ID eingeben (z.B. `song_001` oder einfach `001` / `128`)
2. 📋 Aktuelle Daten werden angezeigt
3. ✏️ Neue Daten eingeben (leer lassen = Wert behalten)
4. 👀 Vorher/Nachher-Vergleich ansehen
5. ✅ Änderungen bestätigen

**Flexibles ID-Format:**
- ✅ `song_128` (vollständiges Format)
- ✅ `128` (Kurzformat - wird automatisch zu `song_128`)
- ✅ `095` (mit führender Null - wird zu `song_095`)
- ✅ `95` (ohne führende Null - wird zu `song_095`)

**Was passiert automatisch:**
- ✅ Automatisches Backup erstellt (`songs.json.backup-2025-10-24`)
- ✅ Datenbank aktualisiert (`docs/songs.json`)
- ✅ PWA-Daten synchronisiert (`pwa/src/data/songs.ts`)
- ✅ Alte Dateien gelöscht (falls Titel/Artist geändert)
- ✅ Neue QR-Codes generiert
- ✅ Optional: 3D-Modelle neu erstellen (SCAD + STL)

**Beispiel-Ablauf:**

```bash
$ node edit-song.js

╔══════════════════════════════════════════╗
║     🎵  mxster Song Editor Wizard  🎵    ║
╚══════════════════════════════════════════╝

📚 35 Songs in der Datenbank gefunden

Schritt 1/4: Song auswählen
─────────────────────────────
Song-ID (z.B. song_001): song_008

✅ Song gefunden:
   Titel:    Tell It to My Heart
   Interpret: Taylor Dayne
   Jahr:     1988
   Spotify:  4u7EnebtmKWzUH433cf5Qv

Schritt 2/4: Neue Daten eingeben
─────────────────────────────────
(Leer lassen = Wert behalten)

Titel [Tell It to My Heart]: Tell It To My Heart
Interpret [Taylor Dayne]:
Jahr [1988]: 1987

Schritt 3/4: Änderungen bestätigen
───────────────────────────────────

Vorher:
  Taylor Dayne - Tell It to My Heart (1988)

Nachher:
  Taylor Dayne - Tell It To My Heart (1987)

Änderungen übernehmen? (j/n): j

Schritt 4/4: Dateien aktualisieren
───────────────────────────────────
✅ Backup erstellt: docs/songs.json.backup-2025-10-24
🗑️  2 alte Dateien gelöscht
✅ songs.json aktualisiert
✅ pwa/src/data/songs.ts aktualisiert
🔄 Generiere QR-Code...
✅ QR-Code generiert

3D-Modelle neu generieren? (j/n): n

╔══════════════════════════════════════════╗
║               ✅  Fertig!  ✅            ║
╚══════════════════════════════════════════╝

Aktualisierte Dateien:
  • docs/songs.json
  • pwa/src/data/songs.ts
  • card-generator/output/qr-codes/song_008_*.png
```

### Song austauschen (komplett ersetzen)

Du möchtest einen Song komplett durch einen anderen ersetzen? Nutze den Song-Exchange-Wizard:

```bash
# Im Hauptverzeichnis
node scripts/song-management/exchange-song.js
```

**Der Wizard führt dich durch:**
1. 🔍 Song-ID zum Ersetzen eingeben (z.B. `song_031`)
2. 📋 Aktueller Song wird angezeigt
3. 🎵 Neue Spotify URL/Track-ID eingeben
4. 📥 Metadaten von Spotify werden automatisch geladen
5. 👀 Vorher/Nachher-Vergleich ansehen
6. ✅ Austausch bestätigen

**Was passiert automatisch:**
- ✅ Automatisches Backup erstellt
- ✅ Song-ID bleibt **unverändert** (nur Metadaten werden ersetzt)
- ✅ Alte Dateien gelöscht (QR, SCAD, STL)
- ✅ Datenbank aktualisiert (`docs/songs.json`)
- ✅ PWA-Daten synchronisiert (`pwa/src/data/songs.ts`)
- ✅ Neue Metadaten von Spotify geladen (Titel, Artist, Jahr, Album)
- ✅ Neue QR-Codes generiert (beide Verzeichnisse)
- ✅ Neue 3D-Modelle generiert (SCAD + STL)
- 🔧 Optional: Alle PDFs neu generieren

**Beispiel-Ablauf:**

```bash
$ node exchange-song.js

╔════════════════════════════════════════╗
║  🔄  mxster Song Exchange Wizard  🔄   ║
╚════════════════════════════════════════╝

📚 83 Songs in der Datenbank gefunden

Schritt 1/5: Song auswählen zum Ersetzen
──────────────────────────────────────────
Song-ID zum Ersetzen (z.B. song_001): song_031

✅ Song gefunden (wird ersetzt):
   Titel:    Only You
   Interpret: Steve Monite
   Jahr:     1984
   Spotify:  3d7lH2ppf2aIELQXY4nagn

Schritt 2/5: Neuen Spotify Track eingeben
─────────────────────────────────────────
Spotify URL oder Track-ID: https://open.spotify.com/track/NEW_TRACK_ID

Schritt 3/5: Metadaten von Spotify laden
─────────────────────────────────────────
🔍 Lade Track-Informationen von Spotify...

✅ Neuer Track gefunden:
   Titel:    Neuer Song
   Interpret: Neuer Artist
   Jahr:     2020
   Album:    Neues Album

Schritt 4/5: Austausch bestätigen
─────────────────────────────────────────

🔴 ALT (wird gelöscht):
  Steve Monite - Only You (1984)

🟢 NEU (wird eingefügt):
  Neuer Artist - Neuer Song (2020)

💡 Song-ID bleibt: song_031

Song austauschen? (j/n): j

Schritt 5/5: Dateien aktualisieren
─────────────────────────────────────────
🗑️  6 alte Dateien gelöscht
✅ Backup erstellt: docs/songs.json.backup-2025-10-24
✅ songs.json aktualisiert
✅ pwa/src/data/songs.ts aktualisiert
🔄 Generiere Karten-Dateien (QR-Code + 3D-Modelle)...
✅ QR-Code generiert
✅ 3D-Modelle generiert (SCAD + STL)

PDF-Karten neu generieren (alle Songs)? (j/n): n

╔════════════════════════════════════════╗
║             ✅  Fertig!  ✅            ║
╚════════════════════════════════════════╝

Aktualisierte Dateien:
  • docs/songs.json
  • pwa/src/data/songs.ts
  • card-generator/output/qr-codes/song_031_*.png
  • card-generator/output/models/song_031_*.scad
  • card-generator/output/models/song_031_*.stl

📊 Song-Details:
   Alt: Steve Monite - Only You (1984)
   Neu: Neuer Artist - Neuer Song (2020)
   ID:  song_031 (unverändert)
```

### Aus Spotify Playlist importieren

```bash
cd pwa
npm run import-spotify
```

Vorher `pwa/spotify.config.js` anpassen (siehe Konfiguration oben).

## 📱 Als App installieren (PWA)

mxster ist als Progressive Web App (PWA) installierbar und funktioniert wie eine native App!

### iOS (iPhone/iPad)

⚠️ **Wichtig**: Auf iOS funktioniert die Installation **nur in Safari** (nicht Chrome oder Firefox)

1. **Öffne** https://mxster.de in Safari
2. **Tippe** auf den Teilen-Button (📤) unten in der Mitte
3. **Scrolle** nach unten und wähle "Zum Home-Bildschirm"
4. **Bearbeite** den Namen falls gewünscht (Standard: "mxster")
5. **Tippe** auf "Hinzufügen" oben rechts
6. **Fertig!** Die App erscheint auf deinem Home Screen

**Nach Installation:**
- App öffnet sich im Vollbild (ohne Browser-UI)
- Sieht aus wie eine native App
- Eigenes Icon auf dem Home Screen

### Android (Chrome/Edge)

1. **Öffne** https://mxster.de in Chrome oder Edge
2. **Warte** bis die Seite vollständig geladen ist
3. **Tippe** auf das Menü (⋮) oben rechts
4. **Wähle** "App installieren" oder "Zum Startbildschirm hinzufügen"
5. **Bestätige** die Installation
6. **Fertig!** Die App erscheint auf deinem Home Screen

**Alternative Methode:**
- Einige Browser zeigen automatisch ein Banner "App installieren" am unteren Bildschirmrand
- Tippe einfach auf "Installieren"

### Desktop (Chrome/Edge)

1. **Öffne** https://mxster.de in Chrome oder Edge
2. **Klicke** auf das ⊕ Symbol in der Adressleiste (rechts)
   - Oder: Menü (⋮) → "mxster installieren..."
3. **Klicke** auf "Installieren"
4. **Fertig!** Die App öffnet sich in einem eigenen Fenster

**Shortcut:**
- Windows: App erscheint im Startmenü
- Mac: App erscheint im Applications-Ordner
- Linux: App erscheint in den Anwendungen

### PWA Features

Nach erfolgreicher Installation:

**Offline-Funktionalität:**
- ✅ App-Grundgerüst funktioniert offline
- ✅ Cached Songs spielbar (wenn vorher geladen)
- ❌ Spotify Streaming benötigt Internet

**Home Screen Icon:**
- Eigenes mxster Icon
- Kein Browser-Tab mehr nötig
- Schnellzugriff vom Home Screen

**Standalone Mode:**
- Kein Browser-UI (keine Adressleiste)
- Mehr Bildschirmplatz
- Native App Feeling

**Auto-Updates:**
- PWA aktualisiert sich automatisch
- Service Worker lädt neue Versionen im Hintergrund
- Beim nächsten App-Start: Neue Version

### Troubleshooting

**"Installieren"-Button wird nicht angezeigt:**

1. **HTTPS erforderlich**
   - ✅ mxster.de nutzt HTTPS - sollte funktionieren
   - Auf localhost funktioniert es auch (für Development)

2. **Service Worker nicht registriert**
   - Öffne DevTools (F12)
   - Gehe zu "Application" → "Service Workers"
   - Sollte "mxster Service Worker" zeigen

3. **Browser-Cache**
   - **Hard Refresh**: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
   - Oder: DevTools → "Application" → "Clear storage" → "Clear site data"

4. **App bereits installiert**
   - Wenn die App bereits installiert ist, wird der Button nicht angezeigt
   - Prüfe deinen Home Screen / Anwendungen

**Installation auf iOS funktioniert nicht:**

Checkliste:
- [ ] Safari Browser verwenden (nicht Chrome/Firefox)
- [ ] iOS 11.3 oder neuer
- [ ] Seite vollständig geladen
- [ ] Teilen-Button (📤) funktioniert
- [ ] "Zum Home-Bildschirm" ist verfügbar

**App öffnet sich nicht im Vollbild:**

- **iOS**: Stelle sicher, dass du die App vom Home Screen öffnest (nicht über Safari → Lesezeichen)
- **Android**: App sollte automatisch im Vollbild öffnen. Falls nicht: Deinstallieren und neu installieren
- **Desktop**: App sollte sich in eigenem Fenster öffnen. Falls nicht: Neu installieren

## 🔧 Spotify Developer Setup

### Redirect URI Konfiguration

Um die App lokal oder in Production zu nutzen, musst du die Redirect URIs im Spotify Developer Dashboard eintragen.

**Problem:** `INVALID_CLIENT: Invalid redirect URI` Error beim Login

**Lösung:** Die App verwendet zur Laufzeit automatisch die korrekte Redirect URI:
- **Production**: `https://mxster.de/callback`
- **Development**: `http://localhost:5174/callback`

### Schritt-für-Schritt Anleitung

#### 1. Spotify Developer Dashboard öffnen
Gehe zu: **https://developer.spotify.com/dashboard**

#### 2. Einloggen
Verwende deinen Spotify Account

#### 3. App auswählen
Finde und klicke auf deine App in der Dashboard-Übersicht (oder erstelle eine neue App)

#### 4. Settings öffnen
Klicke auf den **"Settings"** Button (oben rechts)

#### 5. Redirect URIs bearbeiten
Scrolle runter bis zu **"Redirect URIs"**

#### 6. Folgende URIs hinzufügen

**WICHTIG**: Trage **EXAKT** diese URIs ein (ohne Leerzeichen oder Trailing Slash):

```
https://mxster.de/callback
```

```
http://localhost:5174/callback
```

**Achtung**:
- ❌ FALSCH: `https://mxster.de/callback/` (mit Trailing Slash)
- ❌ FALSCH: `https://www.mxster.de/callback` (mit www)
- ✅ RICHTIG: `https://mxster.de/callback`

#### 7. Speichern
Klicke auf **"Add"** für jede URI, dann **"Save"** unten rechts

#### 8. Warten
Warte ca. 1-2 Minuten, bis die Änderungen propagiert sind

#### 9. Testen
1. Öffne https://mxster.de
2. Klicke auf "Mit Spotify anmelden"
3. Der Login sollte jetzt funktionieren!

### Häufige Fehler

**"redirect_uri mismatch":**
- Die URI im Dashboard stimmt nicht mit der App überein
- Prüfe auf Tippfehler, Leerzeichen, Trailing Slashes

**"INVALID_CLIENT":**
- Client ID oder Secret falsch
- Redirect URI nicht im Dashboard eingetragen

**App redirected zu falscher URL:**
- Hard Refresh im Browser (Ctrl+F5)
- Service Worker Cache leeren (DevTools → Application → Clear Storage)

### Debug-Hilfe

**Was sendet die App?**
Die App sendet diese Redirect URI an Spotify:
```javascript
// Production (mxster.de)
https://mxster.de/callback

// Development (localhost)
http://localhost:5174/callback
```

**Wie überprüfen?**
1. Öffne https://mxster.de
2. Öffne Browser DevTools (F12)
3. Gehe zu Network Tab
4. Klicke "Mit Spotify anmelden"
5. Schau dir die Request-URL an, die zu `accounts.spotify.com/authorize` geht
6. In der URL findest du: `&redirect_uri=https%3A%2F%2Fmxster.de%2Fcallback`
   - `%3A%2F%2F` = `://`
   - `%2F` = `/`
   - Dekodiert: `https://mxster.de/callback`

### Diese URL muss EXAKT im Spotify Dashboard stehen!

**Erforderliche Scopes:**
- `streaming` (Web Playback SDK)
- `user-read-email` (User Info)
- `user-read-private` (User Info)
- `user-modify-playback-state` (Playback Control)
- `user-read-playback-state` (Playback State)

## 🛠️ Für Entwickler

### Projekt-Struktur

```
mxster/
├── docs/                              # Source of Truth
│   ├── songs.json                     # Primary song database
│   ├── song_template.json
│   ├── songs_removed.json
│   └── *.png                          # QR code PNGs (in Git for docs)
├── card-generator/                    # Card generation tools
│   ├── *.js                          # Generation scripts
│   ├── template.scad
│   └── output/                       # All generated files
│       ├── qr-codes/                 # Generated QR codes
│       ├── models/                   # SCAD, STL, 3MF files
│       └── pdfs/                     # Generated PDF cards
├── build/                             # Release artifacts
│   └── archives/                     # ZIP archives for releases
│       ├── mxster-scad-models.zip
│       ├── mxster-stl-models.zip
│       └── mxster-source.zip
├── pwa/                               # Progressive Web App (React + Vite)
│   ├── src/
│   │   ├── main.tsx                  # App entry point
│   │   ├── components/               # React components
│   │   ├── utils/                    # Spotify Auth, Game State, etc.
│   │   ├── data/songs.ts             # Generated song data
│   │   └── styles/                   # Tailwind CSS
│   ├── public/
│   └── package.json
└── scripts/                           # Organized utility scripts
    ├── song-management/
    │   ├── add-song.js               # CLI: Add new song
    │   ├── edit-song.js              # CLI: Edit existing song
    │   ├── exchange-song.js          # CLI: Replace song
    │   └── update-song-count.js      # CLI: Update README
    ├── build/
    │   ├── generate-all-pdfs.sh      # Generate all PDF variants
    │   └── update-and-release.sh     # Build and release workflow
    ├── deployment/
    │   └── deploy.sh                 # Deploy PWA to production
    └── setup/
        └── install_dependencies.sh    # Install dependencies
```

### Wichtige Skripte

```bash
# Development
cd pwa
npm run dev              # Dev-Server starten (localhost:5174)

# Production
npm run build           # Production Build
npm run preview         # Build testen

# Songs verwalten
node scripts/song-management/add-song.js "SPOTIFY_URL"     # Song hinzufügen
node scripts/song-management/edit-song.js                  # Song bearbeiten (Metadaten)
node scripts/song-management/exchange-song.js              # Song austauschen (komplett)
npm run import-spotify                                      # Aus Playlist
npm run update-previews                                     # Preview URLs updaten
npm run filter-songs                                        # Ungültige Songs entfernen

# Karten generieren
./scripts/build/generate-all-pdfs.sh     # Alle 4 PDF-Varianten
node pwa/generate-cards.js                # PDF Standard
node pwa/generate-cards.js --bw          # PDF Schwarz-Weiß
node pwa/generate-cards.js --duplex      # PDF Duplex

# Release erstellen (automatisch via GitHub Actions)
git tag v1.0.0                       # Tag erstellen
git push origin v1.0.0               # Push löst CI/CD aus
# GitHub Actions generiert automatisch:
# - PDFs, STL-ZIP, SCAD-ZIP
# - GitHub Release mit all-cards.3mf
```

### 🧪 Testing

Das Projekt enthält einen umfassenden Integritätstest, der die Qualität und Konsistenz aller Songs, generierten Dateien und Konfigurationen überprüft.

#### Test ausführen

```bash
# Im Hauptverzeichnis
npm test

# Mit ausführlicher Ausgabe
npm run test:verbose
```

#### Was wird getestet?

**Basis-Tests (1-10)** - Laufen immer:
1. ✅ **Song-Datenbank-Integrität** - Struktur, Pflichtfelder, Duplikate
2. ✅ **PWA-Sync** - `pwa/src/data/songs.ts` ↔ `docs/songs.json`
3. ✅ **Song-IDs** - Fortlaufende Nummerierung, keine Lücken
4. ✅ **Spotify IDs** - Format-Validierung (22 Zeichen, alphanumerisch)
5. ✅ **Preview URLs** - Gültige Spotify-URLs
6. ⚠️ **QR-Codes** - Prüft Existenz (gitignored, Warning bei Fehlen)
7. ⚠️ **3D-Modelle** - Prüft SCAD/STL (gitignored, Warning bei Fehlen)
8. ✅ **Jahreszahlen** - Plausibilität (1950-2030)
9. ✅ **PDF-Karten** - Prüft Existenz (4 Varianten)
10. ⚠️ **Docs-Sync** - QR-Code-Kopien in `docs/` (gitignored)

**Erweiterte Tests (11-15)** - Nur mit Abhängigkeiten:
11. 🔍 **QR-Code Decodierung** - Verifiziert Scanbarkeit (5 Sample-Songs)
12. 🌐 **Spotify API** - Validiert Track-IDs live (5 Sample-Songs)
13. 📐 **Bild-Dimensionen** - Prüft QR-Code-Größe (5 Sample-Songs)
14. 🎲 **OpenSCAD Syntax** - Validiert 3D-Modelle (5 Sample-Songs)
15. 📄 **PDF-Generierung** - Verifiziert PDF-Integrität (alle 4 Varianten)

#### Erweiterte Tests installieren

Die Tests 11-15 benötigen optionale Abhängigkeiten:

```bash
# Im Hauptverzeichnis
npm install --save-dev jsqr pngjs sharp

# Für Test 14 (OpenSCAD):
# macOS: brew install openscad
# Ubuntu: sudo apt install openscad
# Windows: https://openscad.org/downloads.html
```

**Ohne Installation**: Tests werden übersprungen mit hilfreichen Hinweisen

#### Test-Design

- ⚡ **Schnell**: Sample-basiert (5 statt 179 Songs)
- 🔧 **Flexibel**: Erweiterte Tests sind optional
- 🤖 **CI/CD-freundlich**: Keine Fehler bei fehlenden Dependencies
- 📊 **Informativ**: Klare Warnungen vs. Fehler

#### Ergebnisse interpretieren

**✅ Success** - Test bestanden, alles in Ordnung
**⚠️ Warning** - Nicht kritisch (z.B. gitignored Dateien fehlen in CI/CD)
**❌ Error** - Kritisches Problem, muss behoben werden

#### Testing Achievements & Animationen

**Location**: `/scripts/testing/` - Browser-Console-Skripte zum Testen der Achievement-Animationen

**Empfohlenes Test-Skript** (`test-animations-simple.js`):
```javascript
// In Browser DevTools Console kopieren
const unlockAchievement = (playerName, achievementId) => {
  const event = new CustomEvent('test-achievement-unlock', {
    detail: { playerName, achievementId }
  })
  window.dispatchEvent(event)
  console.log(`🎯 Triggered: ${achievementId} for ${playerName}`)
}

// Teste einzelne Achievement-Freischaltung
unlockAchievement('TestPlayer', 'hardcore_champion')

// Teste mehrere Achievements nacheinander (mit 5s Verzögerung)
setTimeout(() => {
  unlockAchievement('TestPlayer', 'time_traveler')
  unlockAchievement('TestPlayer', 'perfectionist')
  unlockAchievement('TestPlayer', 'lightning_fast')
  unlockAchievement('TestPlayer', 'comeback_king')
}, 5000)
```

**Weitere Test-Skripte**:
- `test-animations-simple.js` - **Empfohlen**: Custom Event Methode (einfachste Variante)
- `test-achievement-animations.js` - Initialer Test-Ansatz
- `test-achievement-animations-simple.js` - Game History Setup
- `TESTING-INSTRUCTIONS.md` - Vollständige Anleitung

**Wie testen?**:
1. Öffne https://mxster.de oder `npm run dev` (localhost:5174)
2. Drücke F12 (DevTools öffnen)
3. Gehe zu "Console" Tab
4. Kopiere Code aus `scripts/testing/test-animations-simple.js`
5. Füge Code ein und drücke Enter
6. Beobachte die Achievement-Unlock-Animationen (3s pro Animation + 1s Pause)

**Features der Animationen**:
- 🎉 Konfetti-Effekt mit canvas-confetti
- ⏱️ 3 Sekunden Animation pro Achievement
- 📋 Queue-System für mehrere Achievements
- 🔁 Sequentielle Abarbeitung mit 1s Pause zwischen Animationen
- 🎨 Farbiger Achievement-Badge mit Icon und Beschreibung
- 🎵 Sound-Effekte (optional, falls implementiert)

### GitHub Release erstellen

Releases werden **manuell** mit GitHub CLI erstellt:

```bash
# 1. Assets lokal generieren
./scripts/build/generate-all-pdfs.sh

cd card-generator/output/models
zip -r ../../../build/archives/mxster-stl-models.zip *.stl
zip -r ../../../build/archives/mxster-scad-models.zip *.scad
cd ../../..

# 2. all-cards.3mf in PrusaSlicer erstellen (manuell)
# 3. all-cards.3mf zu Git hinzufügen
git add card-generator/output/models/all-cards.3mf
git commit -m "Update all-cards.3mf"
git push

# 4. Einmalig: GitHub CLI authentifizieren
gh auth login

# 5. Release erstellen mit allen Assets
gh release create v0.0.X-beta \
  --title "Release v0.0.X-beta" \
  --prerelease \
  card-generator/output/pdfs/mxster-cards*.pdf \
  build/archives/mxster-*.zip \
  card-generator/output/models/all-cards.3mf

# 6. WICHTIG: Download-Links aktualisieren!
# Ersetze in folgenden Dateien "v0.0.X-beta" mit der neuen Version:
# - README.md (Zeilen 169-177)
# - pwa/src/components/LandingPage.js (Zeilen 259-307)
```

**⚠️ WICHTIG nach jedem Release:**
Nach dem Erstellen eines neuen Release **MÜSSEN** die Download-Links aktualisiert werden:

1. **README.md**: Alle URLs von `/download/v0.0.X-beta/` auf neue Version ändern
2. **pwa/src/components/LandingPage.js**: Alle URLs von `/download/v0.0.X-beta/` auf neue Version ändern
3. Build & Deploy: `cd pwa && npm run build && cd .. && ./deploy.sh`
4. Commit & Push: `git add -A && git commit -m "Update download links to vX.X.X-beta" && git push`

**Warum `/latest/` nicht funktioniert:**
- Releases mit `--prerelease` Flag werden NICHT als "latest" erkannt
- Nur full releases (ohne --prerelease) haben `/latest/` Support
- Daher: Immer spezifisches Tag verwenden (`/download/v0.0.X-beta/`)

**Was wird hochgeladen:**
- ✅ mxster-cards.pdf (Standard, farbig) - aus `card-generator/output/pdfs/`
- ✅ mxster-cards-bw.pdf (Schwarz-Weiß) - aus `card-generator/output/pdfs/`
- ✅ mxster-cards-duplex.pdf (Duplex, farbig) - aus `card-generator/output/pdfs/`
- ✅ mxster-cards-bw-duplex.pdf (Duplex, Schwarz-Weiß) - aus `card-generator/output/pdfs/`
- ✅ mxster-stl-models.zip (alle STL Dateien) - aus `build/archives/`
- ✅ mxster-scad-models.zip (alle SCAD Dateien) - aus `build/archives/`
- ✅ all-cards.3mf (alle Karten für 3D-Drucker) - aus `card-generator/output/models/`

### CLI Tools

#### add-song.js
Fügt neue Songs zur Datenbank hinzu. Lädt Metadaten automatisch von Spotify.

**Modi:**

**Automatischer Modus** (Standard):
```bash
node scripts/song-management/add-song.js "https://open.spotify.com/track/TRACK_ID"
node scripts/song-management/add-song.js "TRACK_ID"  # Alternativ: Nur die ID
```
Verwendet Spotify-Metadaten ohne Nachfrage (Titel, Artist, Jahr).

**Interaktiver Modus** (mit `--edit`):
```bash
node scripts/song-management/add-song.js --edit "https://open.spotify.com/track/TRACK_ID"
```
Zeigt Spotify-Metadaten als Vorauswahl, erlaubt manuelle Anpassungen vor dem Speichern.

**Features:**
- 🎵 Automatischer Download von Spotify-Metadaten
- ✏️ Optionale manuelle Bearbeitung mit `--edit`
- 🔄 Generiert automatisch QR-Codes, SCAD und STL-Dateien
- 📝 Aktualisiert `songs.json` und `songs.ts`

#### edit-song.js
Interaktiver Wizard zum Bearbeiten bestehender Songs. Ideal für Korrekturen und Updates.

**Features:**
- 🎨 Farbiger Terminal-Output mit Emojis
- 🔍 Zeigt aktuelle Song-Daten an
- ✏️ Inkrementelle Eingabe (nur ändern was nötig ist)
- 👀 Vorher/Nachher-Vergleich
- 💾 Automatisches Backup vor jeder Änderung
- 🗑️ Löscht alte Dateien bei Namensänderung
- 🔄 Regeneriert QR-Codes automatisch
- 🎲 Optionale 3D-Modell-Regenerierung

**Verwendung:**
```bash
node scripts/song-management/edit-song.js
# Folge den Anweisungen im Wizard
```

**Technische Details:**
- Nutzt Node.js `readline` für interaktive Prompts
- Erstellt Backups mit Zeitstempel: `songs.json.backup-YYYY-MM-DD`
- Führt `generateCard.js` automatisch aus für neue QR-Codes
- Synchronisiert beide Datenbanken: `docs/songs.json` und `pwa/src/data/songs.ts`
- Säubert alte Dateien aus `docs/`, `qr-codes/` und `models/` Verzeichnissen

### Tech Stack

- **Frontend**: Vite 5.0, React 19, TypeScript, Tailwind CSS
- **Audio**: Spotify Web Playback SDK + Howler.js (Fallback)
- **PWA**: vite-plugin-pwa, Service Worker, Offline-Support
- **QR**: qr-scanner (Browser-basiert)
- **PDF**: PDFKit
- **3D**: OpenSCAD (optional für Karten), Three.js (für Hintergrund-Animationen)

## 🤝 Mitmachen

Du hast Ideen, Verbesserungen oder Bugs gefunden?

1. **Issue erstellen**: [GitHub Issues](https://github.com/pepperonas/mxster/issues)
2. **Pull Request**: Fork → Branch → Commit → PR
3. **Diskussion**: [GitHub Discussions](https://github.com/pepperonas/mxster/discussions)

## 💝 Unterstützen

mxster ist **komplett kostenlos und werbefrei**. Wenn dir das Projekt gefällt:

- ⭐ **Star auf GitHub** - Zeige deine Unterstützung!
- 💬 **Teile mxster** - Erzähle deinen Freunden davon
- ☕ **Spende** - Unterstütze die Weiterentwicklung via [PayPal](https://www.paypal.com/donate?business=martin.pfeffer@celox.io&item_name=Unterst%C3%BCtzung+f%C3%BCr+mxster)

Jeder Beitrag hilft, mxster noch besser zu machen! ❤️

## 📝 Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** veröffentlicht. Siehe [LICENSE](LICENSE) für Details.

## 🙏 Credits

- **Entwickelt von** [Martin Pfeffer](https://github.com/pepperonas)
- **QR-Scanner**: [nimiq/qr-scanner](https://github.com/nimiq/qr-scanner)
- **Audio**: Howler.js & Spotify Web Playback SDK
- **PDF**: PDFKit
- **3D**: OpenSCAD

## ⚠️ Wichtige Hinweise

- **Spotify Premium erforderlich**: Web Playback SDK funktioniert nur mit Premium
- **HTTPS erforderlich**: Kamera-Zugriff benötigt HTTPS (außer localhost)
- **Browser-Kompatibilität**: Chrome, Firefox, Edge, Safari (neueste Versionen)

## 📝 Changelog

### v0.0.36 (2025-11-06)

**🔄 CI/CD Verification & Test Suite Update**

**Purpose:**
- Verification release to validate all TypeScript fixes from v0.0.35
- Confirms production deployment matches CI/CD build expectations
- Validates test infrastructure improvements

**Status:**
- ✅ All critical TypeScript errors resolved (GameContext null types, test mocks)
- ✅ Production build deploys successfully to mxster.de
- ✅ Test suite passes with 41/41 tests
- ℹ️ Remaining non-critical warnings in CI output (unused variables, test utility types)

**Files Modified:**
- `pwa/package.json` - Version bump to 0.0.36
- `README.md` - Changelog update
- `CLAUDE.md` - Documentation update

### v0.0.35 (2025-11-06)

**🔧 Critical TypeScript Fixes for CI/CD**

**GameContext Null Value Support:**
- Fixed `GameAction` types to accept `GameMode | null` and `GameVariant | null`
- Ensures proper state reset when navigating between screens
- Resolves "Type 'null' is not assignable to type 'GameMode'" errors

**Test Infrastructure:**
- Fixed TypeScript error in `test/setup.ts` for spotify config mock import
- Added `as any` type assertion to handle dynamic mock imports
- Resolves "implicitly has an 'any' type" error in CI/CD pipeline

**Files Modified:**
- `pwa/src/contexts/GameContext.tsx` - GameAction type updates
- `pwa/src/test/setup.ts` - Mock import type assertion
- `pwa/package.json` - Version bump to 0.0.35

**Impact:**
- ✅ Fixes critical TypeScript errors preventing CI/CD builds
- ✅ Maintains type safety while allowing null state resets
- ✅ Improves test reliability across environments

### v0.0.34 (2025-11-06)

**🚀 Production Deployment & CI/CD Verification**

**Deployment:**
- Successfully deployed v0.0.33 fixes to production (mxster.de)
- Verified all TypeScript errors resolved in production build
- Confirmed test infrastructure improvements working in live environment

**Status:**
- ✅ Live on https://mxster.de
- ✅ Build: 5.55s (optimized)
- ✅ Bundle: 1.05 MB (gzipped: 284 KB)
- ✅ Audio: 209 songs preserved during deployment
- ✅ CI/CD: Awaiting pipeline verification on latest commit

### v0.0.33 (2025-11-06)

**🔧 TypeScript Type Safety & Test Infrastructure**

**Critical Bug Fixes:**
- Fixed Vitest dynamic import resolution for `spotify.config.js` during test execution
  - Added path alias in `vitest.config.ts` to map `../../spotify.config.js` → `spotify.config.mock.js`
  - Resolved "Failed to resolve import" error in CI/CD pipeline
- Fixed multiple TypeScript errors in `GameScreen.tsx`:
  - Type mismatch: `Player | null` vs `typeof players[0]` in `showWinnerModal()`
  - Missing imports: Added `Player` type from `@/types`
  - Missing context methods: Added `setGameMode` and `setGameVariant` to `useGame()` destructuring
  - Nullish coalescing: Fixed `string | undefined` vs `string | null` for `lastBotSongRef`
  - Removed unused beat sync state and handler to eliminate `SpotifyPlayerState` vs `PlayerState` conflict

**Type System Improvements:**
- Updated `GameContext.tsx` interface to accept `GameMode | null` and `GameVariant | null` in setter functions
- Ensures game state can be properly reset when navigating away from game screen

**Test Results:**
- ✅ All 41/41 audio player integration tests passing
- ✅ Zero TypeScript errors in `GameScreen.tsx`
- ✅ CI/CD pipeline stable

**Files Modified:**
- `pwa/vitest.config.ts` - Added spotify config path alias
- `pwa/src/screens/GameScreen.tsx` - Type fixes, removed unused code
- `pwa/src/contexts/GameContext.tsx` - Updated setter signatures

### v0.0.30 (2025-11-06)

**📊 Genre Statistics & Landing Page UX Overhaul**

**🎨 Landing Page - Spotify API Transparenz & Slot Management:**
- **Spotify API Hürden-Erklärung**: Ausführliche Dokumentation der Spotify Development Mode Limitierung
  - Development Mode: Max 25 authentifizierte Nutzer
  - Extended Quota Mode: Erfordert registrierte Firma + 250.000+ aktive Nutzer
  - Indie-Sperre: Seit Mai 2025 keine Anträge von Einzelpersonen möglich
  - "Absurd"-Hinweis: Kein organisches Wachstum von 25 auf 250.000 möglich
- **YDL Rechtlicher Hinweis**: Umfassende Disclaimer zur rechtlichen Grauzone
  - Orange Warning Box auf Landing Page
  - Erklärung in PasswordProtectionDialog
  - Hinweis auf private, nicht-kommerzielle, bildungsbasierte Nutzung
  - Passwortschutz als rechtliche Absicherung für Entwickler
- **Spotify Slot Management System**:
  - Neue Datei: `pwa/spotify.slots.json` - Zentrale Konfiguration für verfügbare Slots
  - Dynamischer Slot-Counter: "Noch 20 von 25 Slots frei"
  - Pre-filled mailto: Link zum Anfordern von Spotify-Zugang
  - User muss E-Mail-Adresse des Spotify-Kontos senden (für Developer Dashboard)
  - Contact Email: martin.pfeffer@celox.io

**📊 Genre Statistics in Player Stats:**
- Added `bestGenre` and `genreStats` tracking to player statistics
- New "Lieblings-Genre" stats card (pink theme, 🎸 icon)
- Genre distribution chart with color-coded bars
  - Pink-orange gradient for favorite genre
  - Cyan-blue gradient for other genres
  - Sorted by play count (descending)
  - Truncated names with tooltip support

**Implementation:**
- Parallel genre analysis alongside decade statistics
- Safe null-checking for songs without genre field
- Visual bars show relative percentages

**🧪 CI/CD Improvements:**
- Fixed GitHub Actions test failures
- Created `spotify.config.mock.js` for test environment
- Updated test setup to mock gitignored config file
- All 41/41 integration tests now pass in CI

**Files Modified:**
- `pwa/spotify.slots.json` (new) - Slot configuration
- `pwa/src/screens/LandingPage.tsx` (+150 lines) - API explanations, slot management, mailto: link
- `pwa/src/components/PasswordProtectionDialog.tsx` (+15 lines) - YDL grey area explanation
- `pwa/src/components/PlayerStatsDialog.tsx` (+59 lines) - Genre statistics
- `pwa/spotify.config.mock.js` (new) - Test mock
- `pwa/src/test/setup.ts` (updated) - Mock configuration

### v0.0.29 (2025-11-06)

**🎯 Sidebar Navigation - 3-State System Overhaul**

**Complete Restructure:**
- Implemented context-aware navigation with 3 distinct states (Landing/Setup/Game)
- Consolidated duplicate warning logic into single parameterized function
- Progressive disclosure - only show relevant options for current context

**Navigation States:**
1. **Landing Page** - 6 buttons (Anleitung + 5 scroll sections)
2. **Setup Phase** - 2 buttons (Anleitung + Zurück zum Menü with warning)
3. **In Game** - 2 buttons (Hilfe + Spiel beenden with red highlighting)

**Improvements:**
- ✅ State-based logic using `location.pathname` + `isGameStarted`
- ✅ Context-aware button labels ("Anleitung" → "Hilfe" in game)
- ✅ Smart warnings only when data would be lost
- ✅ Red destructive action styling for "Spiel beenden"
- ✅ Removed redundant "Startseite" button during games
- ✅ Hidden scroll buttons during active gameplay
- ✅ Added warnings when leaving setup phase with configured players

**Technical:**
- File: `pwa/src/components/Sidebar.tsx` (complete rewrite, 372 lines)
- Reduced code duplication with unified `showNavigationWarning()` function
- Conditional rendering for 3 distinct menu structures
- Improved UX with focused, clutter-free navigation

### v0.0.27 (2025-11-05)

**🎵 Hybrid Audio System - Spotify 25-User Limit Lösung**

**Problem:**
Seit Mai 2025 limitiert Spotify alle Indie-Developer-Apps auf maximal 25 authentifizierte Nutzer im Development Mode. Extended Quota Mode ist nur für registrierte Firmen mit 250.000+ aktiven Nutzern verfügbar.

**Lösung:**
Implementierung eines Hybrid Audio Systems mit zwei Modi:

**Audio-Modi:**
- 🎵 **Preview-Modus (Gratis)** - Standard für alle Nutzer:
  - 30-Sekunden-Clips von Spotify
  - Kein Login erforderlich
  - Unbegrenzte Spieler
  - Ausreichend für Quiz-Gameplay

- 🎧 **Spotify Premium** - Optional für VIP-Nutzer (max. 25):
  - Volle Song-Wiedergabe
  - Hochauflösendes Audio
  - Spotify Premium Account erforderlich
  - Begrenzt auf 25 Spieler (Development Mode)
  - ⚠️ **Wichtig:** Der Entwickler muss jeden Spieler manuell in der [Spotify Developer Console](https://developer.spotify.com/dashboard) unter "Users and Access" hinzufügen. Nur 25 Slots verfügbar.

**Technische Implementation:**
- `PreviewPlayerService.ts` - Howler.js-basierter Player für 30s Clips
- `MusicPlayerService.ts` - Abstraktionsschicht mit automatischem Fallback
- `LandingPage.tsx` - Zwei-Button-Auswahl mit Vergleichstabelle
- `MusicPlayer.tsx` - Mode-Badges und unified Player-Interface
- `GameScreen.tsx` - Transparente Integration ohne Gameplay-Änderungen

**User Experience:**
- Klarer Mode-Indikator im Player (🎧 Spotify Premium / 🎵 Preview 30s)
- Automatischer Fallback bei Spotify-Fehlern
- localStorage-basierte Präferenz-Speicherung
- Keine Änderungen am Gameplay erforderlich

**Dependencies:**
- `howler@2.2.3` - HTML5 Audio Player für Preview-Clips
- Bestehende Spotify Web Playback SDK Integration beibehalten

### v0.0.27 (2025-11-05)

**🎵 Self-Hosted Audio System**

**Complete Self-Hosting Infrastructure:**
- ✅ **Full Song Downloads**: 209 songs (128 kbps MP3, ~933 MB total) via yt-dlp
- ✅ **VPS Integration**: Automated upload to https://mxster.de/audio/
- ✅ **URL Management**: Auto-update of previewUrl fields in songs.json and songs.ts
- ✅ **Validation**: HTTPS accessibility checks for all 209 audio files
- ✅ **nginx Configuration**: Optimized audio serving with CORS, caching, and range requests

**New Scripts (`scripts/audio-hosting/`):**
- `download-songs.js` - Downloads full songs from YouTube (128 kbps MP3)
  - Options: `--limit N` (test mode), `--resume` (skip existing files)
  - Features: 3 concurrent downloads, 3 retries per song, batch processing
  - Output: ~3.5 MB per song average, progress tracking
- `upload-to-vps.js` - Uploads MP3s to VPS via rsync
  - Options: `--dry-run` (preview changes)
  - Features: Incremental sync, permission setting, nginx verification
- `update-song-urls.js` - Updates previewUrl in songs.json and songs.ts
  - Options: `--dry-run` (preview changes)
  - Features: Auto-backup, 100% coverage verification
- `validate-audio.js` - Validates HTTPS accessibility
  - Options: `--full` (all 209 songs), default: 10 sample songs
  - Features: HTTP status, content-type, file size checks

**Benefits:**
- 🌟 **Unlimited Users**: No 25-user Development Mode limit
- 🎵 **Full Songs**: 3-5 minute tracks instead of 30-second previews
- 🔓 **No Auth Required**: Direct audio playback without Spotify login
- 💾 **Offline-Ready**: PWA can cache songs for offline playback

**Technical Details:**
- Average Song Size: 4.47 MB (128 kbps MP3)
- Total Storage: 933.43 MB on VPS
- Quality: 128 kbps MP3 (balance of size vs quality)
- nginx: Range requests enabled for seeking, 1-year cache, CORS enabled

**🐛 Bug Fixes**
- Fixed random start position feature for self-hosted audio (now works in preview mode)
- Fixed Timeline Global win condition (now counts total cards across all players, winner = most cards after 10 total)
- Fixed game end dialog not closing when clicking "Zur Startseite" or "Neue Runde"

**🧪 Tests**
- Added comprehensive tests for Timeline Global win condition
- All 64 unit tests passing
- HTTP/2 compatibility fix in validation script

### v0.0.26 (2025-11-05)

**🎨 Visual Feedback & UX Improvements**

**New Animations:**
- ✨ **Timeline Placement Animations**:
  - ✅ Correct placement → 3 randomized confetti patterns (Center Burst, Side Cannons, Spiral)
  - ❌ Wrong placement → Thunder/rain animation with lightning bolts and screen shake
- 🏆 **Hardcore Mode Guess Animations**:
  - 15 points (Perfect) → Gold confetti + "PERFECT!" overlay + golden glow
  - 10-14 points (Great) → Silver confetti + "GREAT!" overlay + cyan glow
  - 5-9 points (Good) → Green particles + "NICE!" overlay + green glow
  - 1-4 points (Partial) → Yellow sparks + "+X" points display + weak yellow glow
  - 0 points (Wrong) → Falling ❌ symbols + screen shake + red flash
- 🎲 **Full Randomization**: Colors, particle counts, timing, and intensity all randomized
- 📱 **Mobile Optimized**: 50% fewer particles on mobile devices
- ♿ **Accessibility**: `prefers-reduced-motion` support

**UI Improvements:**
- 📏 **Enlarged Placement Buttons**: Timeline placement dialog text now 2-3x larger (`text-2xl md:text-3xl`)
- ⌨️ **Keyboard Shortcuts**: Press Enter or ESC to close evaluation and placement result dialogs (desktop/laptop)

**Technical:**
- New Files: `placementAnimations.ts`, `guessAnimations.ts`, `animationHelpers.ts`, `animations.css`
- Dependencies: Uses existing `canvas-confetti` library
- Build Size: +7 KB (animations + CSS keyframes)

### v0.0.25 (2025-11-04)

**🏆 Achievement System - Critical Bug Fixes**
- Fixed 3 critical achievement detection bugs identified through code analysis
- **NAME_DROPPER**: Added `guessDetails` interface to accurately track artist correctness (can't use points alone)
- **PERFECT_STREAK**: Implemented dual verification (points OR guessDetails) for reliability
- **COMEBACK_PROFI**: Improved comeback detection logic (checks fewer cards OR came from behind)

**🧪 Test Scripts - Complete Overhaul**
- **generate-game-history.js**: Now includes all 20 achievements (was missing 10 new ones)
  - GRAND_MASTER now unlocks correctly with 5000+ points
  - Player "m" reaches ~35,000 points in 1000 games
  - All new achievements properly tracked
- **unlock-all-achievements.js**: Updated to all 20 achievements
  - Player "m": 20/20 unlocked (100%)
  - Player "n": 10/20 unlocked with progress (50%)

**🔧 Technical Improvements**
- Added `guessDetails` to Song interface for accurate field tracking
- Updated `placeCardInTimeline()` to store guess metadata
- Enhanced achievement debugging with progress logs after each game
- All 20 achievements now fully functional and tested

### v0.0.20 (2025-01-02)

**🔧 TypeScript & Code Quality**
- Fixed all TypeScript errors in AchievementContext, GameContext, and GameScreen
- Migrated from GameHistory class to useGameHistory hook
- Fixed modal button interface (removed invalid properties: label, variant, closeOnClick)
- Added proper type annotations for all implicit `any` types
- Removed unused variables and imports
- Fixed SaveGameData structure for game history persistence
- Improved code maintainability and type safety

**🐛 Bug Fixes**
- Fixed double winner dialog in Timeline modes
- Fixed win condition check timing with proper state updates
- Fixed Player type issues in winner modal
- Fixed history data structure (Array vs Object with .games property)

**📊 Analysis Tools**
- Added decade distribution report generator (`scripts/analysis/generate-decade-report.js`)
- Interactive HTML visualization showing song distribution across decades
- Styled with celox design system for consistent branding

**🎨 UI Improvements**
- All modals now use consistent button structure
- Improved error handling in game history operations
- Better TypeScript IntelliSense support across the app

---

## 📞 Kontakt

- **Website**: [mxster.de](https://mxster.de)
- **GitHub**: [@pepperonas](https://github.com/pepperonas)
- **Email**: martin.pfeffer@celox.io

---

**Made with ❤️ for music lovers** | © 2025 Martin Pfeffer
