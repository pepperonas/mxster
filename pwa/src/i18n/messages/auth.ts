import { defineMessages } from '../define'

export const authText = defineMessages({
  de: {
    pitch: 'Hört einen Song, ratet das Jahr und legt ihn an die richtige Stelle eurer Zeitleiste.',
    signIn: 'Mit Google anmelden',
    leaving: 'Weiter zu Google …',
    privacyNote:
      'Neue Konten werden einzeln freigeschaltet. Gespeichert werden nur dein Name, deine E-Mail-Adresse und eure Spielstände.',
    pendingTitle: (name: string) => (name ? `Fast geschafft, ${name}.` : 'Fast geschafft.'),
    pendingBody:
      'Dein Konto wartet auf Freischaltung. Sobald es freigegeben ist, geht es hier von selbst weiter — du musst nichts neu laden.',
    rejectedTitle: 'Kein Zugang.',
    rejectedBody: 'Dieses Konto wurde nicht freigeschaltet. Wenn du glaubst, dass das ein Versehen ist, sprich Martin direkt an.',
    blockedTitle: 'Zugang gesperrt.',
    blockedBody: 'Dieses Konto ist gesperrt. Wenn du glaubst, dass das ein Versehen ist, sprich Martin direkt an.',
    offlineTitle: 'Keine Verbindung.',
    offlineBody: 'Der Server antwortet gerade nicht. Prüf deine Internetverbindung und versuch es noch einmal.',
    checking: 'Prüfe …',
    checkNow: 'Jetzt prüfen',
    signOut: 'Abmelden'
  },
  en: {
    pitch: 'Hear a song, guess the year and put it in the right place on your timeline.',
    signIn: 'Sign in with Google',
    leaving: 'On to Google …',
    privacyNote: 'New accounts are approved one by one. We only store your name, your email address and your games.',
    pendingTitle: (name: string) => (name ? `Almost there, ${name}.` : 'Almost there.'),
    pendingBody: 'Your account is waiting for approval. Once it is approved, this page moves on by itself — no need to reload.',
    rejectedTitle: 'No access.',
    rejectedBody: 'This account was not approved. If you think this is a mistake, talk to Martin directly.',
    blockedTitle: 'Access blocked.',
    blockedBody: 'This account is blocked. If you think this is a mistake, talk to Martin directly.',
    offlineTitle: 'No connection.',
    offlineBody: 'The server is not answering right now. Check your internet connection and try again.',
    checking: 'Checking …',
    checkNow: 'Check now',
    signOut: 'Sign out'
  }
})
