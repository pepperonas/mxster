# 🎴 mxster Karten-Generator

Generiere QR-Code-Karten und 3D-druckbare Modelle für das mxster Musik-Timeline-Spiel.

> **💡 Tipp:** Diese README ergänzt die [Haupt-README](../README.md). Für vollständige Projektdokumentation siehe dort.

## 📋 Inhaltsverzeichnis

- [Schnellstart](#schnellstart)
- [PDF-Karten (Empfohlen)](#-pdf-karten-empfohlen)
- [3D-Modelle](#-3d-modelle-für-fortgeschrittene)
- [Song-Verwaltung](#-song-verwaltung)
- [Python QR-Code Generator](#-python-qr-code-generator-legacy)
- [Technische Details](#-technische-details)
- [Fehlerbehebung](#-fehlerbehebung)

## Schnellstart

### Welche Methode passt zu dir?

| Methode | Vorteile | Nachteile | Für wen? |
|---------|----------|-----------|----------|
| **📄 PDF-Karten** | Schnell, günstig, kein 3D-Drucker nötig | Weniger haltbar | Einsteiger |
| **🎲 3D-Druck** | Hochwertig, dauerhaft, QR-Code eingraviert | Braucht 3D-Drucker, langsamer | Fortgeschrittene |

---

## 📄 PDF-Karten (Empfohlen)

Schnell, einfach und kein 3D-Drucker nötig!

### Alle PDFs auf einmal generieren

```bash
# Im Hauptverzeichnis (nicht in card-generator/)
./generate-all-pdfs.sh
```

**Erstellt automatisch:**
- `mxster-cards.pdf` - Standard (farbig, Vorder-/Rückseite nebeneinander)
- `mxster-cards-bw.pdf` - Schwarz-Weiß (spart Tinte)
- `mxster-cards-duplex.pdf` - Duplex (farbig, getrennte Seiten für beidseitigen Druck)
- `mxster-cards-bw-duplex.pdf` - Duplex Schwarz-Weiß

### Einzelne PDF-Variante generieren

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

### 🖨️ Drucken & Basteln

**Druckeinstellungen:**
- **Papier**: Mindestens **200g/m²** Karton (besser 250g/m²)
- **Farbe**: Farbig oder Schwarz-Weiß (je nach Variante)
- **Duplex**: Wenn vorhanden, beidseitig drucken (bei Duplex-PDFs)
- **Schneiden**: Entlang der gestrichelten Linien
- **Falten**: Bei Standard-PDFs in der Mitte falten
- **Optional**: Laminieren für längere Haltbarkeit

**Layout-Erklärung:**
- **Standard-PDFs**: Vorderseite (Song-Info) und Rückseite (QR-Code) nebeneinander
- **Duplex-PDFs**: Vorderseiten auf ungeraden Seiten, Rückseiten auf geraden Seiten

---

## 🎲 3D-Modelle (für Fortgeschrittene)

Hochwertige, dauerhafte Karten mit graviertem QR-Code!

### Voraussetzungen
- 3D-Drucker
- [OpenSCAD](https://openscad.org/) (optional, für manuelle STL-Generierung)

### Modelle generieren

#### Beim Song hinzufügen (automatisch)
```bash
# Im Hauptverzeichnis - 3D-Modelle werden automatisch erstellt
node scripts/song-management/add-song.js "https://open.spotify.com/track/TRACK_ID"
```

#### Nachträglich für bestehende Songs
```bash
cd card-generator
node generateCard.js
```

**Ausgabe:**
- `output/models/*.scad` - OpenSCAD Quelldateien
- `output/models/*.stl` - Druckfertige 3D-Modelle
- `output/qr-codes/*.png` - QR-Code Bilder

### 🖨️ 3D-Druckeinstellungen

**Wichtige Parameter:**
- **Material**: PLA oder PETG
- **Layer Height**: **0.1-0.15mm** (wichtig für QR-Details!)
- **Infill**: **100%** (wichtig für QR-Scan-Qualität!)
- **Support**: Nicht nötig
- **Brim/Raft**: Optional für bessere Haftung

**Qualitätskontrolle:**
- QR-Code muss klar erkennbar sein
- Alle Quadrate des QR-Codes deutlich sichtbar
- Keine verschmierten oder verbundenen Pixel

---

## 🎵 Song-Verwaltung

### Einzelnen Song hinzufügen (Einfachste Methode)

```bash
# Im Hauptverzeichnis
node add-song.js "https://open.spotify.com/track/DEINE_TRACK_ID"
```

**Was passiert automatisch:**
1. ✅ Metadaten von Spotify geladen (Titel, Künstler, Jahr, Preview-URL)
2. ✅ Song-ID automatisch generiert (z.B. `song_036`)
3. ✅ `docs/songs.json` aktualisiert
4. ✅ `pwa/src/data/songs.ts` synchronisiert
5. ✅ QR-Code erstellt (`card-generator/output/qr-codes/`)
6. ✅ SCAD-Datei generiert (`card-generator/output/models/`)
7. ✅ STL-Datei generiert (`card-generator/output/models/`)

**Hinweis:** 3D-Modelle (SCAD + STL) werden automatisch erstellt, kein zusätzlicher Parameter nötig!

### Song bearbeiten (Interaktiver Wizard)

Tippfehler oder Metadaten korrigieren? Nutze den Song-Editor:

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
- ✅ Automatisches Backup erstellt (`songs.tson.backup-2025-10-24`)
- ✅ `docs/songs.tson` aktualisiert
- ✅ `pwa/src/data/songs.ts` synchronisiert
- ✅ Alte Dateien gelöscht (falls Titel/Artist geändert)
- ✅ Neue QR-Codes generiert
- ✅ PNG-Karten aktualisiert
- ✅ Optional: 3D-Modelle neu erstellen (SCAD + STL)

**Beispiel:**

```bash
$ node edit-song.js

┌──────────────────────────────────────────┐
│   🎵  mxster Song Editor Wizard  🎵     │
└──────────────────────────────────────────┘

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
✅ Backup erstellt: docs/songs.tson.backup-2025-10-24
🗑️  2 alte Dateien gelöscht
✅ songs.tson aktualisiert
✅ pwa/src/data/songs.ts aktualisiert
🔄 Generiere QR-Code...
✅ QR-Code generiert

3D-Modelle neu generieren? (j/n): n

┌──────────────────────────────────────────┐
│             ✅  Fertig!  ✅             │
└──────────────────────────────────────────┘
```

### Von Spotify-Playlist importieren

```bash
cd pwa

# Zuerst spotify.config.js konfigurieren
npm run import-spotify

# Optional: Ungültige Songs filtern
npm run filter-songs

# Karten neu generieren
cd ..
./generate-all-pdfs.sh  # Oder einzelne Varianten
```

---

## 🐍 Python QR-Code Generator (Legacy)

> **Hinweis:** Die Node.js-Methoden (oben) sind einfacher und empfohlen. Diese Python-Methode wird für Legacy-Support beibehalten.

### Voraussetzungen
```bash
cd card-generator
python3 -m venv venv
source venv/bin/activate  # oder .\venv\Scripts\activate unter Windows
pip install qrcode pillow
```

### Generieren
```bash
python generate_cards.py ../docs/songs.tson
```

**Ausgabe:**
- `qr-codes/*.png` - Einzelne QR-Codes
- `printable/*.png` - PNG-Karten mit Song-Info

---

## 📁 Dateistruktur

```
card-generator/
├── generateCard.js         # Node.js SCAD/STL Generator
├── qrToScad.js            # QR-zu-OpenSCAD Konverter
├── template.scad          # OpenSCAD Template (Referenz)
├── generate_cards.py      # Python QR-Code Generator (Legacy)
├── qr-codes/              # Generierte QR-Codes (gitignored)
│   └── song_XXX_*.png
├── models/                # 3D-Modelle (SCAD/STL, gitignored)
│   ├── song_XXX_*.scad
│   └── song_XXX_*.stl
└── venv/                  # Python Virtual Environment
```

**Im Hauptverzeichnis:**
```
mxster/
├── docs/
│   ├── songs.tson         # Zentrale Song-Datenbank
│   └── song_XXX_*.png     # PNG-Karten (mit QR-Code)
├── pwa/
│   ├── generate-cards.js  # PDF-Generator (Node.js)
│   ├── mxster-cards*.pdf  # Generierte PDFs (gitignored)
│   └── src/data/songs.ts  # PWA Song-Daten
├── add-song.js            # Song hinzufügen (interaktiv)
├── edit-song.js           # Song bearbeiten (Wizard)
└── generate-all-pdfs.sh   # Alle PDF-Varianten generieren
```

---

## 🔧 Technische Details

### QR-Code-Format
- **Inhalt**: Spotify-Track-URLs (`https://open.spotify.com/track/{spotifyId}`)
- **Fallback**: YouTube-URLs falls Spotify nicht verfügbar
- **Fehlerkorrektur**: Level H (30% Redundanz für beschädigte Codes)
- **Größe**: 20px Boxgröße, 8px Rand
- **Format**: PNG, schwarz auf weiß

### PNG-Karten-Spezifikationen
- **Format**: PNG-Bilder
- **Auflösung**: 300 DPI (Druckqualität)
- **Abmessungen**: Standard-Spielkartengröße
- **Layout**:
  - **Vorderseite**: Titel (groß, oben) → Künstler → Jahr
  - **Rückseite**: QR-Code (zentriert)

### PDF-Spezifikationen
- **Format**: PDF (A4)
- **Layout**: 4 Karten pro Seite
- **Varianten**:
  - Standard: Vorder-/Rückseite nebeneinander
  - Duplex: Getrennte Seiten für beidseitigen Druck
  - Farbig oder Schwarz-Weiß
- **Schnittlinien**: Gestrichelte Linien als Schnittführung

### 3D-Modell-Spezifikationen
- **Format**: SCAD (Quellcode) + STL (druckfertig)
- **Abmessungen**: Standard-Spielkartengröße
- **QR-Code**: Erhaben eingraviert (0.5mm Tiefe)
- **Dicke**: 2mm Kartenstärke
- **Details**: QR-Code pixelgenau aus PNG konvertiert

---

## 🛠️ Fehlerbehebung

### QR-Codes scannen nicht

**PDF-Karten:**
- Drucker-DPI-Einstellungen prüfen (mindestens 300 DPI)
- Ausreichende Beleuchtung beim Scannen
- Karte nicht zu stark gebogen oder verschmutzt
- QR-Code-App ausprobieren (nicht nur Kamera-App)

**3D-Karten:**
- Layer Height reduzieren (0.1mm statt 0.15mm)
- Infill auf 100% erhöhen
- QR-Code-Tiefe in SCAD-Datei anpassen
- Druckqualität in Slicer-Vorschau prüfen

### Fehlende Abhängigkeiten

**Node.js:**
```bash
cd pwa
npm install
```

**Python:**
```bash
cd card-generator
pip install --upgrade qrcode pillow
```

### PDF-Generierung schlägt fehl

```bash
# Stelle sicher, dass songs.tson existiert
ls ../docs/songs.tson

# Prüfe Node.js Version (>=18)
node --version

# Neuinstallation
cd pwa
rm -rf node_modules package-lock.json
npm install
```

### 3D-Druck-Probleme

**QR-Code unscharf:**
- Layer Height auf 0.1mm reduzieren
- Druckgeschwindigkeit reduzieren
- Filament-Flow kalibrieren

**Karte verzieht sich:**
- Heated Bed verwenden (60°C für PLA)
- Brim oder Raft aktivieren
- Erste Layer Höhe optimieren

**STL-Generierung schlägt fehl:**
- OpenSCAD installiert? `openscad --version`
- SCAD-Datei manuell in OpenSCAD öffnen
- Fehler in Konsole prüfen

---

## 📊 Workflow-Übersicht

### Kompletter Song-Hinzufügen-Workflow

```
1. Song hinzufügen
   └─> node add-song.js "SPOTIFY_URL"
       ├─> docs/songs.tson aktualisiert
       ├─> pwa/src/data/songs.ts aktualisiert
       ├─> QR-Code generiert
       ├─> PNG-Karte generiert
       └─> Optional: SCAD + STL generiert

2. PDF-Karten generieren
   └─> ./generate-all-pdfs.sh
       ├─> mxster-cards.pdf (Standard, Farbig)
       ├─> mxster-cards-bw.pdf (Schwarz-Weiß)
       ├─> mxster-cards-duplex.pdf (Duplex, Farbig)
       └─> mxster-cards-bw-duplex.pdf (Duplex, BW)

3. Drucken & Spielen
   └─> PDF ausdrucken
       ├─> Entlang Linien schneiden
       ├─> Optional: Falten & kleben
       ├─> Optional: Laminieren
       └─> Spielen! 🎉
```

---

## 🔄 Changelog

### v2.0.0 (Aktuell)
- ✅ Node.js PDF-Generator mit 4 Varianten (--bw, --duplex)
- ✅ Automatisches Skript `generate-all-pdfs.sh`
- ✅ Interaktiver Song-Editor Wizard (`edit-song.js`)
- ✅ Vereinfachtes `add-song.js` mit automatischer Generierung
- ✅ SCAD → STL Konvertierung automatisiert
- ✅ Verbesserte Dateiorganisation

### v1.2.0
- 3D-Modell-Generierung hinzugefügt
- Verbessertes Kartenlayout mit besserem Abstand
- Stapelverarbeitung für alle Songs
- Optimierte QR-Code-Fehlerkorrektur

### v1.1.0
- Druckbare PNG-Kartengenerierung
- Dateinamen-Bereinigung implementiert
- YouTube-Fallback-URLs

### v1.0.0
- Erste QR-Code-Generierung
- Basis-Kartenlayout
- Spotify-Integration

---

## 🤝 Mitwirken

Beim Hinzufügen von Funktionen:
1. ✅ Mit mehreren Song-Einträgen testen
2. ✅ QR-Codes auf korrekte Scan-Funktion prüfen
3. ✅ Druckqualität bei 300 DPI überprüfen (PDF)
4. ✅ 3D-Druck-Test mit 0.1mm Layer Height (SCAD/STL)
5. ✅ Diese README mit Änderungen aktualisieren

---

## 📄 Lizenz

Teil des mxster-Projekts. Siehe [Haupt-Repository-LIZENZ](../LICENSE).

---

## 🔗 Weitere Ressourcen

- **Haupt-README**: [../README.md](../README.md) - Vollständige Projektdokumentation
- **Live Demo**: [mxster.de](https://mxster.de)
- **GitHub Releases**: [Fertige PDFs & 3D-Modelle](https://github.com/pepperonas/mxster/releases)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/pepperonas/mxster/issues)
