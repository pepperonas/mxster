# Testing Scripts

Scripts für Entwicklung und Testing der mxster PWA.

**Wichtig**: Alle Scripts verwenden die korrekten localStorage Keys:
- `mxster_settings` - Einstellungen
- `mxster_achievements` - Achievements
- `mxster_history` - Spielhistorie
- `mxster_game_state` - Aktueller Spielstand

## 1. unlock-all-achievements.js

**Zweck**: Schaltet Achievements für 2 Testplayer frei (m und n).

**Spieler**:
- **Player "m"**: ALLE 10 Achievements freigeschaltet (100%)
- **Player "n"**: 5 Achievements freigeschaltet, 5 gesperrt mit Progress (50%)

**Verwendung**:
1. Dev-Server starten: `npm run dev`
2. Browser öffnen: http://localhost:5174
3. Browser Console öffnen (F12)
4. Script-Inhalt komplett kopieren und in Console einfügen
5. Enter drücken
6. Seite lädt automatisch neu nach 2 Sekunden

**Nach dem Reload**:
- Klicke auf 🏆 Icon in der ActionBar
- Du siehst Player "m" mit "10 / 10" und "🎉 Alle Achievements freigeschaltet!"
- Wechsel zu Player "n" im Dropdown - siehst 5 freigeschaltet, 5 mit Black Mask

**Hinweis**: Löscht ALLE bestehenden Daten!

---

## 2. generate-game-history.js

**Zweck**: Generiert 100 realistische Spiele mit 3 Spielern für Statistik-Tests.

**Spieler**:
- **Player "m"**: 80% Skill - Bester Spieler (höchste Winrate)
- **Player "n"**: 60% Skill - Mittlerer Spieler
- **Player "o"**: 40% Skill - Schwächster Spieler

**Was generiert wird**:
- 100 Spiele über 60 Tage verteilt
- Zufällige Game Modes (Hardcore, Timeline Personal, Timeline Global)
- Zufällige Player-Kombinationen (2-3 Spieler pro Game)
- Realistische Scores basierend auf Skill-Level
- Spielhistorie für alle Spieler
- Achievements basierend auf Performance
- Spielerdauer: 10-45 Minuten pro Spiel

**Verwendung**:
1. Dev-Server starten: `npm run dev`
2. Browser öffnen: http://localhost:5174
3. Browser Console öffnen (F12)
4. Script-Inhalt komplett kopieren und in Console einfügen
5. Enter drücken
6. Seite lädt automatisch neu nach 2 Sekunden

**Nach dem Reload**:
- Klicke auf 📈 Icon (Player Stats) - siehst realistische Statistiken
- Klicke auf 📊 Icon (Game History) - siehst 100 Spiele
- Klicke auf 🏆 Icon (Achievements) - siehst unterschiedlich viele Achievements pro Spieler

**Ausgabe in Console**:
```
Player "m":
  Games: ~67 | Wins: ~40 (60%) | Achievements: 8-10/10
Player "n":
  Games: ~66 | Wins: ~25 (38%) | Achievements: 5-7/10
Player "o":
  Games: ~67 | Wins: ~12 (18%) | Achievements: 3-5/10
```

**Hinweis**: Löscht ALLE bestehenden Daten! Perfekt zum Testen der Statistik-Anzeige.

---

## 3. debug-state.js

**Zweck**: Debuggt Achievement-State (localStorage vs React State).

**Verwendung**:
1. Nach dem Ausführen eines der obigen Scripts
2. BEVOR die Seite neu lädt, Script in Console einfügen
3. Zeigt detaillierte Info über localStorage-Inhalt

**Ausgabe**:
- Welche Spieler in Settings vorhanden sind
- Welche Spieler Achievements haben
- Wie viele Achievements freigeschaltet sind
- Einzelne Achievement-Status

**Hinweis**: Diagnostik-Tool, ändert keine Daten.

---

## 4. debug-localstorage.js

**Zweck**: Zeigt ALLE localStorage Keys und ihre Größen an.

**Verwendung**:
1. Browser Console öffnen (F12)
2. Script-Inhalt kopieren und einfügen
3. Enter drücken

**Ausgabe**:
- Liste aller localStorage Keys
- Größe jedes Keys in KB
- Typ der Daten (Array, Object, String)
- Prüft ob erwartete Keys existieren
- Zeigt erste Elemente von Arrays

**Hinweis**: Perfekt zum Debuggen von localStorage-Problemen.

---

## 5. test-simple-history.js

**Zweck**: Erstellt minimale Testdaten für schnelles Testing.

**Verwendung**:
1. Browser Console öffnen (F12)
2. Script-Inhalt kopieren und einfügen
3. Enter drücken

**Was wird erstellt**:
- 1 einfaches Testspiel mit 2 Spielern (Alice, Bob)
- Schnelle Verifikation, dass der Datenfluss funktioniert

**Ausgabe**:
- Bestätigung, dass Daten gespeichert wurden
- Anweisung zum Öffnen des Player Stats Dialogs

**Hinweis**: Perfekt für schnelles Debugging der Statistik-Anzeige.
