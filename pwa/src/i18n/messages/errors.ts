/**
 * Texts for errors: the server's error codes (it answers {code, message} in
 * German), login errors from the OAuth callback, generic fallbacks.
 */
import { defineMessages, msg } from '../define'
import { getLang } from '../lang'

export const errorsText = defineMessages({
  de: {
    badResponse: 'Unerwartete Antwort vom Server.',
    generic: 'Das hat nicht geklappt.',
    tryAgain: 'Das hat nicht geklappt. Bitte nochmal versuchen.',
    noConnection: 'Keine Verbindung. Bitte nochmal versuchen.',
    loginFailed: 'Die Anmeldung hat nicht geklappt. Bitte versuch es noch einmal.'
  },
  en: {
    badResponse: 'Unexpected answer from the server.',
    generic: 'That did not work.',
    tryAgain: 'That did not work. Please try again.',
    noConnection: 'No connection. Please try again.',
    loginFailed: 'Signing in did not work. Please try again.'
  }
})

/** Login errors the callback reports back as ?login_error=… */
const loginErrors = defineMessages({
  de: {
    cancelled: 'Die Anmeldung wurde abgebrochen.',
    state_mismatch: 'Die Anmeldung ist abgelaufen. Bitte versuch es noch einmal.',
    exchange_failed: 'Google hat die Anmeldung nicht bestätigt. Bitte versuch es noch einmal.',
    invalid_token: 'Dieses Google-Konto konnte nicht geprüft werden.',
    verify_expired: 'Dieser Bestätigungslink ist abgelaufen. Melde dich mit E-Mail und Passwort an, dann schicken wir dir einen neuen.'
  },
  en: {
    cancelled: 'Signing in was cancelled.',
    state_mismatch: 'Signing in timed out. Please try again.',
    exchange_failed: 'Google did not confirm the sign-in. Please try again.',
    invalid_token: 'This Google account could not be verified.',
    verify_expired: 'This confirmation link has expired. Sign in with your email and password and we will send you a new one.'
  }
})

export function loginErrorText(code: string): string {
  const table = msg(loginErrors) as Record<string, string>
  return Object.prototype.hasOwnProperty.call(table, code) ? table[code] : msg(errorsText).loginFailed
}

/** The server's error codes (server/app). German matches the server's own messages. */
const serverErrors = defineMessages({
  de: {
    bad_action: 'Unbekannte Aktion.',
    bad_email: 'Diese E-Mail-Adresse sieht nicht gültig aus.',
    email_unverified: 'Bitte bestätige zuerst deine E-Mail-Adresse.',
    invalid_credentials: 'E-Mail-Adresse oder Passwort stimmen nicht.',
    name_required: 'Wie sollen wir dich nennen?',
    password_long: 'Das Passwort ist zu lang.',
    password_short: 'Das Passwort braucht mindestens 8 Zeichen.',
    reset_expired: 'Dieser Link ist abgelaufen oder wurde schon benutzt.',
    bad_music: 'Unbekannter Musikmodus.',
    bad_name: 'Bitte einen Namen mit 2 bis 20 Zeichen eingeben.',
    bad_options: 'Zu viele Optionen.',
    bad_seat: 'Diesen Platz gibt es nicht.',
    bad_status: 'Unbekannter Status.',
    bad_transition: 'Das geht in diesem Zustand nicht.',
    conflict: 'Veralteter Stand.',
    csrf_invalid: 'Ungültiges CSRF-Token.',
    no_request: 'Keine offene Anfrage.',
    not_approved: 'Dein Konto ist noch nicht freigeschaltet.',
    not_friends: 'Einladen geht nur unter Freunden.',
    not_host: 'Nur der Gastgeber kann das.',
    not_member: 'Nur wer im Raum ist, kann einladen.',
    oauth_unconfigured: 'Google-Anmeldung ist nicht eingerichtet.',
    rate_limited: 'Zu viele Anfragen. Bitte kurz warten.',
    room_closed: 'Diese Runde ist vorbei.',
    room_full: 'Der Raum ist voll.',
    left_round: 'Du hast diese Runde verlassen.',
    host_cannot_leave: 'Als Gastgeber beendest du den Raum.',
    room_not_found: 'Diesen Raum gibt es nicht.',
    self_lockout: 'Admin-Konten lassen sich nicht sperren.',
    too_large: 'Die Daten sind zu groß.',
    unauthorized: 'Nicht angemeldet.',
    user_not_found: 'Diese Person gibt es nicht.'
  },
  en: {
    bad_action: 'Unknown action.',
    bad_email: 'This email address does not look valid.',
    email_unverified: 'Please confirm your email address first.',
    invalid_credentials: 'Email address or password is wrong.',
    name_required: 'What should we call you?',
    password_long: 'The password is too long.',
    password_short: 'The password needs at least 8 characters.',
    reset_expired: 'This link has expired or was already used.',
    bad_music: 'Unknown music mode.',
    bad_name: 'Please enter a name with 2 to 20 characters.',
    bad_options: 'Too many options.',
    bad_seat: 'This seat does not exist.',
    bad_status: 'Unknown status.',
    bad_transition: 'That is not possible right now.',
    conflict: 'Out of date.',
    csrf_invalid: 'Invalid CSRF token.',
    no_request: 'No open request.',
    not_approved: 'Your account is not approved yet.',
    not_friends: 'You can only invite friends.',
    not_host: 'Only the host can do that.',
    not_member: 'Only people in the room can invite.',
    oauth_unconfigured: 'Google sign-in is not set up.',
    rate_limited: 'Too many requests. Please wait a moment.',
    room_closed: 'This round is over.',
    room_full: 'The room is full.',
    left_round: 'You left this round.',
    host_cannot_leave: 'As the host you close the room.',
    room_not_found: 'This room does not exist.',
    self_lockout: 'Admin accounts cannot be blocked.',
    too_large: 'The data is too large.',
    unauthorized: 'Not signed in.',
    user_not_found: 'This person does not exist.'
  }
})

/**
 * The text for an error from the API. German: the server's own message (it is
 * written in German). English: the translation of the error code, otherwise
 * the fallback — some codes carry more than one message on the server
 * (room_started, not_found), those get the caller's fallback.
 */
export function apiErrorText(err: unknown, fallback: string = msg(errorsText).generic): string {
  if (!err || typeof err !== 'object' || !('code' in err)) return fallback
  const code = String((err as { code: unknown }).code)
  const message = 'message' in err ? String((err as { message: unknown }).message ?? '') : ''
  if (getLang() === 'de') return message || fallback
  const table = msg(serverErrors) as Record<string, string>
  return Object.prototype.hasOwnProperty.call(table, code) ? table[code] : fallback
}
