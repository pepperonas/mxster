# 🎵 mxster - Music Timeline Game

**Das ultimative Musikquiz für Musikfans!** Rate Songs, platziere sie chronologisch und teste dein Musikwissen. Spiele mit Freunden, sammle Punkte und werde zum Musik-Champion!

[![Live Demo](https://img.shields.io/badge/Demo-mxster.de-blue?style=for-the-badge)](https://mxster.de)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](LICENSE)

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
- 💾 **Spielstand speichern** - Export/Import als JSON-Datei
- 🎮 **Multiplayer** - Spiele mit beliebig vielen Freunden

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

1. Song wird abgespielt (DJ scannt QR-Code oder virtueller Modus)
2. Spieler raten Titel, Künstler und Jahr
3. Punkte vergeben:
   - ✅ Titel richtig: **+1 Punkt**
   - ✅ Künstler richtig: **+1 Punkt**
   - ✅ Jahr richtig (±2 Jahre): **+1 Punkt**
4. Karte wird automatisch chronologisch einsortiert
5. **Gewinner:** Meiste Punkte nach 10 Karten

### 👤 Timeline (Persönlich)

**Ziel:** Baue deine eigene Timeline mit 10 Karten auf!

1. Jeder Spieler hat seine eigene Timeline
2. Songs werden präsentiert
3. Spieler platziert Song manuell in Timeline (Buttons klicken)
4. **Gewinner:** Erster mit 10 richtig platzierten Karten

### 🌍 Timeline (Global)

**Ziel:** Wie Timeline Persönlich, aber mit gemeinsamer Timeline!

1. Alle Spieler teilen eine Timeline
2. Kooperatives Gameplay
3. **Gewinner:** Erster mit 10 richtig platzierten Karten

## 🃏 Karten erstellen

### 📄 PDF-Karten (Empfohlen für Einsteiger)

Schnell, einfach und kein 3D-Drucker nötig!

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

## 🎵 Songs hinzufügen

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
│   ├── generate-cards.js  # PDF-Karten Generator
│   └── package.json
├── card-generator/         # 3D-Karten Generator (Node.js)
│   ├── generateCard.js    # Hauptskript
│   ├── qrToScad.js       # QR → OpenSCAD Konverter
│   └── models/           # Generierte STL/SCAD (nicht in Git)
├── docs/
│   ├── songs.json        # Zentrale Song-Datenbank
│   └── *.png             # QR-Code Bilder
├── add-song.js           # CLI Tool: Song hinzufügen
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
node add-song.js "SPOTIFY_URL" --generate-3d      # + 3D-Modell
npm run import-spotify                             # Aus Playlist
npm run update-previews                            # Preview URLs updaten
npm run filter-songs                               # Ungültige Songs entfernen

# Karten generieren
node generate-cards.js                # PDF Standard
node generate-cards.js --bw          # PDF Schwarz-Weiß
node generate-cards.js --duplex      # PDF Duplex
```

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

Dieses Projekt ist für **privaten Gebrauch** entwickelt.

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
