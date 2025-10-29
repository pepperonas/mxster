# mxster Spielkarten Generator

Dieses Skript generiert druckbare Spielkarten für das mxster Music Timeline Game als PDF.

## Installation

Installiere die benötigten Dependencies:

```bash
cd /Users/martin/WebstormProjects/mrx3k1/mxster/pwa
npm install
```

## Verwendung

Generiere die Spielkarten als PDF:

```bash
npm run generate-cards
```

Das Skript erstellt eine Datei `mxster-cards.pdf` im aktuellen Verzeichnis.

## Kartenformat

### Vorderseite (QR-Code)
- **mxster** Logo oben
- **QR-Code** in der Mitte (Spotify Track URL)
- Anweisung: "Scanne den Code mit der mxster App"
- Song-ID am unteren Rand

### Rückseite (Song-Information)
- **Jahr** groß und prominent (48pt)
- **Song-Titel** (14pt, fett)
- **Artist** (11pt)
- Dekorative Linie am unteren Rand

### Abmessungen
- **Kartengröße**: 2.5" x 3.5" (63mm x 88mm) - Standard Spielkartengröße
- **Papierformat**: A4 (210mm x 297mm)
- **Karten pro Seite**: 1 Karte (Vorderseite + Rückseite nebeneinander)

## PDF-Struktur

Das generierte PDF enthält:

1. **Titelseite** mit Übersicht (Anzahl der Songs)
2. **Pro Song eine Seite** mit:
   - Vorderseite links (QR-Code)
   - Rückseite rechts (Song-Info)
   - Gestrichelte Schneidelinien
   - Kartennummer (z.B. "Karte 1 von 8")
3. **Anleitungsseite** mit Druckanweisungen

## Druckanleitung

### Materialien
- **Papier**: Mindestens 200g/m² (Karton empfohlen)
- **Drucker**: Farblaserdrucker oder hochwertiger Tintenstrahldrucker
- **Optional**: Laminiergerät oder Selbstklebefolie

### Schritte

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

## Farbschema

Die Karten verwenden das mxster Design:

- **Vorderseite**:
  - Hintergrund: `#1A1C27` (Dunkelgrau)
  - Border: `#4A90E2` (Blau)
  - Text: `#FFFFFF` (Weiß) / `#B0B3C1` (Hellgrau)

- **Rückseite**:
  - Hintergrund: `#2C2E3B` (Dunkelgrau)
  - Border: `#FF6B35` (Orange)
  - Jahr: `#4A90E2` (Blau)
  - Titel: `#FFFFFF` (Weiß)
  - Artist: `#B0B3C1` (Hellgrau)

## Technische Details

### Dependencies
- `pdfkit` - PDF-Generierung
- `qrcode` - QR-Code Generierung

### Song-Daten
Die Karten werden aus `src/data/songs.js` generiert. Jeder Song benötigt:
- `id` - Eindeutige ID
- `title` - Song-Titel
- `artist` - Künstler
- `year` - Erscheinungsjahr
- `spotifyId` - Spotify Track-ID für QR-Code

### QR-Code Format
Der QR-Code enthält die Spotify Track URL im Format:
```
https://open.spotify.com/track/{spotifyId}
```

### Ausgabe
- **Dateiname**: `mxster-cards.pdf`
- **Speicherort**: Aktuelles Verzeichnis (`/mxster/pwa/`)
- **Dateigröße**: ~50-100 KB pro Karte (abhängig von QR-Code Komplexität)

## Anpassungen

### Kartengröße ändern
Bearbeite die Konstanten in `generate-cards.js`:

```javascript
const CARD_WIDTH = 2.5 * 72;  // Breite in inches * 72 (points)
const CARD_HEIGHT = 3.5 * 72; // Höhe in inches * 72 (points)
```

### Farben ändern
Passe die Farbwerte in den `drawCardFront()` und `drawCardBack()` Funktionen an.

### Mehr Songs hinzufügen
Füge neue Songs zu `src/data/songs.js` hinzu und führe das Skript erneut aus.

## Beispiel-Ausgabe

```
🎵 Generiere mxster Spielkarten PDF...
📊 Anzahl Songs: 8
  Generiere Karte 1/8: Bohemian Rhapsody
  Generiere Karte 2/8: Billie Jean
  Generiere Karte 3/8: Like a Prayer
  ...
✅ PDF erfolgreich generiert!
📄 Datei: ./mxster-cards.pdf
📏 Format: A4
🎴 Kartengröße: 2.5" x 3.5" (63mm x 88mm)
📦 Gesamt: 8 Karten
```

## Spielanleitung

Die Karten werden im mxster Music Timeline Game verwendet:

1. **DJ** scannt den QR-Code mit der mxster App
2. **Spieler** hören den Song und versuchen:
   - Song-Titel zu erraten
   - Artist zu erraten
   - Erscheinungsjahr zu erraten
3. **Richtige Antworten** geben Token
4. **Karten** werden chronologisch in die persönliche Timeline einsortiert
5. **Gewinner**: Erste Person mit 10 korrekt platzierten Karten

## Troubleshooting

### PDF wird nicht generiert
- Prüfe, ob alle Dependencies installiert sind: `npm install`
- Stelle sicher, dass Node.js installiert ist (Version 14+)
- Prüfe die Konsole auf Fehlermeldungen

### QR-Codes funktionieren nicht
- Stelle sicher, dass die `spotifyId` in `songs.js` korrekt ist
- Teste den QR-Code mit einem Standard-QR-Reader
- Die URL sollte im Format `https://open.spotify.com/track/{id}` sein

### Schlechte Druckqualität
- Verwende dickeres Papier (mindestens 200g/m²)
- Stelle den Drucker auf höchste Qualität ein
- Verwende einen Laserdrucker für beste Ergebnisse

## Lizenz

© 2025 mxster - Music Timeline Game
