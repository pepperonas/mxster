/**
 * Game modes, round options and the rule modules' wording (game/*.ts,
 * utils/gameModes.ts, utils/constants.ts). Looked up at call time with
 * `msg(modesText)` — never at module top level.
 */
import { defineMessages } from '../define'

export const modesText = defineMessages({
  de: {
    // MODE_COPY
    personalName: 'Eigene Zeitleiste',
    personalShort: 'Jede:r baut eine eigene Zeitleiste.',
    personalHow: (goal: string) =>
      `Leg jeden Song an die richtige Stelle deiner Zeitleiste. Wer zuerst ${goal} Songs richtig liegen hat, gewinnt.`,
    globalName: 'Gemeinsame Zeitleiste',
    globalShort: 'Alle legen an dieselbe Zeitleiste.',
    globalHow: (goal: string) =>
      `Alle legen an eine gemeinsame Zeitleiste. Sobald ${goal} Songs richtig liegen, gewinnt, wer die meisten davon gelegt hat. Bei Gleichstand entscheidet ein Stechen.`,
    hardcoreName: 'Hardcore',
    hardcoreShort: 'Titel, Interpret und Jahr raten, bis zu 15 Punkte.',
    hardcoreHow: (goal: string) =>
      `Rate Titel und Interpret (je 5 Punkte) und das Jahr (5 Punkte exakt, 2 bei einem Jahr daneben, 1 bei zwei). Nach ${goal} Songs gewinnt, wer die meisten Punkte hat. Bei Gleichstand entscheidet ein Stechen.`,
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',

    // Round length
    goalShort: 'Kurz',
    goalNormal: 'Normal',
    goalLong: 'Lang',
    goal5: 'fünf',
    goal10: 'zehn',
    goal15: 'fünfzehn',

    decade: (twoDigits: string) => `${twoDigits}er`,

    teamMagenta: 'Team Magenta',
    teamOrange: 'Team Orange',
    teamViolet: 'Team Violett',
    teamGreen: 'Team Grün',

    // gapLabel
    firstCard: 'Erste Karte platzieren',
    before: (year: number) => `Vor ${year}`,
    after: (year: number) => `Nach ${year}`,
    between: (a: number, b: number) => `Zwischen ${a} und ${b}`,

    // useTurnFlow toasts
    allPlayed: 'Alle Songs wurden bereits gespielt!',
    replaying: 'Alle Songs waren schon dran – ab jetzt kommen die ersten wieder.',
    widenedTheme: 'Die Songs dieser Auswahl sind durch – ab jetzt kommen alle Songs.',
    widenedExotics: 'Die bekannten Songs sind durch – ab jetzt kommen auch Exoten.',
    widenedDecades: 'Die gewählten Jahrzehnte sind durch – ab jetzt kommen Songs aus allen Jahrzehnten.',
    savedToHistory: 'Spiel wurde zur Historie hinzugefügt!',
    stillTied: (round: number) => `Immer noch gleichauf – Stechen, Runde ${round}`,
    tie: (names: string[]) => `Gleichstand! Stechen zwischen ${names.join(' und ')}`,
    cardPlaced: 'Karte platziert!',
    botError: 'Bot-Fehler aufgetreten',

    // services
    noAudioFile: 'Für diesen Song gibt es keine Audiodatei.',
    loadFailed: 'Der Song konnte nicht geladen werden.',

    // utils/gameModes.ts (GAME_MODE_INFO)
    infoHardcoreName: 'Hardcore',
    infoHardcoreDescription: 'Rate Jahr, Titel und Interpret - Maximale Punkte für perfekte Antworten',
    infoHardcoreRule1: 'Höre den Song',
    infoHardcoreRule2: 'Rate Jahr, Titel und Interpret',
    infoHardcoreRule3: 'Titel richtig: 5 Punkte',
    infoHardcoreRule4: 'Interpret richtig: 5 Punkte',
    infoHardcoreRule5: 'Jahr exakt: 5 Punkte | ±1 Jahr: 2 Punkte | ±2 Jahre: 1 Punkt',
    infoHardcoreRule6: 'Karten werden automatisch chronologisch sortiert',
    infoHardcoreScoring: 'Titel: 5P | Interpret: 5P | Jahr: 5P/2P/1P (max. 15 Punkte)',
    infoHardcoreFeature1: 'Fuzzy Matching',
    infoHardcoreFeature2: 'Automatische Timeline',
    infoHardcoreFeature3: 'Punkte-System',
    infoPersonalName: 'Persönliche Timeline',
    infoPersonalDescription: 'Jeder Spieler hat seine eigene Timeline - sortiere die Karten chronologisch',
    infoListen: 'Höre den Song',
    infoOptionalGuess: 'Rate optional Jahr, Titel und Interpret (keine Punkte)',
    infoPersonalPlace: 'Platziere die Karte in deiner persönlichen Timeline',
    infoPersonalKeep: 'Karte bleibt nur, wenn chronologisch korrekt',
    infoTimelineScoring: 'Erste Person mit 10 korrekt platzierten Karten gewinnt',
    infoPersonalFeature1: 'Persönliche Timeline',
    infoPersonalFeature2: 'Manuelle Platzierung',
    infoPersonalFeature3: 'Chronologische Validierung',
    infoGlobalName: 'Globale Timeline',
    infoGlobalDescription: 'Alle Spieler teilen eine Timeline - falsche Karten werden entfernt',
    infoGlobalPlace: 'Platziere die Karte in der globalen Timeline',
    infoGlobalRemoved: 'Falsche Platzierungen werden entfernt',
    infoGlobalFeature1: 'Gemeinsame Timeline',
    infoGlobalFeature2: 'Kollaboratives Spiel',
    infoGlobalFeature3: 'Höherer Schwierigkeitsgrad',

    // utils/constants.ts
    errPremium: 'Spotify Premium Account erforderlich',
    errCamera: 'Kamera-Zugriff verweigert',
    errNoAudio: 'Keine Audio-Quelle verfügbar',
    errNetwork: 'Netzwerkfehler',
    errAlreadyPlayed: 'Dieser Song wurde bereits gespielt',
    errQr: 'Ungültiger QR-Code',
    okSaved: 'Spielstand gespeichert',
    okLoaded: 'Spielstand geladen',
    okSongAdded: 'Song hinzugefügt',
    okPlayerAdded: 'Spieler hinzugefügt'
  },
  en: {
    personalName: 'Own timeline',
    personalShort: 'Everyone builds their own timeline.',
    personalHow: (goal: string) =>
      `Place every song in the right spot on your timeline. The first to have ${goal} songs in the right place wins.`,
    globalName: 'Shared timeline',
    globalShort: 'Everyone places on the same timeline.',
    globalHow: (goal: string) =>
      `Everyone places on one shared timeline. Once ${goal} songs are in the right place, whoever placed the most of them wins. A tie goes to a tiebreak.`,
    hardcoreName: 'Hardcore',
    hardcoreShort: 'Guess title, artist and year, up to 15 points.',
    hardcoreHow: (goal: string) =>
      `Guess title and artist (5 points each) and the year (5 points if exact, 2 if one year off, 1 if two). After ${goal} songs, whoever has the most points wins. A tie goes to a tiebreak.`,
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',

    goalShort: 'Short',
    goalNormal: 'Normal',
    goalLong: 'Long',
    goal5: 'five',
    goal10: 'ten',
    goal15: 'fifteen',

    decade: (twoDigits: string) => `${twoDigits}s`,

    teamMagenta: 'Team Magenta',
    teamOrange: 'Team Orange',
    teamViolet: 'Team Violet',
    teamGreen: 'Team Green',

    firstCard: 'Place the first card',
    before: (year: number) => `Before ${year}`,
    after: (year: number) => `After ${year}`,
    between: (a: number, b: number) => `Between ${a} and ${b}`,

    allPlayed: 'Every song has been played already.',
    replaying: 'Every song has had its turn – the first ones come round again.',
    widenedTheme: 'The songs of this selection are used up – all songs from now on.',
    widenedExotics: 'The well-known songs are used up – exotics are in from now on.',
    widenedDecades: 'The chosen decades are used up – songs from all decades are in from now on.',
    savedToHistory: 'Round saved to your history.',
    stillTied: (round: number) => `Still tied – tiebreak, round ${round}`,
    tie: (names: string[]) =>
      `Tied! Tiebreak between ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('')}`,
    cardPlaced: 'Card placed!',
    botError: 'A bot ran into an error',

    noAudioFile: 'There is no audio file for this song.',
    loadFailed: 'The song could not be loaded.',

    infoHardcoreName: 'Hardcore',
    infoHardcoreDescription: 'Guess year, title and artist – the most points for perfect answers',
    infoHardcoreRule1: 'Listen to the song',
    infoHardcoreRule2: 'Guess year, title and artist',
    infoHardcoreRule3: 'Right title: 5 points',
    infoHardcoreRule4: 'Right artist: 5 points',
    infoHardcoreRule5: 'Exact year: 5 points | ±1 year: 2 points | ±2 years: 1 point',
    infoHardcoreRule6: 'Cards are sorted by year automatically',
    infoHardcoreScoring: 'Title: 5 | Artist: 5 | Year: 5/2/1 (max. 15 points)',
    infoHardcoreFeature1: 'Fuzzy matching',
    infoHardcoreFeature2: 'Automatic timeline',
    infoHardcoreFeature3: 'Points',
    infoPersonalName: 'Own timeline',
    infoPersonalDescription: 'Every player has their own timeline – sort the cards by year',
    infoListen: 'Listen to the song',
    infoOptionalGuess: 'Optionally guess year, title and artist (no points)',
    infoPersonalPlace: 'Place the card on your own timeline',
    infoPersonalKeep: 'A card only stays if it is in the right order',
    infoTimelineScoring: 'The first to place 10 cards correctly wins',
    infoPersonalFeature1: 'Own timeline',
    infoPersonalFeature2: 'Manual placement',
    infoPersonalFeature3: 'Order check',
    infoGlobalName: 'Shared timeline',
    infoGlobalDescription: 'Everyone shares one timeline – wrong cards are removed',
    infoGlobalPlace: 'Place the card on the shared timeline',
    infoGlobalRemoved: 'Wrong placements are removed',
    infoGlobalFeature1: 'Shared timeline',
    infoGlobalFeature2: 'Play together',
    infoGlobalFeature3: 'Harder',

    errPremium: 'Spotify Premium account required',
    errCamera: 'Camera access denied',
    errNoAudio: 'No audio source available',
    errNetwork: 'Network error',
    errAlreadyPlayed: 'This song has already been played',
    errQr: 'Invalid QR code',
    okSaved: 'Game saved',
    okLoaded: 'Game loaded',
    okSongAdded: 'Song added',
    okPlayerAdded: 'Player added'
  }
})
