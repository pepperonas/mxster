# mxster - Music Timeline Game

**Das ultimative Musikquiz!** Rate Songs, platziere sie chronologisch und teste dein Musikwissen.

[![App](https://img.shields.io/badge/Play_Now-mxster.de-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://mxster.de)
[![Version](https://img.shields.io/badge/v0.1.1-purple?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/pepperonas/mxster/releases)
[![License](https://img.shields.io/badge/MIT-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Spotify](https://img.shields.io/badge/Spotify_SDK-1DB954?style=flat-square&logo=spotify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node_18-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Howler.js](https://img.shields.io/badge/Howler.js-FF6600?style=flat-square&logo=audiomack&logoColor=white)

![Songs](https://img.shields.io/badge/Songs-211-orange?style=flat-square)
![Achievements](https://img.shields.io/badge/Achievements-24-gold?style=flat-square)
![Audio](https://img.shields.io/badge/Audio-Self--Hosted-red?style=flat-square)
![Modes](https://img.shields.io/badge/Modes-3-blue?style=flat-square)
![Bot_AI](https://img.shields.io/badge/Bot_AI-3_Levels-blueviolet?style=flat-square)
![Multiplayer](https://img.shields.io/badge/Multiplayer-Unlimited-brightgreen?style=flat-square)
[![Tests](https://github.com/pepperonas/mxster/actions/workflows/test.yml/badge.svg)](https://github.com/pepperonas/mxster/actions/workflows/test.yml)

![mxster Banner](https://mxster.de/assets/mxster.jpg)

## Schnellstart

1. Oeffne **[mxster.de](https://mxster.de)**
2. "Jetzt spielen (Gratis)" -- Passwort: `ydl`
3. Spielmodus waehlen, Spieler hinzufuegen, los!

## Spielmodi

| Modus | Ziel | Punkte |
|-------|------|--------|
| **Hardcore** | Rate Titel, Kuenstler & Jahr | Bis zu 15/Song (max 150) |
| **Timeline Persoenlich** | Eigene Timeline aufbauen | Erster mit 10 Karten gewinnt |
| **Timeline Global** | Gemeinsame Timeline | Meiste Karten nach 10 gewinnt |

**Hardcore-Scoring:** Titel +5, Kuenstler +5, Jahr exakt +5 / +/-1 +2 / +/-2 +1

## Features

- 211 Songs (Self-Hosted MP3) + optional Spotify Premium
- Fuzzy Matching, 24 Achievements, Bot-Gegner (Easy/Medium/Hard)
- PWA -- installierbar, offline-faehig, Auto-Save
- 3D Partikel-Animationen, Konfetti-Effekte, Score-Animationen

## Fuer Entwickler

```bash
git clone https://github.com/pepperonas/mxster.git
cd mxster/pwa && npm install && npm run dev
# http://localhost:5174
```

```bash
npm test                        # Integritaetstests
cd pwa && npm test              # Vitest
cd pwa && npx tsc --noEmit      # Type Check
./scripts/deployment/deploy.sh  # Deploy auf mxster.de
```

## Physische Karten (Optional)

PDF- und 3D-Druckkarten verfuegbar unter [`extras/card-generator/`](extras/card-generator/README.md) und [GitHub Releases](https://github.com/pepperonas/mxster/releases/latest).

## Lizenz

MIT -- [Martin Pfeffer](mailto:martin.pfeffer@celox.io)

---

**[mxster.de](https://mxster.de)** | [GitHub](https://github.com/pepperonas/mxster) | [Releases](https://github.com/pepperonas/mxster/releases)
