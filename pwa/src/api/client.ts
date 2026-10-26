/**
 * Thin client for the mxster API (same origin, session cookie).
 * State-changing requests carry the CSRF token from /api/me.
 */

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'blocked'

export interface Me {
  id: number
  email: string
  name: string
  picture: string
  status: AccountStatus
  isAdmin: boolean
  csrf: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public body: Record<string, unknown> = {}
  ) {
    super(message)
  }
}

let csrfToken = ''
export function setCsrfToken(token: string) {
  csrfToken = token
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const method = (rest.method ?? 'GET').toUpperCase()
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...headers
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body
  })
  const text = await res.text()
  let body: Record<string, unknown> = {}
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    // Not JSON (e.g. a proxy error page) — fall through with an empty body
    if (res.ok) throw new ApiError(res.status, 'bad_response', 'Unerwartete Antwort vom Server.')
  }
  if (!res.ok) {
    // Session ended or access withdrawn while the app is open: let the gate re-check.
    if ((res.status === 401 || (res.status === 403 && body.code === 'not_approved')) && path !== '/api/session') {
      window.dispatchEvent(new Event(SESSION_LOST))
    }
    throw new ApiError(res.status, String(body.code ?? 'error'), String(body.message ?? res.statusText), body)
  }
  return body as T
}

export const LOGIN_URL = '/api/auth/login'
export const SESSION_LOST = 'mx:session-lost'

/** Login errors the callback reports back as ?login_error=… */
export const LOGIN_ERRORS: Record<string, string> = {
  cancelled: 'Die Anmeldung wurde abgebrochen.',
  state_mismatch: 'Die Anmeldung ist abgelaufen. Bitte versuch es noch einmal.',
  exchange_failed: 'Google hat die Anmeldung nicht bestätigt. Bitte versuch es noch einmal.',
  invalid_token: 'Dieses Google-Konto konnte nicht geprüft werden.'
}
