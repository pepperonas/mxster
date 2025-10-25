# Szenarien-Checkliste

## ✅ Bereits geprüft/gefixt in dieser Session:
1. ✅ Rick Roll Starter-Song entfernt - Spieler starten mit 0 Karten
2. ✅ Jahres-Toleranz auf exakt (±2 → 0)
3. ✅ Timeline-Platzierung bei gleichem Jahr funktioniert
4. ✅ Gewinner-Berechnung im Guess-Modus korrekt (höchster Score)
5. ✅ Gewinner-Berechnung in Timeline-Modi korrekt (erste 10 Karten)
6. ✅ ShareResults teilt korrekten Gewinner
7. ✅ Spielername wird im "Karte platzieren" Dialog angezeigt
8. ✅ Taschenlampen-Toggle für QR-Scanner funktioniert

## 🤔 Potenzielle Edge Cases (zu prüfen):
1. ❓ Was passiert wenn 2 Spieler im Guess-Modus gleichen Score haben?
2. ❓ Was passiert wenn alle Spieler 0 Punkte haben?
3. ❓ Funktioniert Spielstand-Speicherung nach Page Refresh?
4. ❓ Können Spieler mit 0 Karten einen Gewinner haben?
5. ❓ Gibt es Memory Leaks beim Scanner (stop/destroy)?
6. ❓ Funktioniert die Timeline wenn nur 1 Karte vorhanden ist?
7. ❓ Kann man mehr als 10 Karten bekommen?
8. ❓ GitHub Release System - funktioniert es manuell?
