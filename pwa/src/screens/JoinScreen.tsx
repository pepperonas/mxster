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
import { useMessages } from '@/i18n'
import { roomsText, isRoomProblem } from '@/i18n/messages/rooms'
import { apiErrorText, errorsText } from '@/i18n/messages/errors'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { LegalLinks } from '@/legal/LegalScreen'

/** Remembered across the Google sign-in, so the link still leads into the room. */
export const PENDING_ROOM_KEY = 'mx_pending_room'

export function JoinScreen() {
  const { code = '' } = useParams()
  const navigate = useAppNavigate()
  const { state } = useAuth()
  const t = useMessages(roomsText)
  const te = useMessages(errorsText)
  const approved = state.kind === 'signed-in' && state.me.status === 'approved'
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  // Kept as the error itself, so the text follows a language switch
  const [error, setError] = useState<{ err: unknown } | null>(null)
  // TV mode: this device only shows the round (and plays the music). Players
  // join in the lobby; a screen may also join a running round
  const [asScreen, setAsScreen] = useState(() => new URLSearchParams(window.location.search).get('screen') === '1')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    roomApi
      .read(code)
      .then((r) => {
        if (r.me) navigate(`/room/${r.code}`, { replace: true })
        else if (r.status === 'running') {
          // Too late to play along — but a TV can still take over the screen and the music
          setRunning(true)
          setAsScreen(true)
          setRoom(r)
        } else if (r.status !== 'lobby') setProblem('room_closed')
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
      const r = asScreen
        ? await roomApi.join(room.code, t.screenName, true)
        : await roomApi.join(room.code, approved ? undefined : name.trim())
      navigate(`/room/${r.code}`, { replace: true })
    } catch (err) {
      const c = err instanceof ApiError ? err.code : 'unreachable'
      if (isRoomProblem(c)) setProblem(c)
      else setError({ err })
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
    <div className="relative min-h-dvh grid place-items-center px-5 py-10">
      <div className="absolute right-3 z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <LanguageSwitch />
      </div>
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
            <p className="text-body-lg text-md-on-surface">{isRoomProblem(problem) ? t[`problem_${problem}`] : t.unreachable}</p>
            <button type="button" className="btn btn-tonal m3-state-layer" onClick={() => navigate('/', { replace: true })}>
              {t.toHome}
            </button>
          </div>
        ) : !room ? (
          <p className="mt-6 meta" role="status">
            {t.loadingRoom}
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            <p className="text-title-lg text-md-on-surface">{t.invitesYou(room.host.name)}</p>
            {!running && (
              <p className="meta">
                {t.alreadyHere(room.members.length)} ·{' '}
                {room.music === 'room' ? t.musicAtHost : t.musicEverywhere}
              </p>
            )}

            {asScreen ? (
              <div className="space-y-3">
                <p className="text-body-md text-md-on-surface-variant" data-join-running={running || undefined}>
                  {running ? t.tvRunning : t.screenHint}
                </p>
                <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={busy} onClick={() => void join()}>
                  <Icon name="tv" />
                  {t.joinAsScreen}
                </button>
                {!running && (
                  <button type="button" className="btn btn-text m3-state-layer w-full" onClick={() => setAsScreen(false)}>
                    {t.joinAsPlayer}
                  </button>
                )}
              </div>
            ) : approved ? (
              <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={busy} onClick={() => void join()}>
                <Icon name="play" />
                {t.join}
              </button>
            ) : (
              <form onSubmit={join} className="space-y-3 text-left">
                <label htmlFor="guest-name" className="block text-label-lg text-md-on-surface-variant">
                  {t.guestNameLabel}
                </label>
                <input
                  id="guest-name"
                  className="field"
                  value={name}
                  maxLength={20}
                  autoComplete="nickname"
                  autoFocus
                  placeholder={t.guestNamePlaceholder}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby="guest-hint"
                />
                <p id="guest-hint" className="text-body-sm text-md-on-surface-variant">
                  {t.guestHint}
                </p>
                <button type="submit" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={busy || name.trim().length < 2}>
                  {t.joinAsGuest}
                </button>
                <button type="button" className="btn btn-text m3-state-layer w-full" onClick={signIn}>
                  {t.signInInstead}
                </button>
              </form>
            )}
            {!asScreen && (
              <button type="button" className="btn btn-text m3-state-layer w-full" onClick={() => setAsScreen(true)}>
                <Icon name="tv" size={18} />
                {t.useAsScreen}
              </button>
            )}
            {error && (
              <p className="text-body-sm text-md-error" role="alert">
                {error.err instanceof ApiError ? apiErrorText(error.err, te.tryAgain) : te.noConnection}
              </p>
            )}
          </div>
        )}
        <LegalLinks className="mt-10" />
      </m.div>
    </div>
  )
}
