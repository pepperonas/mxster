# mxster

Song hören, Jahr raten, an die richtige Stelle der Zeitleiste legen. Ein Musikspiel für eure Runde, gespielt auf einem Gerät.

[![App](https://img.shields.io/badge/mxster.celox.io-B90C55?style=for-the-badge&logo=googlechrome&logoColor=white)](https://mxster.celox.io)
[![Version](https://img.shields.io/badge/v0.4.0-B90C55?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/pepperonas/mxster/releases)
[![Tests](https://github.com/pepperonas/mxster/actions/workflows/ci.yml/badge.svg)](https://github.com/pepperonas/mxster/actions/workflows/ci.yml)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Material 3 Expressive](https://img.shields.io/badge/Material_3-Expressive-B90C55?style=flat-square&logo=materialdesign&logoColor=white)

## Zugang

mxster ist eine private App. Man meldet sich mit einem Google-Konto an; neue Konten landen auf einer Warteliste und werden einzeln freigeschaltet. Erst danach sind Spiel und Musik erreichbar — auch die MP3-Dateien liefert der Server nur an freigeschaltete Sitzungen aus.

## Spielmodi

| Modus | Ziel |
|-------|------|
| **Eigene Zeitleiste** | Jede:r baut eine eigene Zeitleiste. Wer zuerst zehn Songs richtig liegen hat, gewinnt. |
| **Gemeinsame Zeitleiste** | Alle legen an dieselbe Zeitleiste. Sobald zehn Songs richtig liegen, gewinnt, wer die meisten davon gelegt hat. |
| **Hardcore** | Titel (+5), Interpret (+5) und Jahr (+5 exakt, +2 bei einem Jahr daneben, +1 bei zwei) raten. Nach zehn Songs gewinnt die höchste Punktzahl. |

Unentschieden gibt es nicht. Liegen am Ende mehrere vorne, folgt ein **Stechen**: nur sie spielen weiter, je ein Song pro Runde, bis nach einer vollen Runde genau eine:r führt. Wer zurückfällt, scheidet aus; Überspringen ist im Stechen gesperrt. In der Rangliste steht der Gewinner allein auf Platz 1, darunter teilen sich Gleichstehende einen Platz.

Allein? Dann spielen bis zu drei Bots gegen dich (leicht, mittel, schwer).

## Was drin ist

- 211 Songs als selbst gehostete MP3s, zufällige Startstelle auf Wunsch
- Fehlertolerante Antworten (Tippfehler, Groß- und Kleinschreibung)
- 23 Erfolge, Verlauf jeder Runde mit Rangliste und allen Songs
- Verlauf, Erfolge und Einstellungen hängen am Konto und sind auf jedem Gerät gleich
- PWA, installierbar, helles und dunkles Design

## Design

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
scripts/  Songs verwalten, MP3s hosten, Deployment
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
