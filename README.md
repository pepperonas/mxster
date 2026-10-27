# mxster

Song hören, Jahr raten, an die richtige Stelle der Zeitleiste legen. Ein Musikspiel für eure Runde, gespielt auf einem Gerät.

[![App](https://img.shields.io/badge/mxster.celox.io-B90C55?style=for-the-badge&logo=googlechrome&logoColor=white)](https://mxster.celox.io)
[![Version](https://img.shields.io/badge/v0.6.0-B90C55?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/pepperonas/mxster/releases)
[![Tests](https://github.com/pepperonas/mxster/actions/workflows/ci.yml/badge.svg)](https://github.com/pepperonas/mxster/actions/workflows/ci.yml)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Material 3 Expressive](https://img.shields.io/badge/Material_3-Expressive-B90C55?style=flat-square&logo=materialdesign&logoColor=white)

## Zugang

mxster ist eine private App. Man meldet sich mit einem Google-Konto an; neue Konten landen auf einer Warteliste und werden einzeln freigeschaltet. Erst danach sind Spiel und Musik erreichbar — auch die Musikdateien liefert der Server nur an freigeschaltete Sitzungen aus.

## Spielmodi

| Modus | Ziel |
|-------|------|
| **Eigene Zeitleiste** | Jede:r baut eine eigene Zeitleiste. Wer zuerst die Zielzahl an Songs richtig liegen hat, gewinnt. |
| **Gemeinsame Zeitleiste** | Alle legen an dieselbe Zeitleiste. Sobald die Zielzahl an Songs richtig liegt, gewinnt, wer die meisten davon gelegt hat. |
| **Hardcore** | Titel (+5), Interpret (+5) und Jahr (+5 exakt, +2 bei einem Jahr daneben, +1 bei zwei) raten. Wenn alle die Zielzahl an Songs gespielt haben, gewinnt die höchste Punktzahl. |

Vor jeder Runde legt ihr fest:

- **Länge:** kurz (5 Songs), normal (10) oder lang (15).
- **Jahrzehnte:** alle oder nur bestimmte, etwa nur 80er und 90er. Gehen die Songs der gewählten Jahrzehnte aus, kommen die übrigen dazu, damit die Runde nie stehen bleibt.
- **Einspruch** (Zeitleisten-Modi): Jede:r hat drei Einsprüche. Nach dem Legen bleibt die Karte verdeckt, und wer anderer Meinung ist, legt sie in eine andere Lücke. Liegt die Person am Zug falsch und der Einspruch richtig, bekommt die Einspruch-Person die Karte. Ein Einspruch kostet immer einen der drei. Bots erheben keinen Einspruch, können aber angefochten werden.
- **Exoten**: Standardmäßig aus. Eingeschaltet kommen auch kaum bekannte Songs dazu. Sind alle bekannten Songs einer Runde gespielt, kommen die Exoten trotzdem, damit die Runde weiterläuft.
- **Teams** (ab vier Personen): Ein Team teilt sich Zeitleiste, Punkte und Einsprüche, die Mitglieder wechseln sich am Zug ab. Die App verteilt zufällig, ein Tipp auf einen Namen setzt ihn ins nächste Team.

Songs aus euren letzten Runden kommen erst wieder, wenn nichts Neues mehr übrig ist; das merkt sich die App pro Konto.

Unentschieden gibt es nicht. Liegen am Ende mehrere vorne, folgt ein **Stechen**: nur sie spielen weiter, je ein Song pro Runde, bis nach einer vollen Runde genau eine:r führt. Wer zurückfällt, scheidet aus; Überspringen ist im Stechen gesperrt. In der Rangliste steht der Gewinner allein auf Platz 1, darunter teilen sich Gleichstehende einen Platz.

Allein? Dann spielen bis zu drei Bots gegen dich (leicht, mittel, schwer).

## Was drin ist

- 300 Songs von den 50ern bis heute, selbst gehostet (AAC, 96 kbit/s, höchstens vier Minuten je Song), zufällige Startstelle auf Wunsch
- Exoten: 39 kaum bekannte Songs (Club-Tracks, Remixe, Raritäten) spielen nur mit, wenn man sie beim Spielaufbau einschaltet
- Nach dem Aufdecken: Album-Cover auf dem Plattenlabel, Albumname und ein kurzes „Wusstest du?“
- Eine laufende Runde übersteht Neuladen und geschlossene Tabs: Sie wird auf dem Gerät gesichert und auf der Startseite zum Weiterspielen angeboten
- Fehlertolerante Antworten (Tippfehler, Groß- und Kleinschreibung)
- 24 Erfolge, Verlauf jeder Runde mit Rangliste und allen Songs
- **Statistik:** Runden, Songs, Trefferquote und Spielzeit; ein Jahrzehnt-Profil als Spinnennetz, in dem bis zu drei Personen nebeneinanderstehen (Trefferquote oder Herkunft der Karten je Jahrzehnt); Siege, Runden pro Woche, Spielmodi, im Hardcore-Modus die Abweichung beim Jahr, die kniffligsten und die sichersten Songs
- **Spieler:** alle Personen mit Runden, Siegen und Trefferquote; anlegen, per Stern in die Schnellauswahl des Spielaufbaus, umbenennen (ein vorhandener Name führt beide zusammen), entfernen; je Person eine eigene Seite mit Kennzahlen, Spinnennetz und Erfolgen
- Navigation: Spielen · Verlauf · Statistik · Spieler · Erfolge, das Profil hinter dem eigenen Bild
- Verlauf, Erfolge und Einstellungen hängen am Konto und sind auf jedem Gerät gleich
- PWA, installierbar, helles und dunkles Design

## Design

Trefferquoten gibt es für Runden ab v0.6.0: Erst seitdem merkt sich jede Runde auch die falschen Karten. Ältere Runden zählen für Siege und die Herkunft der Karten.

Material 3 Expressive mit einer eigenen Identität: Vinyl-Magenta als Primärfarbe, warmes Orange als Akzent. Das Herzstück ist die Schallplatte — sie dreht sich, solange der Song läuft, und zeigt nach dem Aufdecken das Jahr auf ihrem Label.

- Farben aus Seeds generiert (`pwa/scripts/gen-tokens.mjs` → `pwa/src/styles/design-tokens.css`), nirgends sonst Rohfarben
- Echte Federn (Steifigkeit + Dämpfung) als eine Quelle für JS (`motion/react`) und CSS (`linear()`-Kurven)
- Seitenwechsel über die View Transitions API, Theme-Wechsel als Kreis-Reveal
- `prefers-reduced-motion` wird überall respektiert, Touch-Ziele mindestens 48 px
- Roboto Flex selbst gehostet, keine Tracker von Drittanbietern

## Aufbau

```
pwa/      React-19-PWA (Vite, Tailwind, motion)
server/   FastAPI + SQLite: Google-Login, Warteliste, Admin, Spieldaten, Audio-Freigabe
docs/     songs.json — die Songdatenbank (Quelle der Wahrheit)
scripts/  Songs verwalten, Audio hosten, Deployment
```

## Entwicklung

```bash
# Backend (Port 4274)
cd server && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env            # MX_DEV_LOGIN=true für lokale Tests ohne Google
.venv/bin/uvicorn app.main:app --port 4274 --reload

# Frontend (Port 5174, leitet /api an das Backend weiter)
cd pwa && npm install && npm run dev
# lokal anmelden: http://127.0.0.1:5174/api/auth/dev-login?email=…&name=…

# Tests
cd server && .venv/bin/python -m pytest -q
cd pwa && npx tsc --noEmit && npx vitest run
npm test                         # Songdaten-Integrität (Repo-Wurzel)
```

## Songs pflegen

```bash
node scripts/song-management/add-song.js "a-ha" "Take on Me"   # schlägt Jahr und Album vor, lädt Audio und Cover
./scripts/deployment/deploy.sh web
```

Daten kommen von MusicBrainz, dem Cover Art Archive und iTunes; Spotify wird nicht benutzt. Details, Austauschen und Bearbeiten: [`scripts/audio-hosting/README.md`](scripts/audio-hosting/README.md).

## Deployment

```bash
./scripts/deployment/deploy.sh        # API und Web-App
./scripts/deployment/deploy.sh api    # nur Backend
./scripts/deployment/deploy.sh web    # nur PWA
```

Einmalig auf dem Server: Geheimnisse in `/opt/mxster-api/.env` (Vorlage `server/.env.example`) und die nginx-Locations aus `server/deploy/nginx-locations.conf`.

Der Google-OAuth-Client (Typ Webanwendung) braucht die Weiterleitungs-URI `https://mxster.celox.io/api/auth/callback`. Solange der Zustimmungsbildschirm im **Testmodus** steht, lässt Google nur die dort eingetragenen Testnutzer durch – alle anderen scheitern schon bei Google und erreichen die Warteliste nie. Für den Betrieb also unter „Zielgruppe“ die App veröffentlichen (für `openid email profile` ohne Prüfung).

## Lizenz

MIT
