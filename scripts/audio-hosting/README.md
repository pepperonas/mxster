# Songs pflegen

mxster spielt nur eigene MP3s. Sie liegen auf dem VPS unter `/var/www/html/mxster/audio/`, die Cover unter `audio/covers/`. Beides liefert nginx nur an freigeschaltete Sitzungen aus. Lokal liegen dieselben Dateien in `pwa/public/audio/` (gitignored).

Spotify wird nirgends benutzt. Die Metadaten kommen von MusicBrainz, die Cover aus dem Cover Art Archive (Ersatz: iTunes Search API), das Audio per yt-dlp.

## Song hinzufügen

```bash
node scripts/song-management/add-song.js "a-ha" "Take on Me"
./scripts/deployment/deploy.sh web
```

Der Assistent:

1. schlägt Jahr und Album vor (MusicBrainz, frühestes Erscheinen zuerst) und lässt dich jedes Feld prüfen;
2. lädt die MP3 und das Cover, meldet eine auffällige Länge (Live-Version, Endlosschleife) und lädt beides auf den VPS;
3. schreibt `docs/songs.json` (und den Fakt nach `docs/song-facts.json`) und erzeugt daraus `pwa/src/data/songs.ts`.

Das Jahr ist das der **Erstveröffentlichung dieser Aufnahme**, nicht das eines Remasters oder einer Compilation. Ein Fakt ist ein kurzer Satz, der sicher stimmt, und nennt keine Jahreszahl, sonst verrät er die Lösung.

Optionen für beide Assistenten: `--year 1985 --album "…" --genre Pop --fact "…"` legt Felder vorab fest, `--yes` übernimmt den Vorschlag ohne Rückfragen, `--no-upload` lässt MP3 und Cover lokal.

## Song austauschen oder bearbeiten

```bash
node scripts/song-management/exchange-song.js song_123 "Interpret" "Titel"   # neuer Song unter derselben ID
node scripts/song-management/edit-song.js                                     # Titel, Interpret, Jahr, Genre korrigieren
```

## Werkzeuge

| Skript | Zweck |
|--------|-------|
| `song-management/sync-songs-ts.js` | `songs.json` + `song-facts.json` → `songs.ts`. Nie `songs.ts` von Hand schreiben, sonst fehlen die Fakten. |
| `audio-hosting/download-songs.js` | Alle fehlenden MP3s herunterladen (`--resume`, `--limit N`) |
| `audio-hosting/download-single-song.js` | Eine MP3 laden und hochladen (von den Assistenten benutzt) |
| `audio-hosting/upload-to-vps.js` | Alle lokalen MP3s per rsync auf den VPS |
| `audio-hosting/validate-audio.js` | Prüft, ob jede MP3 erreichbar ist (`--full`) |

Alles auf einmal hochladen, inklusive Cover:

```bash
rsync -a --ignore-existing pwa/public/audio/ root@69.62.121.168:/var/www/html/mxster/audio/
ssh root@69.62.121.168 'chown -R www-data:www-data /var/www/html/mxster/audio'
```

Voraussetzungen: `yt-dlp`, `rsync`, SSH-Zugang zum VPS; `ffprobe` (aus ffmpeg) für die Längenprüfung, `sips` (macOS) zum Skalieren der Cover.

Rechtlicher Hinweis: Das Herunterladen von Musik ist rechtlich heikel. mxster ist eine private, nicht-kommerzielle App, und die Dateien sind nur für freigeschaltete Konten erreichbar.
