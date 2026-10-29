/**
 * /about — the product page and help: what mxtape is, how a round works,
 * the modes, ways to play, extras, and answers to common questions.
 * Keep every sentence true to the code (rules in game/*.ts, rooms, daily).
 */
import { useLang } from '../LanguageContext'
import type { Lang } from '../lang'

export interface Faq {
  q: string
  a: string[]
}
export interface Item {
  icon: string
  t: string
  p: string
}

const de = {
    title: 'mxtape – das Musikspiel für eure Runde',
    signIn: 'Anmelden',
    toGame: 'Zum Spiel',
    toWaiting: 'Zum Warteraum',
    home: 'mxtape, zur Startseite',
    sections: 'Abschnitte',
    navHow: 'So geht’s',
    navModes: 'Spielarten',
    navHelp: 'Hilfe',

    kicker: 'Das Musikspiel für eure Runde',
    heroTitle: 'Hör rein.\nRate das Jahr.\nLeg die Karte.',
    heroLead:
      'Ein Song läuft, ihr hört zu und schätzt: Wann kam der raus? Dann legt ihr ihn an die richtige Stelle eurer Zeitleiste. Wer zuerst genug Karten richtig liegen hat, gewinnt.',
    tryIt: 'Gleich ausprobieren',
    stats: (songs: number, decades: number, from: number) => [
      { n: String(songs), l: 'Songs' },
      { n: String(decades), l: `Jahrzehnte, ${from} bis heute` },
      { n: '3', l: 'Spielarten' },
      { n: '10', l: 'Leute pro Raum' }
    ],

    howKicker: 'So geht’s',
    howTitle: 'Eine Runde in drei Schritten',
    steps: [
      { t: 'Hör rein', p: 'Wer am Zug ist, zieht einen Song. Die Platte dreht sich, alle hören zu – Titel und Interpret stehen auf der Karte, das Jahr nicht.' },
      { t: 'Leg die Karte', p: 'Zieh die Karte an die Stelle der Zeitleiste, an die sie gehört: vor, zwischen oder nach die Songs, die schon liegen. Ein Fingertipp auf eine Lücke geht auch.' },
      { t: 'Deck auf', p: 'Das Jahr erscheint. Grün heißt: Die Karte bleibt liegen. Rot heißt: Sie fliegt raus. Dann ist die nächste Person dran.' }
    ],

    demoKicker: 'Probier’s aus',
    demoTitle: 'Wohin gehört dieser Song?',
    demoLead: 'Ohne Musik, aber nach denselben Regeln: Zieh den Song in die Lücke, in die er deiner Meinung nach gehört – oder tippe sie an.',
    demoHere: 'Hier ablegen',
    demoBefore: (y: number) => `vor ${y}`,
    demoAfter: (y: number) => `nach ${y}`,
    demoRange: (a: number, b: number) => `${a} – ${b}`,
    demoDrag: 'Ziehen oder Lücke antippen',
    demoCard: 'Dein Song',
    demoPlace: (where: string) => `Hier ablegen: ${where}`,
    demoFirst: 'ganz vorn',
    demoLast: 'ganz hinten',
    demoBetween: (a: number, b: number) => `zwischen ${a} und ${b}`,
    demoRight: (year: number) => `Richtig! ${year} – die Karte bleibt liegen.`,
    demoWrong: (year: number, where: string) => `Daneben. ${year} – gehört ${where}.`,
    demoNext: 'Nächster Song',
    demoScore: (right: number, played: number) => `${right} von ${played} richtig`,

    modesKicker: 'Spielarten',
    modesTitle: 'Drei Arten zu spielen',
    modes: [
      {
        icon: 'groups',
        t: 'Gemeinsame Zeitleiste',
        p: 'Alle legen an dieselbe Zeitleiste. Sobald genug Songs richtig liegen, gewinnt, wer die meisten davon gelegt hat. Ideal für große Runden.'
      },
      {
        icon: 'timeline',
        t: 'Eigene Zeitleiste',
        p: 'Jede:r baut eine eigene Zeitleiste. Wer zuerst die vereinbarte Zahl Songs richtig liegen hat, gewinnt.'
      },
      {
        icon: 'flame',
        t: 'Hardcore',
        p: 'Nenne Titel und Interpret (je 5 Punkte) und das Jahr (5 Punkte exakt, 2 bei einem Jahr daneben, 1 bei zwei). Tippfehler verzeiht das Spiel.'
      }
    ] as Item[],
    modesNote: 'Eine Runde dauert 5, 10 oder 15 Songs. Unentschieden gibt es nicht: Bei Gleichstand entscheidet ein Stechen.',

    waysKicker: 'Zusammen spielen',
    waysTitle: 'Spielt, wie es für euch passt',
    ways: [
      { icon: 'person', t: 'An einem Gerät', p: 'Ein Handy oder Laptop liegt in der Mitte, ihr reicht es weiter. Bots spielen auf Wunsch mit, leicht bis schwer.' },
      { icon: 'share', t: 'Jede:r am eigenen Handy', p: 'Öffnet einen Raum, die anderen scannen den QR-Code. Freund:innen ohne Konto spielen als Gast mit, nur mit Namen.' },
      { icon: 'tv', t: 'Fernseher als Bühne', p: 'Ein Bildschirm tritt dem Raum bei, zeigt die Runde groß und spielt die Musik. Die Handys sind die Fernbedienungen.' },
      { icon: 'globe', t: 'Auch über Entfernung', p: 'Mit „Jeder bei sich“ läuft die Musik auf allen Geräten gleichzeitig – für Runden, die nicht im selben Raum sitzen.' }
    ] as Item[],

    extrasKicker: 'Mehr drin',
    extrasTitle: 'Was mxtape außerdem kann',
    extras: [
      { icon: 'hand', t: 'Einspruch', p: 'Liegt eine Karte deiner Meinung nach falsch, leg sie woandershin. Hast du recht, gehört sie dir. Drei Einsprüche pro Runde.' },
      { icon: 'swap', t: 'Bonus und Joker', p: 'Die Karte bleibt verdeckt, ihr hört nur. Wer Titel und Interpret richtig nennt, bekommt einen Joker und darf damit einen Song tauschen.' },
      { icon: 'today', t: 'Tagesrunde', p: 'Jeden Tag dieselben Songs für alle, in derselben Reihenfolge. Spiel bis zum ersten Fehler – die längste Serie unter Freund:innen gewinnt.' },
      { icon: 'medal', t: 'Erfolge und Ränge', p: '50 Erfolge, jeder bringt Punkte. Von Demo bis Legende – und eine Rangliste mit deinen Freund:innen.' },
      { icon: 'insights', t: 'Statistik', p: 'Welches Jahrzehnt liegt dir? Ein Netzdiagramm zeigt es, dazu eure härtesten Songs und wie ihr spielt.' },
      { icon: 'library', t: 'Alle Songs', p: 'Stöbere durch die ganze Sammlung: nach Jahr, Titel, Interpret oder Album sortiert, mit einer Suche, die Tippfehler verzeiht.' },
      { icon: 'album', t: 'Themen und Jahrzehnte', p: 'Nur die 80er? Nur Party-Klassiker, nur deutsche Songs, nur eure Angstgegner? Stell die Runde so zusammen, wie ihr Lust habt.' },
      { icon: 'trophy', t: 'Kein Unentschieden', p: 'Liegen zwei gleichauf, entscheidet ein Stechen: ein Song pro Kopf, bis eine Person vorn liegt.' }
    ] as Item[],

    helpKicker: 'Hilfe',
    helpTitle: 'Fragen und Antworten',
    faq: [
      {
        q: 'Wie komme ich rein?',
        a: [
          'Melde dich mit Google an oder registriere dich mit E-Mail und Passwort. Bei E-Mail bekommst du zuerst einen Bestätigungslink.',
          'mxtape ist ein privates Spiel: Neue Konten werden von Hand freigeschaltet. Bis dahin siehst du einen Warteraum, der sich von selbst öffnet, sobald es so weit ist.'
        ]
      },
      {
        q: 'Brauchen alle ein Konto?',
        a: [
          'Nein. Wer einen Raum öffnet, braucht eins. Alle anderen können über den Link oder QR-Code als Gast mitspielen, nur mit einem Namen. Gäste brauchen kein Konto und sehen nur diesen einen Raum.'
        ]
      },
      {
        q: 'Was brauche ich zum Spielen?',
        a: [
          'Einen aktuellen Browser auf Handy, Tablet oder Computer und einen Lautsprecher. mxtape lässt sich wie eine App auf dem Startbildschirm ablegen („Zum Startbildschirm hinzufügen“ bzw. „Installieren“).'
        ]
      },
      {
        q: 'Warum spielt keine Musik?',
        a: [
          'Handys spielen Ton erst nach einem Tipp ab. Nach dem Neuladen steht deshalb „Zum Abspielen tippen“ unter der Platte – einmal tippen genügt.',
          'Prüfe außerdem Lautstärke und Stummschalter. Spielt ihr im Raum mit „Gemeinsam im Raum“, kommt die Musik vom Gerät der Person, die gerade dran ist, oder vom Fernseher.'
        ]
      },
      {
        q: 'Wie funktioniert ein Einspruch?',
        a: [
          'Nachdem eine Karte gelegt wurde und bevor sie aufgedeckt wird, können die anderen Einspruch einlegen und eine andere Lücke wählen. Lag die gelegte Karte falsch und der Einspruch richtig, bekommt die Person mit dem Einspruch die Karte. Verbraucht ist der Einspruch so oder so.',
          'Jede:r (oder jedes Team) hat drei Einsprüche pro Runde. Auf die erste Karte gibt es keinen Einspruch, im Hardcore-Modus und im Stechen auch nicht.'
        ]
      },
      {
        q: 'Wie zählt Hardcore?',
        a: [
          'Titel richtig: 5 Punkte. Interpret richtig: 5 Punkte. Jahr exakt: 5, ein Jahr daneben: 2, zwei Jahre daneben: 1. Höchstens 15 Punkte pro Song.',
          'Kleine Tippfehler, fehlende Artikel oder „and“ statt „&“ zählen trotzdem. Bei Songs mit mehreren Interpreten reicht einer davon.'
        ]
      },
      {
        q: 'Wie läuft die Tagesrunde?',
        a: [
          'Alle bekommen am selben Tag dieselben Songs in derselben Reihenfolge. Du spielst, bis zum ersten Mal eine Karte falsch liegt – deine Serie ist die Zahl der richtig gelegten Songs.',
          'Du kannst pausieren und später weitermachen, auch auf einem anderen Gerät. Neu starten kannst du an diesem Tag nicht. Danach kannst du ausgewählte Freund:innen per E-Mail herausfordern.'
        ]
      },
      {
        q: 'Was passiert, wenn jemand die Verbindung verliert?',
        a: [
          'Kurze Aussetzer überbrückt das Spiel. Ist jemand länger als 30 Sekunden weg, wird die Person übersprungen, bis sie wieder da ist.',
          'Fällt das Gerät aus, das die Runde leitet, kann nach 30 Sekunden ein anderes Konto im Raum das Spiel übernehmen. Damit niemand eine Runde aufhält, hat jeder Schritt außerdem ein Zeitlimit.'
        ]
      },
      {
        q: 'Ein Jahr stimmt nicht – was tun?',
        a: [
          'Unter jedem aufgedeckten Song steht „Stimmt was nicht?“. Melde dort ein falsches Jahr, eine falsche Version, schlechten Ton oder ein falsches Cover. Ist die Meldung berechtigt, gilt die Korrektur danach sofort für alle.'
        ]
      },
      {
        q: 'Was passiert mit meinen Daten?',
        a: [
          'Gespeichert werden dein Konto, deine Runden, Erfolge und Einstellungen – damit du auf jedem Gerät weiterspielen kannst. Keine Werbung, keine Cookies zur Verfolgung; die Nutzung wird nur anonym und cookielos gezählt.',
          'In den Einstellungen kannst du alles herunterladen, deine Spieldaten löschen oder das ganze Konto. Details stehen in der Datenschutzerklärung.'
        ]
      }
    ] as Faq[],
    helpMore: 'Noch eine Frage offen?',
    helpMail: 'Schreib eine Mail',

    ctaTitle: 'Bereit für die erste Runde?',
    ctaLead: 'Anmelden, Raum öffnen, Platte auflegen.',
    allSongsNote: 'Alle Angaben zu Songs und Jahren nach bestem Wissen; Fehler bitte im Spiel melden.'
}

export type AboutContent = typeof de

/** Same shape as German: a missing English text is a compile error. */
const en: AboutContent = {
    title: 'mxtape – the music game for your crowd',
    signIn: 'Sign in',
    toGame: 'Go to the game',
    toWaiting: 'Go to the waiting room',
    home: 'mxtape, home',
    sections: 'Sections',
    navHow: 'How it works',
    navModes: 'Modes',
    navHelp: 'Help',

    kicker: 'The music game for your crowd',
    heroTitle: 'Listen in.\nGuess the year.\nPlace the card.',
    heroLead:
      'A song plays, you listen and guess: when did this come out? Then you place it in the right spot on your timeline. Whoever gets enough cards right first wins.',
    tryIt: 'Try it now',
    stats: (songs: number, decades: number, from: number) => [
      { n: String(songs), l: 'songs' },
      { n: String(decades), l: `decades, ${from} to today` },
      { n: '3', l: 'ways to play' },
      { n: '10', l: 'people per room' }
    ],

    howKicker: 'How it works',
    howTitle: 'A turn in three steps',
    steps: [
      { t: 'Listen in', p: 'Whoever is on turn draws a song. The record spins, everyone listens – title and artist are on the card, the year is not.' },
      { t: 'Place the card', p: 'Drag the card to where it belongs on the timeline: before, between or after the songs already there. Tapping a gap works too.' },
      { t: 'Reveal', p: 'The year appears. Green means the card stays. Red means it is out. Then it is the next person’s turn.' }
    ],

    demoKicker: 'Try it',
    demoTitle: 'Where does this song go?',
    demoLead: 'No music here, but the same rules: drag the song into the gap you think it belongs in – or tap the gap.',
    demoHere: 'Place here',
    demoBefore: (y: number) => `before ${y}`,
    demoAfter: (y: number) => `after ${y}`,
    demoRange: (a: number, b: number) => `${a} – ${b}`,
    demoDrag: 'Drag it or tap a gap',
    demoCard: 'Your song',
    demoPlace: (where: string) => `Place it ${where}`,
    demoFirst: 'at the start',
    demoLast: 'at the end',
    demoBetween: (a: number, b: number) => `between ${a} and ${b}`,
    demoRight: (year: number) => `Right! ${year} – the card stays.`,
    demoWrong: (year: number, where: string) => `Not quite. ${year} – it belongs ${where}.`,
    demoNext: 'Next song',
    demoScore: (right: number, played: number) => `${right} of ${played} right`,

    modesKicker: 'Modes',
    modesTitle: 'Three ways to play',
    modes: [
      {
        icon: 'groups',
        t: 'Shared timeline',
        p: 'Everyone places on the same timeline. Once enough songs are in the right place, whoever placed the most of them wins. Great for big groups.'
      },
      {
        icon: 'timeline',
        t: 'Own timeline',
        p: 'Everyone builds their own timeline. The first to have the agreed number of songs in the right place wins.'
      },
      {
        icon: 'flame',
        t: 'Hardcore',
        p: 'Name the title and the artist (5 points each) and the year (5 points exact, 2 if one year off, 1 if two). The game forgives typos.'
      }
    ] as Item[],
    modesNote: 'A round lasts 5, 10 or 15 songs. There are no draws: a tie is settled by a tiebreak.',

    waysKicker: 'Play together',
    waysTitle: 'Play the way that suits you',
    ways: [
      { icon: 'person', t: 'On one device', p: 'One phone or laptop in the middle, you pass it around. Bots join in if you like, easy to hard.' },
      { icon: 'share', t: 'Everyone on their phone', p: 'Open a room, the others scan the QR code. Friends without an account join as guests, with just a name.' },
      { icon: 'tv', t: 'The TV as the stage', p: 'A screen joins the room, shows the round big and plays the music. The phones are the remote controls.' },
      { icon: 'globe', t: 'Across distances', p: 'With “Everyone at home”, the music plays on every device at the same time – for groups that are not in the same room.' }
    ] as Item[],

    extrasKicker: 'More inside',
    extrasTitle: 'What else mxtape can do',
    extras: [
      { icon: 'hand', t: 'Objection', p: 'Think a card is in the wrong spot? Move it somewhere else. If you are right, it is yours. Three objections per round.' },
      { icon: 'swap', t: 'Bonus and jokers', p: 'The card stays face down, you only listen. Name title and artist correctly to earn a joker – and swap a song with it.' },
      { icon: 'today', t: 'Daily round', p: 'The same songs for everyone each day, in the same order. Play until your first mistake – the longest streak among friends wins.' },
      { icon: 'medal', t: 'Achievements and ranks', p: '50 achievements, each worth points. From Demo to Legend – plus a leaderboard with your friends.' },
      { icon: 'insights', t: 'Statistics', p: 'Which decade is yours? A radar chart shows it, along with your toughest songs and how you play.' },
      { icon: 'library', t: 'All songs', p: 'Browse the whole collection: sorted by year, title, artist or album, with a search that forgives typos.' },
      { icon: 'album', t: 'Themes and decades', p: 'Only the 80s? Only party classics, only German songs, only your nemeses? Build the round the way you like.' },
      { icon: 'trophy', t: 'No draws', p: 'When two are level, a tiebreak decides: one song each, until one person leads.' }
    ] as Item[],

    helpKicker: 'Help',
    helpTitle: 'Questions and answers',
    faq: [
      {
        q: 'How do I get in?',
        a: [
          'Sign in with Google or register with an e-mail address and password. With e-mail you first get a confirmation link.',
          'mxtape is a private game: new accounts are approved by hand. Until then you see a waiting room that opens by itself once you are in.'
        ]
      },
      {
        q: 'Does everyone need an account?',
        a: [
          'No. Whoever opens a room needs one. Everyone else can join as a guest through the link or QR code, with just a name. Guests need no account and only see that one room.'
        ]
      },
      {
        q: 'What do I need to play?',
        a: [
          'A current browser on a phone, tablet or computer, and a speaker. You can put mxtape on your home screen like an app (“Add to Home Screen” or “Install”).'
        ]
      },
      {
        q: 'Why is no music playing?',
        a: [
          'Phones only play sound after a tap. After a reload you will see “Tap to play” under the record – one tap is enough.',
          'Also check the volume and the mute switch. In a room with “Together in the room”, the music comes from the device of whoever is on turn, or from the TV.'
        ]
      },
      {
        q: 'How does an objection work?',
        a: [
          'After a card is placed and before it is revealed, the others can object and pick another gap. If the placed card was wrong and the objection right, the objector gets the card. The objection is used up either way.',
          'Everyone (or every team) has three objections per round. There is no objection on the first card, in Hardcore mode or in a tiebreak.'
        ]
      },
      {
        q: 'How does Hardcore score?',
        a: [
          'Title right: 5 points. Artist right: 5 points. Year exact: 5, one year off: 2, two years off: 1. At most 15 points per song.',
          'Small typos, missing articles or “and” instead of “&” still count. For songs with several artists, one of them is enough.'
        ]
      },
      {
        q: 'How does the daily round work?',
        a: [
          'Everyone gets the same songs on the same day, in the same order. You play until a card is wrong for the first time – your streak is the number of songs placed right.',
          'You can pause and carry on later, even on another device. You cannot start over that day. Afterwards you can challenge chosen friends by e-mail.'
        ]
      },
      {
        q: 'What happens if someone loses the connection?',
        a: [
          'Short drop-outs are bridged. If someone is gone for more than 30 seconds, they are skipped until they are back.',
          'If the device running the round drops out, another account in the room can take over after 30 seconds. So that nobody holds a round up, every step also has a time limit.'
        ]
      },
      {
        q: 'A year is wrong – what can I do?',
        a: [
          'Under every revealed song there is “Something wrong?”. Report a wrong year, a wrong version, bad audio or a wrong cover there. If the report holds up, the correction then applies for everyone right away.'
        ]
      },
      {
        q: 'What happens to my data?',
        a: [
          'Your account, rounds, achievements and settings are stored, so you can carry on on any device. No ads, no tracking cookies; usage is only counted anonymously, without cookies.',
          'In the settings you can download everything, delete your game data or the whole account. The privacy policy has the details.'
        ]
      }
    ] as Faq[],
    helpMore: 'Still have a question?',
    helpMail: 'Send an e-mail',

    ctaTitle: 'Ready for the first round?',
    ctaLead: 'Sign in, open a room, put the record on.',
    allSongsNote: 'Song details and years to the best of our knowledge; please report mistakes in the game.'
}

export const ABOUT: Record<Lang, AboutContent> = { de, en }

export function useAbout(): AboutContent {
  return ABOUT[useLang().lang]
}
