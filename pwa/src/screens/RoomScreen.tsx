/**
 * /room/:code — a room: the lobby while people gather, then the round itself.
 *
 * Lobby: the code big in poster type, the QR code and the link to share,
 * who is here (online dot, guest badge), friends to invite. The host starts
 * the round once two people are in; everyone else waits for that.
 */
import { markSaved, resultKey, wasSaved } from '@/online/savedResults'
import { ownRoundAchievements } from '@/online/ownAchievements'
import { ownPlayerName } from '@/game/owner'
import { songById } from '@/data/catalogue'
import { useAchievements } from '@/contexts/AchievementContext'
import { useEffect, useRef, useState } from 'react'
import { COLLECTIONS, GENRE_GROUPS, type Collection } from '@/game/songPool'
import { buildLineup, playingMembers, teamsPossible } from '@/online/lineup'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
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
import { createBotPlayers } from '@/services/botPlayer'
import type { Player } from '@/types'
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

  useSaveOnlineResult(account, state.kind === 'signed-in' ? state.me.name : '')

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
function useSaveOnlineResult(account: boolean, accountName: string) {
  const room = useRoom()!
  const game = useGame()
  const { saveGame, history } = useGameHistory()
  const { applyEffects } = useAchievements()
  const saved = useRef<string | null>(null)
  useEffect(() => {
    const result = room.result
    if (!account || room.role !== 'player' || !result) return
    // The same result comes again after a reconnect or reload: save it once
    const key = resultKey(room.code, result)
    if (saved.current === key || wasSaved(key)) return
    saved.current = key
    markSaved(key)
    // The result comes from another device: check it before it goes into this account
    const clean = sanitizeResult(result, game.gameMode, game.turnLog)
    if (!clean) return
    const started = typeof game.startedAt === 'number' ? game.startedAt : 0
    const durationMs = started > 0 ? Date.now() - started : 0
    const keptMs = durationMs > 0 && durationMs < 24 * 3600 * 1000 ? durationMs : undefined
    const entry = saveGame({
      winner: { name: clean.winner.name, cards: clean.winner.cards, score: clean.winner.score },
      players: clean.players,
      gameMode: clean.gameMode,
      turns: clean.turns,
      durationMs: keptMs
    })
    // The host's device credits everyone into the host's account; this one
    // evaluates the same rules for its own seat, into this account
    applyEffects(
      ownRoundAchievements({
        live: game.players,
        seat: room.seat,
        ownName: ownPlayerName(accountName),
        result: clean,
        games: [entry, ...(history ?? []).filter((g) => g.id !== entry.id)],
        entry,
        durationMinutes: keptMs ? keptMs / 60000 : Infinity,
        finishedAt: Date.now(),
        genreOf: (id) => songById(id)?.genre
      })
    )
  }, [account, room.code, room.result, room.role, room.seat, game.gameMode, game.turnLog, game.startedAt, game.players, saveGame, history, applyEffects, accountName])
}

function RoomProblem({ kind }: { kind: string }) {
  const navigate = useAppNavigate()
  const t = useMessages(roomsText)
  const text = kind === 'replaced' ? t.replaced : kind === 'kicked' ? t.kicked : kind === 'left' ? t.problem_left_round : kind === 'closed' ? t.closedByHost : kind === 'not_found' ? t.notFound : t.unreachable
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

type Difficulty = 'easy' | 'medium' | 'hard'
/** `levels`: one strength per bot (bot 1, 2, 3). */
type LobbyPrefs = { bots: number; levels: Difficulty[]; teams: number }
const LEVELS: Difficulty[] = ['easy', 'medium', 'hard']
const lobbyKey = (code: string) => `mxtape_lobby_${code}`

function readLobbyPrefs(code: string): LobbyPrefs {
  const fallback: LobbyPrefs = { bots: 0, levels: ['medium', 'medium', 'medium'], teams: 0 }
  try {
    const raw = JSON.parse(sessionStorage.getItem(lobbyKey(code)) ?? 'null')
    if (!raw || typeof raw !== 'object') return fallback
    const count = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : 0)
    return {
      bots: count(raw.bots, 3),
      // older saves had one level for all bots
      levels: [0, 1, 2].map((i) => {
        const v = Array.isArray(raw.levels) ? raw.levels[i] : raw.difficulty
        return LEVELS.includes(v) ? v : 'medium'
      }),
      teams: count(raw.teams, 4)
    }
  } catch {
    return fallback
  }
}

function writeLobbyPrefs(code: string, prefs: LobbyPrefs) {
  try {
    sessionStorage.setItem(lobbyKey(code), JSON.stringify(prefs))
  } catch {
    /* private mode */
  }
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
  const options = info.options as {
    mode?: GameMode
    goal?: number
    decades?: number[]
    challengesEnabled?: boolean
    exotics?: boolean
    genres?: string[]
    collection?: Collection
    songIds?: string[] | null
    bonus?: boolean
  }
  const host = room.members.find((m) => m.host)
  const [starting, setStarting] = useState(false)
  // The host may fill up with bots or split the people into teams (not both)
  const saved = readLobbyPrefs(room.code)
  const [bots, setBots] = useState(saved.bots)
  const [levels, setLevels] = useState<Difficulty[]>(saved.levels)
  const [teams, setTeams] = useState(saved.teams)
  // A reload keeps them (per room, for this tab)
  useEffect(() => writeLobbyPrefs(room.code, { bots, levels, teams }), [room.code, bots, levels, teams])
  const people = playingMembers(room.members)
  const maxTeamCount = teamsPossible(room.members)
  const teamsOn = teams >= 2 && maxTeamCount >= 2
  const screens = room.members.filter((m) => m.display)

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
        exotics: options.exotics ?? false,
        genres: Array.isArray(options.genres) ? options.genres.filter((g) => GENRE_GROUPS.includes(g as never)) : [],
        collection: COLLECTIONS.includes(options.collection as never) ? (options.collection as Collection) : 'all',
        songIds: Array.isArray(options.songIds) ? options.songIds.filter((x) => typeof x === 'string').slice(0, 200) : null,
        bonus: Boolean(options.bonus)
      })
      // The room is running on the server first; only then does the round start
      // here (a failed call must not leave the host playing in a lobby)
      await roomApi.setStatus(room.code, 'running')
      game.setPlayers(buildLineup(room.members, { bots: teamsOn ? 0 : bots, difficulty: levels.slice(0, bots), teams: teamsOn ? teams : 0 }))
      game.loadGameState({ onlineRoom: room.code })
      game.startGame()
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

  const enough = people.length + (teamsOn ? 0 : bots) >= 2 && (!teamsOn || people.length >= 4)

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
              {people.length} / {info.maxSeats - screens.length}
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

        {isHost && (
          <section className="surface p-5 space-y-5" aria-labelledby="fill-h">
            <h2 id="fill-h" className="text-title-md">
              {t.fillUp}
            </h2>
            <div className="space-y-2">
              <h3 className="text-title-sm">{t.bots}</h3>
              <SegmentedControl
                label={t.bots}
                value={teamsOn ? 0 : bots}
                onChange={(n) => {
                  setBots(n)
                  if (n > 0) setTeams(0)
                }}
                segments={[0, 1, 2, 3].map((n) => ({ value: n, label: n === 0 ? t.none : String(n) }))}
              />
              {bots > 0 && !teamsOn && (
                <ul className="space-y-2" data-bot-levels>
                  {createBotPlayers(bots, levels.slice(0, bots), people.map((m) => ({ name: m.name }) as Player)).map((b, i) => (
                    <li key={b.name} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-m3-lg bg-md-surface-container-high px-3 py-2">
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon name="bot" size={18} className="text-md-on-surface-variant shrink-0" />
                        <span className="text-body-lg truncate">{b.name}</span>
                      </span>
                      <span className="w-full min-[440px]:w-auto">
                        <SegmentedControl
                          label={t.botLevelOf(b.name)}
                          value={levels[i]}
                          onChange={(d) => setLevels((prev) => prev.map((l, j) => (j === i ? d : l)))}
                          segments={LEVELS.map((d) => ({ value: d, label: t[`level_${d}`] }))}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="meta">{t.botsHint}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-title-sm">{t.teams}</h3>
              {maxTeamCount >= 2 && (
              <SegmentedControl
                label={t.teams}
                value={teamsOn ? teams : 0}
                onChange={(n) => {
                  setTeams(n)
                  if (n >= 2) setBots(0)
                }}
                segments={[0, 2, 3, 4]
                  .filter((n) => n === 0 || n <= maxTeamCount)
                  .map((n) => ({ value: n, label: n === 0 ? t.none : t.teamCount(n) }))}
              />
              )}
              <p className="meta">{maxTeamCount >= 2 ? t.teamsHint : t.teamsNeedPeople(4)}</p>
            </div>
          </section>
        )}

        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-md-surface-container-highest text-md-on-surface-variant">
            <Icon name="tv" size={20} />
          </span>
          <p className="meta">{t.screenTip}</p>
        </div>

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
        <span className="block meta">{member.display ? t.screenLabel : member.host ? t.host : member.guest ? t.guest : t.withAccount}</span>
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
