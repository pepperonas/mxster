import { defineMessages } from '../define'

export const adminText = defineMessages({
  de: {
    title: 'Zugänge',
    tabPending: 'Wartend',
    tabApproved: 'Freigeschaltet',
    tabClosed: 'Abgelehnt',
    statusLabel: 'Status',
    loadFailed: 'Die Liste konnte nicht geladen werden.',
    reload: 'Erneut laden',
    loading: 'Lädt',
    undo: 'Rückgängig',
    done: (who: string, action: 'approve' | 'reject' | 'block' | 'unblock' | 'reset') =>
      `${who} ${
        {
          approve: 'ist freigeschaltet',
          unblock: 'ist wieder freigeschaltet',
          reject: 'wurde abgelehnt',
          block: 'ist gesperrt',
          reset: 'wartet wieder'
        }[action]
      }`,
    admin: 'Admin',
    reject: 'Ablehnen',
    approve: 'Freischalten',
    block: 'Sperren',
    approveAnyway: 'Doch freischalten',
    requested: (at: string) => `Angefragt ${at}`,
    lastSignIn: (at: string) => `Zuletzt angemeldet ${at}`,
    approved: 'Freigeschaltet',
    rejected: (at: string) => `Abgelehnt ${at}`,
    blocked: (at: string) => `Gesperrt ${at}`,
    emptyPendingTitle: 'Niemand wartet',
    emptyPendingText: 'Neue Anfragen erscheinen hier. Du bekommst zusätzlich eine E-Mail.',
    emptyApprovedTitle: 'Noch niemand freigeschaltet',
    emptyApprovedText: 'Freigeschaltete Konten können sofort mitspielen.',
    emptyClosedTitle: 'Keine abgelehnten Konten',
    emptyClosedText: 'Abgelehnte und gesperrte Konten landen hier.'
  },
  en: {
    title: 'Access',
    tabPending: 'Waiting',
    tabApproved: 'Approved',
    tabClosed: 'Rejected',
    statusLabel: 'Status',
    loadFailed: 'The list could not be loaded.',
    reload: 'Load again',
    loading: 'Loading',
    undo: 'Undo',
    done: (who: string, action: 'approve' | 'reject' | 'block' | 'unblock' | 'reset') =>
      `${who} ${
        {
          approve: 'is approved',
          unblock: 'is approved again',
          reject: 'was rejected',
          block: 'is blocked',
          reset: 'is waiting again'
        }[action]
      }`,
    admin: 'Admin',
    reject: 'Reject',
    approve: 'Approve',
    block: 'Block',
    approveAnyway: 'Approve after all',
    requested: (at: string) => `Requested ${at}`,
    lastSignIn: (at: string) => `Last signed in ${at}`,
    approved: 'Approved',
    rejected: (at: string) => `Rejected ${at}`,
    blocked: (at: string) => `Blocked ${at}`,
    emptyPendingTitle: 'Nobody is waiting',
    emptyPendingText: 'New requests show up here. You also get an email.',
    emptyApprovedTitle: 'Nobody approved yet',
    emptyApprovedText: 'Approved accounts can play right away.',
    emptyClosedTitle: 'No rejected accounts',
    emptyClosedText: 'Rejected and blocked accounts end up here.'
  }
})
