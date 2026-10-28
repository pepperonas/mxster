import { defineMessages } from '../define'

export const dailyText = defineMessages({
  de: {
    title: 'Tagesrunde',
    homeTitle: 'Tagesrunde',
    homeOpen: (n: number) => `${n} Songs, heute für alle gleich`,
    homeDone: (score: number, n: number) => `Heute: ${score} von ${n} richtig`,
    intro: (n: number) =>
      `Jeden Tag dieselben ${n} Songs für alle. Du legst sie allein auf deine Zeitleiste – ein Versuch pro Tag. Danach siehst du, wie deine Freunde abgeschnitten haben.`,
    start: 'Tagesrunde starten',
    starting: 'Wird vorbereitet …',
    yourResult: 'Dein Ergebnis heute',
    scoreOf: (score: number, n: number) => `${score} von ${n}`,
    board: 'Deine Freunde heute',
    boardEmpty: 'Von deinen Freunden hat heute noch niemand gespielt.',
    noFriends: 'Unter „Spieler“ findest du Freunde – dann seht ihr eure Ergebnisse hier.',
    you: 'du',
    loadFailed: 'Die Tagesrunde konnte nicht geladen werden.',
    reload: 'Erneut laden',
    nextTomorrow: 'Morgen gibt es neue Songs.',
    gameOverTitle: 'Tagesrunde geschafft',
    gameOverScore: (_score: number, _n: number) => 'richtig gelegt',
    toBoard: 'Zur Bestenliste',
    savedFailed: 'Das Ergebnis konnte nicht gespeichert werden.',
    alreadyPlayed: 'Die Tagesrunde ist heute schon gespielt.'
  },
  en: {
    title: 'Daily round',
    homeTitle: 'Daily round',
    homeOpen: (n: number) => `${n} songs, the same for all today`,
    homeDone: (score: number, n: number) => `Today: ${score} of ${n} right`,
    intro: (n: number) =>
      `The same ${n} songs for everyone, every day. You place them on your timeline alone – one try a day. Afterwards you see how your friends did.`,
    start: 'Start the daily round',
    starting: 'Getting ready …',
    yourResult: 'Your result today',
    scoreOf: (score: number, n: number) => `${score} of ${n}`,
    board: 'Your friends today',
    boardEmpty: 'None of your friends has played today yet.',
    noFriends: 'Find friends under "Players" – then you see your results here.',
    you: 'you',
    loadFailed: 'The daily round could not be loaded.',
    reload: 'Reload',
    nextTomorrow: 'New songs tomorrow.',
    gameOverTitle: 'Daily round done',
    gameOverScore: (_score: number, _n: number) => 'placed right',
    toBoard: 'To the leaderboard',
    savedFailed: 'The result could not be saved.',
    alreadyPlayed: 'The daily round has been played today already.'
  }
})
