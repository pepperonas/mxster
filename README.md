# 🎵 mxster - Music Timeline Game

**Das ultimative Musikquiz für Musikfans!** Rate Songs, platziere sie chronologisch und teste dein Musikwissen. Spiele mit Freunden, sammle Punkte und werde zum Musik-Champion!

[![Live Demo](https://img.shields.io/badge/Demo-mxster.de-blue?style=for-the-badge)](https://mxster.de)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
![Songs](https://img.shields.io/badge/Songs-104-orange?style=for-the-badge)

![mxster Banner](https://mxster.de/assets/mxster.jpg)

## 🎮 Was ist mxster?

mxster ist ein **Multiplayer-Musikquiz** mit drei verschiedenen Spielmodi:

- 🎯 **Ratespiel**: Rate Titel, Künstler und Erscheinungsjahr - sammle Punkte!
- 👤 **Timeline (Persönlich)**: Baue deine eigene Timeline chronologisch auf
- 🌍 **Timeline (Global)**: Alle Spieler teilen eine gemeinsame Timeline

### 🃏 Zwei Spielvarianten

- **Physische Karten**: Drucke PDF-Karten aus oder erstelle 3D-gedruckte Karten mit QR-Codes
- **Virtuelle Karten**: Spiele komplett digital ohne physische Karten

## ✨ Features

- 🎵 **Spotify Premium Integration** - Volle Song-Wiedergabe (keine 30s Previews!)
- 🎯 **Tolerantes Raten** - Fuzzy Matching erkennt Tippfehler
- 📱 **Progressive Web App** - Installierbar auf Smartphone & Desktop
- 🏆 **Live Punktesystem** - Echtzeit-Updates nach jeder Runde
- 📸 **QR-Code Scanner** - Scanne Karten mit Smartphone-Kamera
- 💾 **Automatische Spielstand-Speicherung** - Kein Fortschritt geht verloren, selbst bei Page Refresh!
- 🎮 **Multiplayer** - Spiele mit beliebig vielen Freunden
- ✏️ **Song-Editor** - Bearbeite Songs nachträglich mit interaktivem Wizard

## 🚀 Schnellstart für Anfänger

### Option 1: Online spielen (am einfachsten!)

1. Öffne [mxster.de](https://mxster.de)
2. Klicke auf "Mit Spotify starten"
3. Logge dich mit deinem **Spotify Premium Account** ein
4. Wähle Spielmodus und Variante
5. Füge Spieler hinzu
6. Los geht's! 🎉

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

### 🎯 Ratespiel

**Ziel:** Sammle die meisten Punkte durch richtiges Raten!

1. **Song abspielen:** DJ scannt QR-Code oder virtueller Modus zieht zufälligen Song
2. **Raten:** Spieler gibt Titel, Künstler und Jahr ein
3. **Fuzzy Matching:** System akzeptiert auch ähnliche Schreibweisen (z.B. "Fleetwood Mac" = "Fleetwood Mack")
4. **Punkte vergeben:**
   - ✅ Titel richtig: **+1 Punkt**
   - ✅ Künstler richtig: **+1 Punkt**
   - ✅ Jahr richtig (exakt): **+1 Punkt**
5. **Automatische Platzierung:** Karte wird sofort chronologisch in die Timeline einsortiert
6. **Live-Rangliste:** Score-Overview zeigt alle Spieler sortiert nach Punkten
7. **Gewinner:** Spieler mit den meisten Punkten nach 10 Karten

**Besonderheiten:**
- Keine manuelle Platzierung nötig
- Timeline wird automatisch sortiert
- Skip-Funktion verfügbar (0 Punkte, Karte wird trotzdem platziert)

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
- [Einzelne Modelle](https://github.com/pepperonas/mxster/tree/main/card-generator/models) - Direkt auf GitHub

---

## 🃏 Karten selbst generieren

### 📄 PDF-Karten (Empfohlen für Einsteiger)

Schnell, einfach und kein 3D-Drucker nötig!

#### Alle PDFs auf einmal generieren (empfohlen)

```bash
# Generiert alle 4 Varianten automatisch
./generate-all-pdfs.sh
```

Erstellt:
- `mxster-cards.pdf` - Standard (farbig, nebeneinander)
- `mxster-cards-bw.pdf` - Schwarz-Weiß (nebeneinander)
- `mxster-cards-duplex.pdf` - Duplex (farbig, getrennte Seiten)
- `mxster-cards-bw-duplex.pdf` - Duplex (Schwarz-Weiß, getrennte Seiten)

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

### 🎲 3D-Karten (für Fortgeschrittene)

Hochwertige, dauerhafte Karten mit graviertem QR-Code!

**Voraussetzungen:**
- 3D-Drucker
- [OpenSCAD](https://openscad.org/) (optional, für STL-Export)

```bash
# Song hinzufügen + 3D-Modell erstellen
node add-song.js "https://open.spotify.com/track/TRACK_ID" --generate-3d
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
node add-song.js "https://open.spotify.com/track/DEINE_TRACK_ID"
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
node edit-song.js
```

**Der Wizard führt dich durch:**
1. 🔍 Song-ID eingeben (z.B. `song_001`)
2. 📋 Aktuelle Daten werden angezeigt
3. ✏️ Neue Daten eingeben (leer lassen = Wert behalten)
4. 👀 Vorher/Nachher-Vergleich ansehen
5. ✅ Änderungen bestätigen

**Was passiert automatisch:**
- ✅ Automatisches Backup erstellt (`songs.json.backup-2025-10-24`)
- ✅ Datenbank aktualisiert (`docs/songs.json`)
- ✅ PWA-Daten synchronisiert (`pwa/src/data/songs.js`)
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
✅ pwa/src/data/songs.js aktualisiert
🔄 Generiere QR-Code...
✅ QR-Code generiert

3D-Modelle neu generieren? (j/n): n

╔══════════════════════════════════════════╗
║               ✅  Fertig!  ✅            ║
╚══════════════════════════════════════════╝

Aktualisierte Dateien:
  • docs/songs.json
  • pwa/src/data/songs.js
  • docs/song_008_*.png
  • card-generator/qr-codes/song_008_*.png
```

### Song austauschen (komplett ersetzen)

Du möchtest einen Song komplett durch einen anderen ersetzen? Nutze den Song-Exchange-Wizard:

```bash
# Im Hauptverzeichnis
node exchange-song.js
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
- ✅ PWA-Daten synchronisiert (`pwa/src/data/songs.js`)
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
✅ pwa/src/data/songs.js aktualisiert
🔄 Generiere Karten-Dateien (QR-Code + 3D-Modelle)...
✅ QR-Code generiert
✅ 3D-Modelle generiert (SCAD + STL)

PDF-Karten neu generieren (alle Songs)? (j/n): n

╔════════════════════════════════════════╗
║             ✅  Fertig!  ✅            ║
╚════════════════════════════════════════╝

Aktualisierte Dateien:
  • docs/songs.json
  • pwa/src/data/songs.js
  • docs/song_031_*.png
  • card-generator/qr-codes/song_031_*.png
  • card-generator/models/song_031_*.scad
  • card-generator/models/song_031_*.stl

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

## 📱 Als App installieren

### iOS (iPhone/iPad)

1. Öffne mxster.de in Safari
2. Tippe auf das **Teilen-Symbol** (unten)
3. Scrolle runter und wähle **"Zum Home-Bildschirm"**
4. Tippe auf **"Hinzufügen"**
5. Fertig! App ist jetzt auf deinem Homescreen 📱

### Android

1. Öffne mxster.de in Chrome
2. Tippe auf das **Menü** (⋮)
3. Wähle **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**
4. Tippe auf **"Installieren"**
5. Fertig! App ist jetzt in deiner App-Liste 📱

## 🛠️ Für Entwickler

### Projekt-Struktur

```
mxster/
├── pwa/                    # Progressive Web App (Vite + Vanilla JS)
│   ├── src/
│   │   ├── main.js        # Hauptspiel-Logik
│   │   ├── components/    # Landing Page, UI-Komponenten
│   │   ├── utils/         # Spotify Auth, Game State, etc.
│   │   └── styles/        # Tailwind CSS
│   ├── generate-cards.js  # PDF-Karten Generator (einzelne Variante)
│   └── package.json
├── card-generator/         # 3D-Karten Generator (Node.js)
│   ├── generateCard.js    # Hauptskript (QR + SCAD)
│   ├── qrToScad.js       # QR → OpenSCAD Konverter
│   └── models/           # Generierte STL/SCAD (nicht in Git)
├── docs/
│   ├── songs.json        # Zentrale Song-Datenbank (Source of Truth)
│   └── *.png             # QR-Code Bilder
├── add-song.js           # CLI Tool: Song hinzufügen
├── edit-song.js          # CLI Tool: Song bearbeiten (interaktiv)
├── generate-all-pdfs.sh  # Generiert alle 4 PDF-Varianten
├── deploy.sh             # Deployment-Script
└── README.md             # Diese Datei
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
node add-song.js "SPOTIFY_URL"                    # Song hinzufügen
node edit-song.js                                 # Song bearbeiten (Metadaten)
node exchange-song.js                             # Song austauschen (komplett)
npm run import-spotify                             # Aus Playlist
npm run update-previews                            # Preview URLs updaten
npm run filter-songs                               # Ungültige Songs entfernen

# Karten generieren
./generate-all-pdfs.sh               # Alle 4 PDF-Varianten
node generate-cards.js                # PDF Standard
node generate-cards.js --bw          # PDF Schwarz-Weiß
node generate-cards.js --duplex      # PDF Duplex

# Release erstellen (automatisch via GitHub Actions)
git tag v1.0.0                       # Tag erstellen
git push origin v1.0.0               # Push löst CI/CD aus
# GitHub Actions generiert automatisch:
# - PDFs, STL-ZIP, SCAD-ZIP
# - GitHub Release mit all-cards.3mf
```

### GitHub Release erstellen

Releases werden **manuell** mit GitHub CLI erstellt:

```bash
# 1. Assets lokal generieren
./generate-all-pdfs.sh

cd card-generator/models
zip -r ../../mxster-stl-models.zip *.stl
zip -r ../../mxster-scad-models.zip *.scad
cd ../..

# 2. all-cards.3mf in PrusaSlicer erstellen (manuell)
# 3. all-cards.3mf zu Git hinzufügen
git add card-generator/models/all-cards.3mf
git commit -m "Update all-cards.3mf"
git push

# 4. Einmalig: GitHub CLI authentifizieren
gh auth login

# 5. Release erstellen mit allen Assets
gh release create v0.0.X-beta \
  --title "Release v0.0.X-beta" \
  --prerelease \
  pwa/mxster-cards*.pdf \
  mxster-*.zip \
  card-generator/models/all-cards.3mf

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
- ✅ mxster-cards.pdf (Standard, farbig)
- ✅ mxster-cards-bw.pdf (Schwarz-Weiß)
- ✅ mxster-cards-duplex.pdf (Duplex, farbig)
- ✅ mxster-cards-bw-duplex.pdf (Duplex, Schwarz-Weiß)
- ✅ mxster-stl-models.zip (alle STL Dateien)
- ✅ mxster-scad-models.zip (alle SCAD Dateien)
- ✅ all-cards.3mf (alle Karten für 3D-Drucker)

### CLI Tools

#### add-song.js
Fügt neue Songs zur Datenbank hinzu. Lädt Metadaten automatisch von Spotify.

```bash
node add-song.js "https://open.spotify.com/track/TRACK_ID"
node add-song.js "TRACK_ID"  # Alternativ: Nur die ID
```

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
node edit-song.js
# Folge den Anweisungen im Wizard
```

**Technische Details:**
- Nutzt Node.js `readline` für interaktive Prompts
- Erstellt Backups mit Zeitstempel: `songs.json.backup-YYYY-MM-DD`
- Führt `generateCard.js` automatisch aus für neue QR-Codes
- Synchronisiert beide Datenbanken: `docs/songs.json` und `pwa/src/data/songs.js`
- Säubert alte Dateien aus `docs/`, `qr-codes/` und `models/` Verzeichnissen

### Tech Stack

- **Frontend**: Vite 5.0, Vanilla JavaScript (ES6+), Tailwind CSS
- **Audio**: Spotify Web Playback SDK + Howler.js (Fallback)
- **PWA**: vite-plugin-pwa, Service Worker, Offline-Support
- **QR**: qr-scanner (Browser-basiert)
- **PDF**: PDFKit
- **3D**: OpenSCAD (optional)

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

## 📞 Kontakt

- **Website**: [mxster.de](https://mxster.de)
- **GitHub**: [@pepperonas](https://github.com/pepperonas)
- **Email**: martin.pfeffer@celox.io

---

**Made with ❤️ for music lovers** | © 2025 Martin Pfeffer
