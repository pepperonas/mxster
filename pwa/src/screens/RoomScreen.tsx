/**
 * /room/:code — a room: the lobby while people gather, then the round itself.
 *
 * Lobby: the code big in poster type, the QR code and the link to share,
 * who is here (online dot, guest badge), friends to invite. The host starts
 * the round once two people are in; everyone else waits for that.
 */
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { useAuth } from '@/auth/AuthContext'
import { useGame, useGameHistory, useUI } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { Icon } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { QrCode } from '@/components/ui/QrCode'
import { GameRound } from './GameScreen'
import { RoomProvider, useRoom } from '@/online/RoomContext'
import { roomApi, roomLink } from '@/online/roomApi'
import { sanitizeResult } from '@/online/sanitize'
import { friendsApi, type Person } from '@/online/friendsApi'
import type { Member } from '@/online/protocol'
import { MODE_COPY } from '@/game/modeCopy'
import { GOAL_LABEL } from '@/game/roundEnd'
import { getPreviewPlayer } from '@/services/PreviewPlayerService'
import { spring } from '@/motion/springs'
import type { GameMode } from '@/types'
import { msg, useMessages } from '@/i18n'
import { roomsText } from '@/i18n/messages/rooms'

export function RoomScreen() {
  const { code = '' } = useParams()
  return (
    <RoomProvider key={code} code={code}>
      <Room />
    </RoomProvider>
  )
}

const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`

function Room() {
  const room = useRoom()!
  const game = useGame()
  const navigate = useAppNavigate()
  const { state } = useAuth()
  const t = useMessages(roomsText)
  const account = state.kind === 'signed-in' && state.me.status === 'approved'

  // Not (or no longer) in this room
  useEffect(() => {
    if (room.info && !room.info.me) navigate(`/r/${room.code}`, { replace: true })
  }, [room.info, room.code, navigate])

  // Leaving the room leaves its game behind (read the game at that moment)
  const gameRef = useRef(game)
  gameRef.current = game
  useEffect(
    () => () => {
      getPreviewPlayer().stop()
      if (gameRef.current.onlineRoom) gameRef.current.resetGame()
    },
    []
  )

  useSaveOnlineResult(account)

  if (room.problem) return <RoomProblem kind={room.problem} />
  if (!room.info || room.seat === null) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <p className="meta" role="status">
          {t.connecting}
        </p>
      </div>
    )
  }

  const inGame = game.isGameStarted && game.onlineRoom === room.code
  if (inGame) return <GameRound key={game.startedAt} onRematch={() => {}} />
  return <Lobby account={account} />
}

/** Account players keep the round in their own history (the host's flow does that itself). */
function useSaveOnlineResult(account: boolean) {
  const room = useRoom()!
  const game = useGame()
  const { saveGame } = useGameHistory()
  const saved = useRef<object | null>(null)
  useEffect(() => {
    const result = room.result
    if (!account || room.role !== 'player' || !result || saved.current === result) return
    saved.current = result
    // The result comes from another device: check it before it goes into this account
    const clean = sanitizeResult(result, game.gameMode, game.turnLog)
    if (!clean) return
    const started = typeof game.startedAt === 'number' ? game.startedAt : 0
    const durationMs = started > 0 ? Date.now() - started : 0
    saveGame({
      winner: { name: clean.winner.name, cards: clean.winner.cards, score: clean.winner.score },
      players: clean.players,
      gameMode: clean.gameMode,
      turns: clean.turns,
      durationMs: durationMs > 0 && durationMs < 24 * 3600 * 1000 ? durationMs : undefined
    })
  }, [account, room.result, room.role, game.gameMode, game.turnLog, game.startedAt, saveGame])
}

function RoomProblem({ kind }: { kind: string }) {
  const navigate = useAppNavigate()
  const t = useMessages(roomsText)
  const text = kind === 'kicked' ? t.kicked : kind === 'left' ? t.problem_left_round : kind === 'closed' ? t.closedByHost : kind === 'not_found' ? t.notFound : t.unreachable
  return (
    <div className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="space-y-5">
        <p className="text-title-lg">{text}</p>
        <button type="button" className="btn btn-tonal m3-state-layer" onClick={() => navigate('/', { replace: true })}>
          {t.toHome}
        </button>
      </div>
    </div>
  )
}

function Lobby({ account }: { account: boolean }) {
  const room = useRoom()!
  const game = useGame()
  const { addToast, showModal } = useUI()
  const navigate = useAppNavigate()
  const t = useMessages(roomsText)
  const info = room.info!
  const isHost = room.role === 'host'
  const link = roomLink(room.code)
  const options = info.options as { mode?: GameMode; goal?: number; decades?: number[]; challengesEnabled?: boolean; exotics?: boolean }
  const host = room.members.find((m) => m.host)
  const [starting, setStarting] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      addToast(msg(roomsText).linkCopied, 'success')
    } catch {
      addToast(msg(roomsText).copyFailed, 'warning')
    }
  }
  const share = async () => {
    try {
      await navigator.share({ title: 'mxtape', text: msg(roomsText).shareText(host?.name ?? msg(roomsText).someone), url: link })
    } catch {
      /* cancelled */
    }
  }

  const start = async () => {
    if (!options.mode) return
    setStarting(true)
    try {
      game.setGameMode(options.mode)
      game.setOptions({
        goal: options.goal ?? 10,
        decades: options.decades ?? [],
        challengesEnabled: options.challengesEnabled ?? true,
        exotics: options.exotics ?? false
      })
      game.setPlayers(
        room.members.map((mem) => ({ name: mem.name, seat: mem.seat, guest: mem.guest || undefined, timeline: [], cards: 0, score: 0 }))
      )
      game.loadGameState({ onlineRoom: room.code })
      game.startGame()
      await roomApi.setStatus(room.code, 'running')
    } catch {
      addToast(msg(roomsText).startFailed, 'error')
    } finally {
      setStarting(false)
    }
  }

  const leave = () =>
    showModal(isHost ? t.closeTitle : t.leaveTitle, <p className="text-body-lg">{isHost ? t.closeBody : t.leaveBody}</p>, [
      { text: t.stay },
      {
        text: isHost ? t.close : t.leave,
        variant: 'danger',
        onClick: () => {
          // The host closes the room for everyone; a player frees the seat
          if (isHost) void roomApi.setStatus(room.code, 'closed').catch(() => {})
          else void roomApi.leave(room.code).catch(() => {})
          navigate('/', { replace: true })
        }
      }
    ])

  const enough = room.members.length >= 2

  return (
    <div className="min-h-dvh pb-40">
      <header className="sticky top-0 z-30 bg-md-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl h-16 px-2 sm:px-4 flex items-center gap-1">
          <button type="button" className="icon-btn m3-state-layer" onClick={leave} aria-label={isHost ? t.closeRoom : t.leaveRoom}>
            <Icon name="close" />
          </button>
          <h1 className="text-title-md">{t.room}</h1>
          {room.connection !== 'open' && (
            <span className="ml-auto chip" role="status">
              {t.reconnecting}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 space-y-6">
        <section className="surface p-5 sm:p-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center" aria-label={t.inviteLabel}>
          <div className="justify-self-center">
            <QrCode value={link} size={176} label={t.qrLabel(formatCode(room.code))} />
          </div>
          <div className="space-y-3 min-w-0">
            <p className="text-label-lg text-md-on-surface-variant">{t.roomCode}</p>
            <p className="text-poster text-md-on-surface tabular" style={{ fontSize: 'clamp(2rem, 9vw, 2.8rem)' }}>
              {formatCode(room.code)}
            </p>
            <p className="text-body-sm text-md-on-surface-variant break-all">{link}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-tonal m3-state-layer" onClick={() => void copy()}>
                {t.copyLink}
              </button>
              {'share' in navigator && (
                <button type="button" className="btn btn-outline m3-state-layer" onClick={() => void share()}>
                  {t.share}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="surface p-5 space-y-2" aria-label={t.roundLabel}>
          <p className="text-title-md">{options.mode ? MODE_COPY[options.mode].name : t.roundFallback}</p>
          <p className="meta">
            {options.goal ? `${GOAL_LABEL[options.goal as keyof typeof GOAL_LABEL] ?? ''} · ` : ''}
            {info.music === 'room' ? t.musicAtHost : t.musicOnEveryDevice}
          </p>
        </section>

        <section aria-labelledby="people-h">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="people-h" className="text-title-lg">
              {t.whoPlays}
            </h2>
            <span className="meta tabular">
              {room.members.length} / {info.maxSeats}
            </span>
          </div>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {room.members.map((mem) => (
                <MemberRow key={mem.seat} member={mem} me={mem.seat === room.seat} canKick={isHost && !mem.host} />
              ))}
            </AnimatePresence>
          </ul>
        </section>

        {account && <InviteFriends />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-md-surface via-md-surface/95 to-transparent pt-8 safe-bottom">
        <div className="mx-auto max-w-3xl px-4 pb-4">
          {isHost ? (
            <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={!enough || starting} onClick={() => void start()}>
              <Icon name="play" />
              {enough ? t.startRound : t.waitingForPlayers}
            </button>
          ) : (
            <p className="text-center text-title-md text-md-on-surface py-3" role="status">
              {room.status === 'running' ? t.starting : t.waitForHost(host?.name ?? t.theHost)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function MemberRow({ member, me, canKick }: { member: Member; me: boolean; canKick: boolean }) {
  const room = useRoom()!
  const { showModal } = useUI()
  const t = useMessages(roomsText)
  const kick = () =>
    showModal(t.removeTitle(member.name), <p className="text-body-lg">{t.removeBody(member.name)}</p>, [
      { text: t.keep },
      { text: t.remove, variant: 'danger', onClick: () => void roomApi.kick(room.code, member.seat).catch(() => {}) }
    ])
  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: spring.effectsDefault }}
      transition={spring.spatialDefault}
      className="row"
    >
      <span className="relative">
        <Avatar name={member.name} picture={member.picture || undefined} size={44} />
        <span
          className={`absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full border-2 border-md-surface-container-low ${member.online ? 'bg-md-success' : 'bg-md-outline'}`}
          aria-label={member.online ? t.online : t.offline}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-title-md truncate">{member.name}</span>
          {me && <span className="shrink-0 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container px-2 text-label-md">{t.you}</span>}
        </span>
        <span className="block meta">{member.host ? t.host : member.guest ? t.guest : t.withAccount}</span>
      </span>
      {canKick && (
        <button type="button" className="icon-btn m3-state-layer text-md-on-surface-variant" onClick={kick} aria-label={t.removeLabel(member.name)}>
          <Icon name="close" />
        </button>
      )}
    </m.li>
  )
}

function InviteFriends() {
  const room = useRoom()!
  const { addToast } = useUI()
  const t = useMessages(roomsText)
  const [friends, setFriends] = useState<Person[] | null>(null)
  const [invited, setInvited] = useState<number[]>([])
  useEffect(() => {
    friendsApi
      .list()
      .then((l) => setFriends(l.friends))
      .catch(() => setFriends([]))
  }, [])
  const inRoom = new Set(room.members.map((mem) => mem.userId).filter(Boolean))
  const open = (friends ?? []).filter((f) => !inRoom.has(f.id))

  const invite = async (f: Person) => {
    try {
      await roomApi.invite(room.code, f.id)
      setInvited((v) => [...v, f.id])
    } catch {
      addToast(msg(roomsText).inviteFailed, 'error')
    }
  }

  return (
    <section aria-labelledby="friends-h" className="space-y-3">
      <h2 id="friends-h" className="text-title-lg">
        {t.inviteFriends}
      </h2>
      {friends === null ? (
        <p className="meta">{t.loadingFriends}</p>
      ) : open.length === 0 ? (
        <p className="meta">{friends.length === 0 ? t.noFriends : t.allFriendsHere}</p>
      ) : (
        <ul className="space-y-2">
          {open.map((f) => (
            <li key={f.id} className="row">
              <Avatar name={f.name} picture={f.picture || undefined} size={40} />
              <span className="flex-1 min-w-0 text-title-md truncate">{f.name}</span>
              <button
                type="button"
                className="btn btn-tonal m3-state-layer"
                disabled={invited.includes(f.id)}
                onClick={() => void invite(f)}
              >
                {invited.includes(f.id) ? t.invited : t.invite}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
