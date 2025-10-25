# 🎴 mxster Karten-Generator

Generiere QR-Code-Karten und 3D-druckbare Modelle für das mxster Musik-Timeline-Spiel.

## Schnellstart

### Voraussetzungen
```bash
# Python-Abhängigkeiten installieren
cd card-generator
python3 -m venv venv
source venv/bin/activate  # oder .\venv\Scripts\activate unter Windows
pip install qrcode pillow
```

### Karten generieren

```bash
# QR-Codes + druckbare Karten aus songs.json generieren
python generate_cards.py ../docs/songs.json

# Ausgabe:
# - qr-codes/*.png - Einzelne QR-Codes
# - printable/*.png - Karten mit Song-Info und QR-Code
```

## Funktionen

### 1. QR-Code-Generierung
- Erstellt QR-Codes mit Links zu Spotify-Tracks
- Hohe Fehlerkorrektur (Level H, 30% Redundanz)
- Optimierte Größe: 20px Boxen, 8px Rand
- Funktioniert mit Smartphone-Kameras und Browser-Scannern

### 2. Druckbare Karten
- Songtitel, Künstler, Jahr
- Eingebetteter QR-Code
- Optimiert für Heimdruck
- Standard-Kartenabmessungen

### 3. 3D-Modelle (Optional)
3D-druckbare Kartenhalter und Spielsteine generieren:
```bash
# Erfordert installiertes OpenSCAD
node generate-3d-models.js
```

## Dateistruktur

```
card-generator/
├── generate_cards.py       # Haupt-Generierungsskript
├── qr-codes/              # Generierte QR-Codes (gitignored)
├── printable/             # Druckbare Karten (gitignored)
├── models/                # 3D-Modelle (SCAD/STL)
└── venv/                  # Python Virtual Environment
```

## Technische Details

### QR-Code-Format
- **Inhalt**: Spotify-Track-URLs (`https://open.spotify.com/track/{spotifyId}`)
- **Fallback**: YouTube-URLs falls Spotify nicht verfügbar
- **Fehlerkorrektur**: Level H (30% Redundanz für beschädigte Codes)
- **Größe**: 20px Boxgröße, 8px Rand

### Karten-Spezifikationen
- **Format**: PNG-Bilder
- **Auflösung**: 300 DPI (Druckqualität)
- **Abmessungen**: Standard-Spielkartengröße
- **Layout**: Titel (oben) → Künstler → Jahr → QR-Code (unten)

### 3D-Druck
Befindet sich in `../3d-models/`:
- `song_card.scad` - Karte mit QR-Ausschnitt
- `game_chip.scad` - Timeline-Marker
- `card_holder.scad` - Kartenaufbewahrung

**Empfohlene Einstellungen:**
- Material: PLA oder PETG
- Schichthöhe: 0,2mm
- Infill: 20%
- Support: Nur für Chips

## Arbeitsablauf

### Neue Songs hinzufügen

1. **Zu songs.json hinzufügen**:
```json
{
  "id": "song_XXX",
  "title": "Songtitel",
  "artist": "Künstlername",
  "year": 1999,
  "spotifyId": "spotify_track_id",
  "previewUrl": "https://...",
  "audioUrl": ""
}
```

2. **Karten generieren**:
```bash
python generate_cards.py ../docs/songs.json
```

3. **PWA-Daten aktualisieren**:
```bash
cd ../pwa
npm run import-spotify  # Oder manuell src/data/songs.js aktualisieren
```

### Von Spotify-Playlist importieren

```bash
cd ../pwa

# Zuerst spotify.config.js konfigurieren
npm run import-spotify

# Optional: Ungültige Songs filtern
npm run filter-songs

# Karten neu generieren
cd ../card-generator
python generate_cards.py ../docs/songs.json
```

## Fehlerbehebung

### QR-Codes scannen nicht
- Fehlerkorrektur-Level erhöhen
- Drucker-DPI-Einstellungen prüfen (mindestens 300 DPI)
- Ausreichende Beleuchtung beim Scannen sicherstellen
- QR-Code-Größe im Skript erhöhen

### Fehlende Abhängigkeiten
```bash
pip install --upgrade qrcode pillow
```

### 3D-Druck-Probleme
- Support für Spielchips aktivieren
- Haftungseinstellungen prüfen
- STL-Datei-Integrität im Slicer überprüfen

## Changelog

### v1.2.0 (Aktuell)
- 3D-Modell-Generierung hinzugefügt
- Verbessertes Kartenlayout mit besserem Abstand
- Stapelverarbeitung für alle Songs hinzugefügt
- Optimierte QR-Code-Fehlerkorrektur

### v1.1.0
- Druckbare Kartengenerierung hinzugefügt
- Dateinamen-Bereinigung implementiert
- Unterstützung für YouTube-Fallback-URLs hinzugefügt

### v1.0.0
- Erste QR-Code-Generierung
- Basis-Kartenlayout
- Spotify-Integration

## Mitwirken

Beim Hinzufügen von Funktionen:
1. Mit mehreren Song-Einträgen testen
2. QR-Codes auf korrekte Scan-Funktion prüfen
3. Druckqualität bei 300 DPI überprüfen
4. Diese README mit Änderungen aktualisieren

## Lizenz

Teil des mxster-Projekts. Siehe Haupt-Repository-LIZENZ.
