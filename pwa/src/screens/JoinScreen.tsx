/**
 * /r/:code — the link someone shared. Works without an account: a guest types
 * a name and is in. With an approved account one tap is enough. Whoever
 * already sits in the room goes straight on.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { m } from 'motion/react'
import { useAuth } from '@/auth/AuthContext'
import { ApiError, LOGIN_URL } from '@/api/client'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { roomApi } from '@/online/roomApi'
import type { RoomInfo } from '@/online/protocol'
import { spring } from '@/motion/springs'

/** Remembered across the Google sign-in, so the link still leads into the room. */
export const PENDING_ROOM_KEY = 'mx_pending_room'

const PROBLEM: Record<string, string> = {
  room_not_found: 'Diesen Raum gibt es nicht. Prüf den Link oder frag nach einem neuen.',
  room_started: 'Die Runde läuft schon. Neue Leute können erst bei der nächsten Runde dazukommen.',
  room_closed: 'Diese Runde ist vorbei.',
  room_full: 'Der Raum ist voll.'
}

export function JoinScreen() {
  const { code = '' } = useParams()
  const navigate = useAppNavigate()
  const { state } = useAuth()
  const approved = state.kind === 'signed-in' && state.me.status === 'approved'
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    roomApi
      .read(code)
      .then((r) => {
        if (r.me) navigate(`/room/${r.code}`, { replace: true })
        else if (r.status !== 'lobby') setProblem(r.status === 'running' ? 'room_started' : 'room_closed')
        else setRoom(r)
      })
      .catch((e) => setProblem(e instanceof ApiError ? e.code : 'unreachable'))
  }, [code, navigate])

  const join = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!room) return
    setBusy(true)
    setError(null)
    try {
      const r = await roomApi.join(room.code, approved ? undefined : name.trim())
      navigate(`/room/${r.code}`, { replace: true })
    } catch (err) {
      const c = err instanceof ApiError ? err.code : 'unreachable'
      if (PROBLEM[c]) setProblem(c)
      else setError(err instanceof ApiError ? err.message : 'Keine Verbindung. Bitte nochmal versuchen.')
    } finally {
      setBusy(false)
    }
  }

  const signIn = () => {
    try {
      localStorage.setItem(PENDING_ROOM_KEY, code)
    } catch {
      /* private mode */
    }
    window.location.href = LOGIN_URL
  }

  return (
    <div className="min-h-dvh grid place-items-center px-5 py-10">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.spatialDefault}
        className="w-full max-w-sm text-center"
      >
        <div className="mx-auto w-40 h-40">
          <Vinyl size="100%" spinning={!problem} />
        </div>
        <p className="mt-6 text-poster text-md-on-surface" style={{ fontSize: '2.2rem' }}>
          mxtape
        </p>

        {problem ? (
          <div className="mt-6 space-y-5">
            <p className="text-body-lg text-md-on-surface">{PROBLEM[problem] ?? 'Der Raum ist gerade nicht erreichbar.'}</p>
            <button type="button" className="btn btn-tonal m3-state-layer" onClick={() => navigate('/', { replace: true })}>
              Zur Startseite
            </button>
          </div>
        ) : !room ? (
          <p className="mt-6 meta" role="status">
            Raum wird geladen …
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            <p className="text-title-lg text-md-on-surface">{room.host.name} lädt dich zu einer Runde ein</p>
            <p className="meta">
              {room.members.length} {room.members.length === 1 ? 'Person ist' : 'Personen sind'} schon da ·{' '}
              {room.music === 'room' ? 'Musik läuft beim Gastgeber' : 'Musik läuft auf jedem Gerät'}
            </p>

            {approved ? (
              <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={busy} onClick={() => void join()}>
                <Icon name="play" />
                Beitreten
              </button>
            ) : (
              <form onSubmit={join} className="space-y-3 text-left">
                <label htmlFor="guest-name" className="block text-label-lg text-md-on-surface-variant">
                  Wie sollen dich die anderen sehen?
                </label>
                <input
                  id="guest-name"
                  className="field"
                  value={name}
                  maxLength={20}
                  autoComplete="nickname"
                  autoFocus
                  placeholder="Dein Name"
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby="guest-hint"
                />
                <p id="guest-hint" className="text-body-sm text-md-on-surface-variant">
                  Ohne Konto: Für dich wird nichts gespeichert.
                </p>
                <button type="submit" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={busy || name.trim().length < 2}>
                  Als Gast beitreten
                </button>
                <button type="button" className="btn btn-text m3-state-layer w-full" onClick={signIn}>
                  Lieber mit Google anmelden
                </button>
              </form>
            )}
            {error && (
              <p className="text-body-sm text-md-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </m.div>
    </div>
  )
}
