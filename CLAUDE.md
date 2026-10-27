# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mxtape** is a private music timeline game, played on one device by a group: hear a song, guess its year, place it on a timeline. Since v0.4.0 it is **sign-in only** (Google), new accounts wait for approval, and play is **virtual only** — physical QR cards, the card generator and Spotify were removed for good.

**Current version**: v0.8.0 (2026-10) — renamed from **mxster** to **mxtape** (see "Rename" under Deployment). v0.7.2: room links (QR code) always load from the network, so an older cached app no longer sends them to the start page. v0.7.1: snapshots hide the year before the reveal, stored online results are checked. v0.7.0: multiplayer: everyone on their own device, in one room or remote; guests by link without an account; friends and invitations. v0.6.4: where a card sits is shown as a picture: position strip in the dock, coloured neighbour years on the board. v0.6.3: placed cards stay visible while an objection is open (per-song layout ids). v0.6.2: people who only have achievements (never finished a round) are listed in the player management and can be removed. v0.6.1: the account holder shows the Google picture in the player screens. v0.6.0: statistics tab (spider web per decade), player management, turn log per round. v0.5.1: audio as AAC (.m4a), exotics off by default, song_104 removed. v0.5.0: resume after reload, Einspruch, decades + recent-song avoidance, round length, teams, song info (cover/album/fact). v0.4.0: login + approval queue, server-side account data, frontend redesign (Material 3 Expressive, "vinyl magenta").
**Song database** (300 songs, 1950s–2020s; 39 marked `exotic: true` — little-known club tracks, remixes, rarities; drawn only when the round option „Exoten“ is on): source of truth `docs/songs.json` (with `album`), facts in `docs/song-facts.json`; both are merged into `pwa/src/data/songs.ts` by `node scripts/song-management/sync-songs-ts.js` (never edit songs.ts by hand). Covers live next to the audio files as `audio/covers/<id>.jpg` (gitignored locally, gated by nginx like the audio). Song data comes from MusicBrainz / Cover Art Archive — **no Spotify anywhere**; the old `spotifyId` values are only kept as stable keys, new songs have none.
**Live**: https://mxtape.celox.io (VPS 69.62.121.168)

### Key Technologies
- **Frontend** (`pwa/`): React 19 + TypeScript + Vite 5 + Tailwind 3.4, `motion` (motion.dev, `m.*` via LazyMotion), react-router 7 data router, Howler.js, vite-plugin-pwa
- **Backend** (`server/`): FastAPI + SQLAlchemy 2 + SQLite (WAL), uvicorn, systemd `mxtape-api` on 127.0.0.1:4274
- **Auth**: server-side Google OAuth (code flow + PKCE), httpOnly session cookie `mx_session`, CSRF header `X-CSRF-Token`
- **Tests**: Vitest + Testing Library (pwa), pytest (server), `test-integrity.js` (song data, repo root)

## Versioning

SemVer with auto-increment (after x.y.9 → x.(y+1).0). Version lives in `pwa/package.json` and `VERSION` in `pwa/src/screens/ProfileScreen.tsx` — keep both in sync.

## Development Commands

```bash
# Backend (needs server/.env, see server/.env.example; MX_DEV_LOGIN=true locally)
cd server && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 4274 --reload
cd server && .venv/bin/python -m pytest -q

# Frontend (http://127.0.0.1:5174, proxies /api → 4274)
cd pwa && npm run dev
cd pwa && npx tsc --noEmit && npx vitest run
cd pwa && npx vitest run -t "name substring"
cd pwa && npm run tokens           # regenerate palettes from SEEDS in scripts/gen-tokens.mjs
cd pwa && npm run tokens:check     # fails if design-tokens.css drifted

# Local sign-in without Google (refused in prod):
#   http://127.0.0.1:5174/api/auth/dev-login?email=martinpaush@gmail.com&name=Martin%20Pfeffer
# Use 127.0.0.1 consistently (cookie host + PUBLIC_URL in server/.env).

# Song data integrity (repo root)
npm test

# Deploy
./scripts/deployment/deploy.sh [all|api|web]
```

### Song Management / Audio Hosting
```bash
node scripts/song-management/add-song.js "Artist" "Title"            # lookup → check fields → audio + cover → upload → songs.json (--exotic marks a deep cut)
node scripts/song-management/exchange-song.js song_123 "Artist" "Title"  # new song under the same id
node scripts/song-management/edit-song.js                              # fix title/artist/year/genre
node scripts/song-management/sync-songs-ts.js                          # songs.json + song-facts.json → pwa/src/data/songs.ts
# flags for add/exchange: --year --album --genre --fact --yes --no-upload; deploy web afterwards
cd scripts/audio-hosting && node download-songs.js && node upload-to-vps.js && node validate-audio.js --full   # details: scripts/audio-hosting/README.md
```
**Audio format** (since v0.5.1): AAC-LC 96 kbit/s `.m4a`, cut at 4:00 with a 3 s fade, no metadata, `+faststart` — one place: `scripts/audio-hosting/encode.js` (`encodeForGame`, also a CLI that converts any leftover source file). The cut is safe because the random start lies within the first 2:30 (`RANDOM_START_MAX_S`). Collection: 300 files, ~790 MB (was 1.3 GB as 128 kbit/s MP3). nginx must map `m4a` to `audio/mp4` (the `/audio/` location sets its own `types`). `audioSrc()` maps old `.mp3` URLs from rounds saved before v0.5.1 to `.m4a`.
Audio files and covers live on the VPS in `/var/www/html/mxtape/audio/` (+ `audio/covers/`, never touched by the web deploy) and locally in the gitignored `pwa/public/audio/` (served by Vite in dev, unauthenticated). Upload new files with rsync (`rsync -a pwa/public/audio/ root@69.62.121.168:/var/www/html/mxtape/audio/`, then `chown -R www-data:www-data`).

## Architecture

### Access model (server/)
- `GET /api/auth/login` → Google → `GET /api/auth/callback`: ID token checked (`aud`, `iss`, `exp`, `email_verified`), user upserted. **New users start `pending`** and trigger a mail to `NOTIFY_EMAIL`; addresses in `MXTAPE_ADMIN_EMAILS` (martinpaush@gmail.com) are approved on the spot and can never be locked out.
- Statuses: `pending | approved | rejected | blocked`. Reject/block delete the user's sessions.
- `GET /api/session` → `{me: … | null}` (the client's source of truth, 200 even when signed out); `GET /api/me` (401 when signed out).
- `/api/admin/*` answers **404** to everyone but admins (existence not revealed); every decision is logged in `admin_actions`.
- `GET|PUT /api/data/{history|achievements|settings}`, `DELETE /api/data`: per-account JSON documents with optimistic versioning (stale PUT → 409 + current document), 512 KB cap. Only for `approved`.
- `GET /api/auth/audio-check` → 204/401: nginx `auth_request` target, so `/audio/` is only served to approved sessions.
- Rate limit per IP on login/callback; `X-Real-IP` is trusted only from 127.0.0.1.
- Mail: SMTP (`SMTP_*`) or `SENDMAIL_PATH`; both empty = no-op. Sent in a background thread.

### Frontend flow
`App.tsx`: `MotionProvider → AuthProvider → AuthGate → AppProviders → AppShell → route`.
- `auth/AuthGate.tsx`: loading / offline / login / waiting room (pending, polls every 30 s + on tab focus) / closed door (rejected, blocked) / app. Nothing below the gate (incl. audio) loads before approval. A 401 or `not_approved` from any API call fires `mx:session-lost` and the gate re-checks.
- Routes: `/` Home, `/neu` Setup, `/spiel` Game (full screen, no nav), `/verlauf`, `/verlauf/:id`, `/statistik`, `/spieler`, `/spieler/:name`, `/erfolge` (`?spieler=` preselects a person), `/profil`, `/admin`.
- `shell/AppShell.tsx`: bottom navigation bar (compact) / rail (≥ md) for five destinations — Spielen · Verlauf · Statistik · Spieler · Erfolge (the M3 maximum); the profile sits behind the avatar (top bar on phones, foot of the rail) and still counts as top level. Sub-pages use `SubPageHeader`.
- `auth/AuthGate.tsx`: the `loading` state renders outside `AnimatePresence`. With `mode="wait"` the empty loading frame had to finish an exit animation first, and roughly one load in ten never got past it (blank page, prod build too).

### State
- `GameContext` — mode, players, turn, current song, global timeline, played songs, skips, round options (`goal`, `decades`, `challengesEnabled`) and the turn state (`reveal`, `pending`, `finished`, `startedAt`, `rankingsHistory`). `rematch()` keeps players + options. **Persistence:** every change of a started, unfinished round is written to `localStorage.mxster_running_game` (`game/savedGame.ts`, max 3 days) and restored on start, so a reload resumes mid-turn without double credits; Home offers "Weiterspielen"/"Verwerfen". Reveal and pending placement must stay in the context for exactly that reason.
- `SettingsContext` also holds `recentSongs` (last 150 song keys, merged across devices) — `game/songPool.ts` draws fresh songs first.
- `GameHistoryContext`, `AchievementContext`, `SettingsContext` — stored on the server through `sync/useSyncedDoc.ts`: load once, debounced versioned writes, conflict → `sync/merge.ts` (history = union by id; achievements = unlocked wins, earliest unlock, max progress/stats; settings = local wins, saved players united). On an account's first load the old localStorage keys (`mxster_game_history`/`mxster_history`, `mxster_achievements`, `mxster_settings`) are adopted once, uploaded and removed. Saves wait until the document has loaded.
- Theme is additionally mirrored to `localStorage.mxster_theme` for the pre-paint script in `index.html`.
- `UIContext` — modals (keyed, `closeModal(): Promise`), toasts (optional `action`, e.g. undo).
- Achievements are keyed by **player name**; the account holder plays as his first name (`game/owner.ts`).

### Game loop (`src/game/`)
`useTurnFlow` is an explicit phase machine — `idle → placing` (timeline modes) / `guessing` (hardcore) `→ revealed → next turn | over`. Rules are pure modules: `placement.ts`, `guess.ts` (5/5/5-2-1), `skipRules.ts`, `achievementRules.ts`. Timeline modes credit a correct card on placement and check the win on continue; hardcore credits card + points on continue. **No draws:** if the end condition is met with a shared lead, `game/tiebreak.ts` runs a tiebreak ("Stechen") — only the tied players play, one song each per round in seat order, until exactly one leads after a full round; no skipping during it. State: `GameContext.tiebreak` (turn order honours it). Rankings share places for equal standings below the winner (`rankPlayers`, used by GameOver and history). Known gap: if all 211 songs are used up mid-tiebreak, `drawSong` returns null and the game cannot continue. Songs are drawn by a human tap (also for bots); bots then play through `placeCard`/`submitGuess`.

Round options and their rule modules (all pure, tested in `game/__tests__/roundOptions.test.ts`):
- `roundEnd.ts` — `isRoundOver(players, mode, goal)`; goal 5/10/15. Personal: anyone reaches the goal (a challenge can put a card on someone not on turn).
- `songPool.ts` — decade filter (empty = all), no repeats within a round, recent songs avoided; widens to all decades instead of stalling.
  Exotics (`song.exotic`) are out unless the round option `exotics` is on (`catalogue()`); they are the last resort only after every well-known song is used up (toast says so).
- `challenge.ts` — Einspruch: 3 per player/team per round, timeline modes only, never by bots, not on a first card, not in a tiebreak. Flow phase `challenge` (`pending` in context): `startChallenge(seat)` → `claimGap(gap)` or `revealPlacement()`. Placer right → placer gets the card; placer wrong + challenger right → challenger gets it (own timeline / credited on the shared one); the objection is spent either way.
- `teams.ts` — a team is a `Player` with `members` + `memberTurn`; `NEXT_TURN` advances the member. Achievements are never credited to teams. Teams from 4 people, no bots.

Board: `components/game/TimelineBoard.tsx` + `PlacementDock.tsx` — the dock card and the card on the board share a layoutId **per song** (`pendingCardLayoutId(song.id)`). Never a constant id: the card revealed last turn stayed registered under it, and when the next card was placed Motion hid the old one (opacity 0, stacked behind) — the board looked empty exactly when someone wanted to object (pinned in `layoutIds.test.ts`). Placement flow: (drag or tap a gap → preview → confirm; `game/boardGeometry.ts`). **Never render the year of a pending card.** Where a waiting card sits: `PositionStrip` in the dock (confirm, objection offer, objection confirm) draws `[year before] — [?] — [year after]` in the poster type (`früher`/`später` at the ends, years blurred with „Jahre verdecken“, the `gapLabel` sentence is its accessible name); on the board the two neighbours' year chips take the slot's colour (primary for the placed card, tertiary for an objection preview) and the waiting card shows a poster „?“. A wrong card's result names where it belonged (`correctGapIndices` → "Richtig wäre: …").

Mobile placing (below `lg`, 1024 px):
- While a song is on the platter the `Turntable` renders `compact` — a sticky bar under the header (small record, whose turn, progress, play/pause). It is the same component instance, so audio is untouched; the record is a shared element (`layoutId="turntable-record"`). The left grid column is `max-lg:contents` so the bar can stick across the board.
- When placing (or objecting) starts, the page scrolls the board right under the sticky bar.
- Drag auto-scroll (`PlacementDock` DragStage): the card starts inside the dock, i.e. inside the bottom edge zone — scrolling is only armed after the card has left the dock, never while it is over the dock, and only after it rests 350 ms at an edge (aiming at a gap right above the dock must not run the page away). Edges are measured from our own element ref: Motion's `onDragStart` event target is a window-level node, `event.target.closest()` finds nothing.
- Autoplay blocked (always after a reload on phones): the player waits `paused`, starts on Howler's next `unlock` (first tap), and the bar says "Zum Abspielen tippen" with a pulsing play button — no toast.

### Multiplayer (online rooms)
**The host's device runs the game, the server only relays.** No game rule exists in Python.
- **Server** (`server/app/api/rooms.py`, `rooms_hub.py`, `friends.py`): tables `rooms` (status lobby → running → finished/closed, music `room|everyone`, options, latest snapshot + `rev`, expires 12 h after the last activity), `room_members` (seat; account `user_id` or guest name + **hash** of the seat token), `friendships` (one row per pair, a < b, pending until the other side accepts), `room_invites`. Codes: 8 chars Crockford base32, typing is forgiven (case, dashes, I/L→1, O→0). Max 10 seats, no new joins after the start, rejoining one's seat always works while the room is open, the host may remove people in the lobby.
- **Guests**: `POST /api/rooms/{code}/join {name}` without a session sets the httpOnly cookie `mx_guest` (signed `{room code, seat token}`, 14 h). `audio-check` lets a guest through while their room is `lobby|running` — that is how guests hear the music. A guest cookie only ever opens its own room.
- **WebSocket** `/api/rooms/{code}/ws`: auth by session or guest cookie, `Origin` must equal `PUBLIC_URL` (missing Origin is refused), one socket per seat (a new one replaces the old with close code 4000). Messages: host → `state {snapshot}` (stored, `rev`+1, relayed) and `audio {songId, playing, positionMs}` (server stamps `at`), players → `intent {action,…}` (server overwrites `seat` with the sender's real seat and hands it to the host only; `host_offline` error if the host is not connected), everyone → `ping` → `pong {t, server}`. Seats are re-checked on state/audio/intent at most every 10 s (`RECHECK_S`) — a blocked account, signed-out session or kick loses the socket. **One uvicorn worker is a hard requirement** (the hub lives in memory).
- **nginx**: `location ^~ /api/rooms` — **no trailing slash**, with one nginx answers `POST /api/rooms` with a 301 and creating a room fails — with `Upgrade`/`Connection $connection_upgrade` and `proxy_read_timeout 1h`, before `/api/` (`server/deploy/nginx-locations.conf`; the `map $http_upgrade $connection_upgrade` exists in the VPS http block).
- **Client** (`pwa/src/online/`): `roomClient.ts` (reconnect with backoff 0.5–8 s, intents queued while offline, snapshots never; clock offset = median of the last 5 pings, `clock.ts`), `RoomContext.tsx` (room, seat, role, members, cue; players load every snapshot via `LOAD_GAME_STATE`; the host loads the room's snapshot once when it connects, so a reload or another device continues), `rules.ts` (`mayAct` — who may draw/place/guess/skip/object/claim/reveal/continue; the host may also draw, reveal and continue for anyone), `useHostBridge.ts` (host: debounced snapshot on every state change, intents checked with `mayAct` + gap range, then the same flow functions the local controls call), `useRemoteTurnFlow.ts` (players: same shape as `useTurnFlow`, every action is an intent). `game/deriveTurn.ts` is the shared pure phase derivation.
- **Game screen**: `GameRound` (exported, used by `/spiel` and `RoomScreen`) asks `can(action)` for every control; other devices show waiting text (`DockState 'waiting'`, `continueBy`, `revealBy`, `rematchBy`). Online rounds have `GameState.onlineRoom` set and are **never** written to the device's saved game. Player seats: `Player.seat` (not equal to the index once someone was removed), `Player.guest`.
- **Music**: `Turntable audioRole` — `host` plays and reports every start/pause and every 4 s; `follow` ("Jeder bei sich") plays from the cue and re-syncs every 2 s when more than 250 ms off (measured locally: ~20 ms apart, pause/resume within one check); `silent` ("Gemeinsam im Raum") plays nothing and shows the host's position.
- **Routes**: `/r/:code` (join: account one tap, guest name; "Mit Google anmelden" remembers the room in `localStorage.mx_pending_room` and Home sends the user back), `/raum/:code` (lobby with QR code — `qrcode-generator`, dark on white whatever the theme — link, members with online dot, kick, friend invites; then the round). Both outside `AppShell`. `AuthGate` lets anyone who is not approved onto these two paths only, wrapped in `SyncModeProvider mode="guest"`: account documents stay in memory, no request asks for an account.
- **What crosses devices is checked** (`online/sanitize.ts`): before the reveal the snapshot carries the song on the platter **without year, album and fact** (`blindSnapshot`; the bundled song list still holds every year — this keeps the answer out of the live traffic only). A player's device stores the host's result only after `sanitizeResult` (known mode, winner among the players, max 10 players / 60 cards / 400 turns, strings cut, unknown fields dropped).
- **Results**: the host's flow saves the round as before; account players save the sanitized result into their own history when the final snapshot arrives (`useSaveOnlineResult`), guests save nothing. Achievements are still tracked on the host's account only (per name, like on one device).
- **Friends** (Spieler tab, `FriendsSection.tsx`): search by part of the name or exact e-mail (approved accounts only, never returns e-mails), request/accept/decline/remove, incoming count badge. Invitations show on Home (polled every 30 s and on focus).
- Setup: "Wie sitzt ihr zusammen?" one device / own devices; own devices hides players, bots and teams (v1: no bots or teams online) and asks for the music mode.

### Statistics and players
- **Turn log**: every booked turn becomes a `TurnRecord` (`types/index.ts`, built in `game/turnRecord.ts`) — person at the controls (`p`; for teams the member, `team` names the team), song, year, `ok`, `first` (a first card is always right and never counts for rates), `bot`, hardcore `d`/`ti`/`ar`/`pts`, objection `ch`. Booked in `resolvePlacement` and in `continueTurn` (hardcore) via `book()`, which also updates `logRef` — `finishGame` runs before the state re-renders and must see the last record. Stored as `GameContext.turnLog` (persisted with the running round) and saved on the history entry as `turns` + `durationMs`; history seats carry `bot`.
- **`game/stats.ts`** (pure, tested): `summarize(history, hidden)` per person (team results count for each member; bots out; a person counts once per round; hidden people out everywhere, also as members/objectors), `decadeRates`/`decadeShares`, `groupStats` (totals, modes, hardest/safest songs from ≥ 2 tries), `weeklyRounds`, `knownPlayers` (rounds + quick picks + names that only have achievements — a name typed into the setup gets an achievement entry and must stay removable; bots never), `renameInHistory`. Rates are `null` without a turn log — never show a made-up 0 %. Rounds before v0.6.0 have no `turns`; legacy bot seats are recognised by name.
- **`game/usePlayers.ts`**: rename/merge and remove touch history, achievements and settings together (`hiddenPlayers` in settings; merged across devices, hidden names leave the quick picks). The account holder cannot be renamed or removed (name comes from Google) and is shown with the Google picture (`me.picture`); everyone else gets the initial.
- **Charts** (`components/charts/`): hand-written SVG, no library. `RadarChart` (≤ 3 series, rings 25–100 %, a hole for `null`, readout under the web — never over it — filled by hover, tap or keyboard), `BarList`, `WeekColumns`, `ShareBar`, `StatTile`; `DecadeProfile` wraps the radar with the metric switch and a table view. Series colours `--mx-chart-1…3` (magenta, amber, blue — the `data` seed in `gen-tokens.mjs`), validated with the dataviz palette checker on the real card surfaces in both themes. Text never takes a series colour.
- History keeps the last 50 rounds (`GAME_CONFIG.MAX_HISTORY_GAMES`, server doc cap 512 KB); the statistics say so.

### Audio
`services/PreviewPlayerService.ts` (Howler, HTML5 audio). `audioSrc()` turns the absolute `previewUrl` (`https://mxtape.celox.io/audio/song_XXX.m4a`) into a same-origin path, so the session cookie travels and nginx can gate it. `components/game/Turntable.tsx` owns playback for the game: plays on song change (optional random start), polls position at 4 Hz, stops on unmount.

## Design System — Material 3 Expressive ("vinyl magenta", v0.4.0)

**Single source of truth: `pwa/src/styles/design-tokens.css`.** Nothing outside it holds raw colour (exceptions: the pre-paint loader in `index.html` and `THEME_COLOR` in `SettingsContext`, both mirrors).

- **Colour**: the reference palettes are **generated** by `pwa/scripts/gen-tokens.mjs` from `SEEDS` (primary `#C2185B` magenta, tertiary `#FF8A3D` amber, neutrals = primary hue at chroma 6/12) into the `BEGIN/END GENERATED PALETTES` block. Values are RGB triplets so Tailwind alpha modifiers work. Roles (dark default + light) reference tones by name. Extra brand tokens: `--mx-brand` / `--mx-on-brand` (saturated fill with white text for the few hero actions, `.btn-brand`), `--mx-vinyl`, `--mx-groove`, `--mx-label`, `--mx-label-2`. Only the `md-*` Tailwind namespace exists (legacy aliases were removed).
- **App icons**: the same record, generated by `npm run icons` (`pwa/scripts/gen-icons.mjs`: SVG sources → headless Chrome PNGs → `favicon.ico`). Small sizes use a simplified disc with a larger label; maskable and touch icons put the record on a brand-magenta tile.
- **Signature element**: the record (`components/ui/Vinyl.tsx`) — grooves + label rotate via CSS (`.vinyl[data-spinning]`, pauses in place), the sheen is a static layer on top. Used on the login screen, the home "Neues Spiel" sleeve, the turntable (label = play/pause, then the revealed year coloured by verdict), waiting room, game-over. Keep everything around it quiet.
- **Type**: Roboto Flex variable, **self-hosted** (`pwa/public/fonts/*.woff2`, full wdth 25–151 axis). `.text-poster` = wide + heavy (`wdth 140, wght 860`) for the wordmark and hero moments.
- **Components** (`styles/tailwind.css`): `.btn` (+ `-brand/-filled/-tonal/-outline/-text/-danger`, `-lg`), `.icon-btn`, `.surface`, `.row`, `.field`, `.chip`, `.meta`; radius encodes hierarchy (hero xxl, sections xl, rows lg, chips full). Elevation is tonal.
- **Motion**: `src/motion/springs.ts` is the single source (M3 specs → Motion springs + generated CSS `linear()` block; `UPDATE_SPRING_CSS=1 npx vitest run springs` after changing a spec). Spatial springs may overshoot, effects never. One reduced-motion policy (`motion/policy.ts`). Only `m.*` components (LazyMotion strict). Routes animate with View Transitions (`useAppNavigate`, `NavLink viewTransition`), never with Motion; persistent chrome has `view-transition-name` (`nav-bar`, `nav-rail`, `top-bar`), the home sleeve and the setup page share `new-game` (container transform). During the theme reveal all names are dropped (`html[data-theme-transition] *`).

**Gotchas (all hit while building v0.4.0):**
- Motion owns `transform` on an `m.*` element — Tailwind `translate-*` classes on the same element are silently overwritten. Position on a plain wrapper, animate inside.
- StrictMode replays effects: one-time setup (e.g. prefilling the owner in `SetupScreen`) needs a ref guard, or players double up.
- The Playwright MCP browser sometimes resets the viewport after `navigate`; resize again before screenshots. Full-page screenshots show sticky headers in the middle — judge layout from viewport shots.
- Vite HMR full reloads trigger the game's `beforeunload` dialog in dev.
- `.m3-dialog-panel` is a surface only; CSS entrance in `.m3-dialog-enter`. Never combine CSS keyframes and Motion on one element.
- `<Modal>` content is a prop snapshot; `closeModal()` resolves on exit; history-back popstate is async (one global listener swallows self-caused pops).
- Tests: wrap `m.*` in `test/MotionTestProvider`; `test/setup.ts` installs `test/fakeApi.ts` as `fetch` (in-memory `/api/data` with versioning) — stub `fetch` yourself for other endpoints (`vi.stubGlobal`).
- After changing `tailwind.config.js`, restart the dev server.

## Deployment

- `./scripts/deployment/deploy.sh [all|api|web]` — runs tests first.
  - **api**: rsync `server/` → `/opt/mxtape-api` (no `.venv`, `data`, `.env`, `tests`), system user `mxtape`, venv + requirements, installs `server/deploy/mxtape-api.service`, restarts, health check.
  - **web**: tsc + vitest, build, rsync `pwa/dist` (minus `audio/`) via `/tmp` staging into `/var/www/html/mxtape`, audio untouched.
- Secrets **only** in `/opt/mxtape-api/.env` (root:mxtape 640): `GOOGLE_CLIENT_ID/SECRET`, `SESSION_SECRET` (≥ 32 chars, enforced in prod), `MXTAPE_ADMIN_EMAILS`, `PUBLIC_URL=https://mxtape.celox.io`, `MX_ENV=prod`, `SMTP_*`, `NOTIFY_EMAIL`. `MX_DEV_LOGIN` must never be set in prod (startup refuses).
- Google OAuth client (Web application): authorised redirect URI `https://mxtape.celox.io/api/auth/callback` (+ `http://127.0.0.1:5174/api/auth/callback` for local tests with real Google).
  - Client ID `575245359999-s185k3…apps.googleusercontent.com` (created 2026-10-26; the older client ending in …ttlih is unused). Secret only in the server `.env`.
  - ⚠️ While the consent screen is in **testing mode**, Google rejects every account that is not a listed test user — before our callback runs, so they never reach the waiting list. Publish the app (Audience → Publish); basic scopes need no verification.
- nginx: vHost `/etc/nginx/sites-available/mxtape.celox.io` (symlinked); the `/api/`, `/audio/` (auth_request) and `/_mx_audio_auth` locations are in `server/deploy/nginx-locations.conf`. Edit the file nginx actually loads (`nginx -T`), never while certbot runs. Umami is injected centrally via `sub_filter`.
- Backup: `/opt/mxtape-api/data/mxtape.db` is picked up by the dynamic SQLite search in `vps-data-backup.sh` (`.backup`, not copied).
- ⚠️ **Touch the live database only as the service user** (`sudo -u mxtape sqlite3 …`). Run as root, SQLite creates `mxtape.db-wal`/`-shm` owned by root; the running service keeps working through its open files, but the next restart fails with "attempt to write a readonly database" (happened on the 0.7.0 deploy: API down ~4 min, fixed with `chown mxtape:mxtape mxtape.db*`). The sqlite3 CLI does not enforce foreign keys either — deleting rooms by hand leaves `room_members` behind.
- Live check of rooms (verified 2026-10-27, script-driven through the public URL): create 200, guest join sets `mx_guest`, guest `/audio/` 206 while the room is open and 401 after closing, anonymous 401; WebSocket welcome for host and guest, 403 for a foreign Origin and without a cookie, an intent reaches the host with the real seat; search returns no e-mail.
- Live check after a deploy (verified 2026-10-26): `/` 200, `/api/session` 200 `{"me":null}`, `/api/me` + `/api/admin/users` 401 without session, `/audio/song_001.m4a` 401 without session (206 `audio/mp4` with one — verified 2026-10-27), 206 with an approved session, 401 pending; data 403 pending; admin 404 for non-admins. A probe user for such checks must be deleted afterwards (users + sessions).
- Mail on the VPS goes via SMTP (`SMTP_*` in `.env`): the service user `mxtape` cannot read `/etc/msmtprc`, so `SENDMAIL_PATH` does not work there. `MAIL_FROM` must be quoted in the `.env`.
- PWA: Workbox cache id `mxtape-v10`; `/api/` and `/audio/` are never precached, `/api/` navigations bypass the SW; `/r/` and `/raum/` are excluded from the precache fallback (an older cached shell does not know them and sent scanned invites to the start page). Bump `cacheId` on shell changes.

### Rename mxster → mxtape (v0.8.0, 2026-10-27)
- Everything was renamed: domain `mxtape.celox.io` (served with the `*.celox.io` wildcard certificate in `/etc/nginx/ssl/celox-wildcard/`), service `mxtape-api`, system user `mxtape`, `/opt/mxtape-api`, `data/mxtape.db`, web root `/var/www/html/mxtape`, env `MXTAPE_ADMIN_EMAILS`, repo `pepperonas/mxtape` (GitHub redirects the old name). The local working copy is still called `~/claude/mxster`.
- `mxster.celox.io` is a pure 301 to the same path on mxtape.celox.io (own vHost, keeps its Let's Encrypt certificate) — old links and printed QR codes keep working. Sessions are host-bound, so everyone signed in once more.
- **Kept on purpose:** the browser storage keys `mxster_*` (running game, settings, history, theme, last options) — renaming them would drop saved rounds and settings on every device. Audio URLs in old saved rounds point to the old domain; `audioSrc()` only uses the path, so they still play.
- Backups of the switch: DB `/root/mxster-db-bak-20261027-184801-vor-mxtape.db`, old vHost `/root/nginx-backups/mxster.celox.io.bak-20261027-184801-rename`, script `/root/mxtape-migrate.sh`.
- ⚠️ Two traps hit during the move: a Python venv carries absolute paths and breaks when its folder is moved (`pip: cannot execute`) — delete it and let the deploy recreate it; and `deploy.sh` ran `chown -R root:… $API_ROOT`, which also took the database away from the service (readonly database, probably also the real cause of the 0.7.0 outage) — it now hands `data/` back recursively.

## Best Practices
- Song type: `export const songs: Song[] = [...]` (the integrity test parses it with `/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/`).
- Song data is maintained without Spotify: `lib/musicData.js` (MusicBrainz year + original album — only recordings credited to exactly that artist, no compilations/live/DJ mixes; Cover Art Archive, iTunes as fallback), `lib/songStore.js` (the only writer of songs.json/song-facts.json; regenerates songs.ts through sync — writing songs.ts directly drops every fact), `lib/songWizard.js` (shared add/exchange flow; refuses a year-spoiling fact; duplicate check ignores case/accents). The lookup is a suggestion — MusicBrainz misses originals sometimes (Bohemian Rhapsody comes back as 1976), so the wizard shows all candidates and asks for the year. yt-dlp runs with an argument list (titles with quotes are safe) and warns on lengths outside 1:30–10:00. Songs without a fact are fine (only confident facts, never the year).
- Touch targets ≥ 48 px; `hoverOnlyWhenSupported` is on, so `hover:` never fires on touch.
- UI copy is German, sentence case, active verbs; **no emoji anywhere** — every symbol is an inline SVG from `components/ui/Icon.tsx` (achievements map to icons via `achievementIcon(id)`; stored achievements may still carry old emoji strings, so never render `achievement.icon` from stored data directly).

## Release Checklist
1. Version in `pwa/package.json` + `ProfileScreen.tsx`
2. `node scripts/song-management/update-song-count.js` if songs changed
3. Tests (server, pwa, root) → commit → tag `vX.Y.Z` → push → `gh release create`
4. `./scripts/deployment/deploy.sh`
