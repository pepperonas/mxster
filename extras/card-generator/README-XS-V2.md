# XS-V2 Multi-Color Flat Card Generator

Generator für flache XS-Karten mit eingebetteten Farbinformationen im 3MF-Format für Multi-Material-Druck.

## Übersicht

XS-V2 ist eine alternative Version des XS-Generators, die einen **komplett anderen Ansatz** verwendet:

| Feature | XS (V1) | XS-V2 |
|---------|---------|-------|
| **Oberfläche** | Erhaben (embossed) | Komplett flach |
| **Farbdefinition** | Manuell im Slicer | Eingebettet in 3MF |
| **Export-Format** | STL | 3MF |
| **QR-Code/Text** | 3D-Erhöhungen | 2D-Farbbereiche |
| **Verwendung** | Einzelmaterial + Pause | Multi-Material direkt |

## Technischer Ansatz

### XS (V1): Erhöhte Bereiche
```openscad
union() {
    card_base();
    linear_extrude(height=0.36) qr_code();  // Erhaben
    linear_extrude(height=0.36) text();      // Erhaben
}
```

### XS-V2: Flache Farbbereiche
```openscad
color("white") card_base();                  // Weiße Basis
color("black") linear_extrude(0.02) qr_2d(); // Schwarzer QR (flach)
color("black") linear_extrude(0.02) text();  // Schwarzer Text (flach)
```

## Dimensionen

Identisch mit XS (V1):
- **Länge**: 42.8mm (50% von 85.6mm)
- **Breite**: 26.99mm (50% von 53.98mm)
- **Höhe**: 0.96mm (60% von 1.6mm)
- **Eckradius**: 1.25mm (50% von 2.5mm)

**Farbschicht-Dicke**: 0.02mm (minimal, aber für Slicer sichtbar)

## Dateistruktur

```
card-generator/
├── generateCard-xs-v2.js         # Hauptskript
├── qrToScad2D.js                 # 2D QR-Muster-Generator
├── test-xs-v2-generator.js       # Test-Skript
└── output/
    ├── qr-codes-xs-v2/           # QR-Code PNGs
    └── models-xs-v2/             # 3MF + SCAD Dateien
        ├── *.scad                # OpenSCAD Quellcode
        └── *.3mf                 # 3MF mit Farbinformationen
```

## Verwendung

### Manueller Aufruf

```javascript
import { generateCardXSV2, generate3MF } from './generateCard-xs-v2.js'

const song = {
  id: "song_001",
  title: "Bohemian Rhapsody",
  artist: "Queen",
  year: 1975,
  spotifyId: "4u7EnebtmKWzUH433cf5Qv"
}

// Generiere XS-V2 Karte
const result = await generateCardXSV2(song)

// Generiere 3MF (benötigt OpenSCAD CLI)
await generate3MF(result.scadPath)
```

### Test-Skript

```bash
cd card-generator
node test-xs-v2-generator.js
```

Generiert Test-Karte für "Never Gonna Give You Up" von Rick Astley.

## 3MF Format & Farben

### Was ist 3MF?

3MF (3D Manufacturing Format) ist ein modernes 3D-Dateiformat, das Farbinformationen nativ unterstützt. Im Gegensatz zu STL kann 3MF:
- Mehrere Objekte mit unterschiedlichen Farben speichern
- Materialinformationen einbetten
- Direkt von Slicern erkannt werden

### Farbdefinition in OpenSCAD

```openscad
// Basis-Karte (weiß)
color("white")
    card_base();

// QR-Code (schwarz, Oberseite)
color("black")
    translate([x, y, card_height - 0.01])
        linear_extrude(height = 0.02)
            qr_code_pattern_2d(size);

// Text (schwarz, Unterseite)
color("black")
    translate([x, y, -0.01])
        linear_extrude(height = 0.02)
            mirror([1,0,0])
                text(...);
```

### Wichtige Z-Positionen

- **Basis-Karte**: z=0 bis z=0.96mm
- **QR-Code**: z=0.95mm bis z=0.97mm (knapp über Oberfläche)
- **Text**: z=-0.01mm bis z=0.01mm (knapp unter Unterseite)

**Warum 0.02mm Dicke?**
- Nicht 0mm → sonst unsichtbar
- Nicht 0.4mm → wäre voller Layer
- 0.02mm → dünn genug für Farbe, dick genug für Slicer-Erkennung

## Im Slicer (PrusaSlicer / Bambu Studio)

### Erwartetes Verhalten beim Öffnen der 3MF-Datei:

1. **Automatische Objekterkennung**:
   - 3 separate Volumes/Parts werden angezeigt
   - Objekt 1: "card_base" (weiß)
   - Objekt 2: "flat_qr_code" (schwarz)
   - Objekt 3: "flat_text" (schwarz) - kombiniert year/title/artist

2. **Farbzuweisung**:
   - PrusaSlicer: Automatisch zu Extrudern 1 & 2
   - Bambu Studio: Automatisch zu AMS-Slots
   - Manuell änderbar bei Bedarf

3. **Schicht-Ansicht**:
   - Karte ist komplett flach (nur 0.96mm hoch)
   - Farbwechsel sichtbar an entsprechenden Positionen
   - Keine Erhöhungen/Vertiefungen

### Druck-Einstellungen

**Empfohlene Einstellungen**:
- **Layer Height**: 0.12mm oder 0.16mm
- **Infill**: 20%
- **Support**: Nicht nötig (flache Karte)
- **Brim/Raft**: Optional für bessere Haftung

**Multi-Material Settings**:
- **Purge Tower**: Ja (für saubere Farbwechsel)
- **Interface Layers**: 0 (alles ist flach)
- **Wipe Distance**: Standard

## Vorteile & Nachteile

### Vorteile XS-V2

✅ **Automatische Farben**: Keine manuelle Slicer-Arbeit
✅ **Schnellerer Druck**: Keine Erhöhungen = weniger Druckzeit
✅ **Weniger Material**: Keine zusätzlichen Layer für Erhöhungen
✅ **Perfekte Farbübergänge**: Flush mit Oberfläche
✅ **Ideal für MMU/AMS**: Optimiert für Multi-Material-Systeme
✅ **Wiederverwendbar**: 3MF kann gespeichert und geteilt werden

### Nachteile XS-V2

❌ **QR-Code-Scan**: Eventuell schwerer scanbar (kein Relief)
❌ **Taktile Qualität**: Text nicht fühlbar
❌ **Präzision nötig**: Farbwechsel muss exakt sein
❌ **Slicer-Abhängig**: Nicht alle Slicer unterstützen embedded colors perfekt
❌ **Multi-Material nötig**: Benötigt 2+ Extruder/AMS

## Vergleich: Wann welche Version?

### Verwende XS (V1) wenn:
- Du **einen Drucker** hast (Einzelmaterial + Farbwechsel-Pause)
- Du **taktile Karten** möchtest (fühlbarer QR-Code/Text)
- Du **bessere Scanbarkeit** brauchst (QR-Code erhaben)
- Du **manuellen Workflow** bevorzugst (mehr Kontrolle im Slicer)

### Verwende XS-V2 wenn:
- Du **Multi-Material-Drucker** hast (MMU2, AMS, IDEX)
- Du **schnellere Drucke** brauchst
- Du **automatisierten Workflow** bevorzugst
- Du **perfekt flache Karten** möchtest
- Du **viele Karten** drucken willst (effizienter)

## Troubleshooting

### Problem: 3MF zeigt nur weiße Karte im Slicer

**Ursache**: Slicer erkennt Farben nicht
**Lösung**:
1. Prüfe OpenSCAD-Version (muss `color()` unterstützen)
2. Öffne `.scad` direkt in OpenSCAD → "Export → 3MF"
3. Verwende neueste Slicer-Version (PrusaSlicer 2.6+, Bambu Studio 1.7+)

### Problem: QR-Code nicht scanbar nach Druck

**Ursache**: Zu wenig Kontrast oder Präzision
**Lösung**:
1. Verwende **schwarz/weiß** Filament (hoher Kontrast)
2. Drucke mit **0.12mm Layer Height** (feiner)
3. Aktiviere **0.25mm Nozzle** (wenn verfügbar)
4. Erhöhe **Purge Tower Volume** (saubere Wechsel)

### Problem: Text nicht lesbar

**Ursache**: Zu klein oder verschwommen
**Lösung**:
1. **Resin-Druck** verwenden (höhere Auflösung)
2. **Größere Version** drucken (Standard statt XS)
3. **Dickere Farbschicht**: Ändere `color_layer_thickness = 0.02` → `0.1`

### Problem: Farbwechsel ungenau

**Ursache**: Purge-Einstellungen
**Lösung**:
1. **Purge Tower** aktivieren
2. **Wipe Distance** erhöhen
3. **Retraction** optimieren
4. **Filament Temperature** kalibrieren

## Beispiel-Output

**Test-Song**: Rick Astley - Never Gonna Give You Up (1987)

**Generierte Dateien**:
```
song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS-V2.png  (7.2KB)
song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS-V2.scad (56KB)
song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS-V2.3mf  (49KB)
```

**SCAD Header**:
```openscad
// mxster Game Card XS-V2 (Flat Multi-Color) - Never Gonna Give You Up
// XS-V2: 50% width/length, 60% height, flat surface with embedded colors in 3MF

card_length = 42.8;   // 50% of 85.6mm
card_width = 26.99;   // 50% of 53.98mm
card_height = 0.96;   // 60% of 1.6mm
color_layer_thickness = 0.02; // 0.02mm
```

**SCAD Assembly**:
```openscad
// White base card
color("white")
    card_base();

// Black QR code on top surface (back side)
color("black")
    flat_qr_code();

// Black text on bottom surface (front side)
color("black") {
    flat_year();
    flat_title();
    flat_artist();
}
```

## Zukünftige Erweiterungen

Mögliche Verbesserungen:

- [ ] **Mehr Farben**: 3+ Farben für Jahr/Titel/Artist
- [ ] **Variable Schichtdicke**: Anpassbar per Parameter
- [ ] **CLI-Interface**: Batch-Generierung
- [ ] **Farb-Vorlagen**: Vordefinierte Farbschemas
- [ ] **Automatische QR-Test**: Scanbarkeitsprüfung
- [ ] **Slicer-Integration**: Direkter Export zu Slicer

---

**Version**: 1.0
**Erstellt**: 2025-11-02
**Autor**: Generiert für mxster Projekt
**Kompatibilität**: OpenSCAD 2021.01+, PrusaSlicer 2.6+, Bambu Studio 1.7+
