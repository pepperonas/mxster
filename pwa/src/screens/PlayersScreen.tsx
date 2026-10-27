/**
 * Spieler — everyone who played with this account (and the quick picks):
 * add people, mark quick picks for the setup, open a person for their numbers,
 * rename, merge two spellings into one, or remove someone.
 */
import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { m } from 'motion/react'
import { useUI } from '@/contexts'
import { useMe } from '@/auth/AuthContext'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { SubPageHeader } from '@/shell/AppShell'
import { Icon } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { Switch } from '@/components/ui/Switch'
import { StatTile } from '@/components/charts/Bars'
import { DecadeProfile } from '@/components/charts/DecadeProfile'
import { usePlayers, type KnownPlayer } from '@/game/usePlayers'
import { FriendsSection } from './FriendsSection'
import { decadeLabel, DECADES } from '@/game/songPool'
import { decadeRates } from '@/game/stats'
import { formatDay } from '@/utils/format'
import { spring } from '@/motion/springs'

const MAX_NAME = 20
const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v * 100)} %`)

/** One line about a person: rounds, wins, hit rate. */
function line(p: KnownPlayer): string {
  const s = p.summary
  if (!s || s.games === 0) return 'Noch keine Runde gespielt'
  const parts = [`${s.games} ${s.games === 1 ? 'Runde' : 'Runden'}`, `${s.wins} ${s.wins === 1 ? 'Sieg' : 'Siege'}`]
  if (s.accuracy !== null) parts.push(`${pct(s.accuracy)} richtig`)
  return parts.join(' · ')
}

export const playerPath = (name: string) => `/spieler/${encodeURIComponent(name)}`

export function PlayersScreen() {
  const me = useMe()
  const navigate = useAppNavigate()
  const { players, add, setQuickPick } = usePlayers()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    if (players.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
      setError(`${n} gibt es schon.`)
      return
    }
    add(n)
    setName('')
    setError(null)
  }

  return (
    <div className="pt-4 md:pt-10">
      <h1 className="text-headline-md">Spieler</h1>
      <p className="meta mt-1 mb-5">Mit Stern markierte Personen stehen im Spielaufbau zur Schnellauswahl bereit.</p>

      <form onSubmit={submit} className="flex gap-2 mb-1">
        <label htmlFor="new-player" className="sr-only">
          Name
        </label>
        <input
          id="new-player"
          className="field flex-1"
          value={name}
          maxLength={MAX_NAME}
          placeholder="Neue Person"
          autoComplete="off"
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'new-player-error' : undefined}
        />
        <button type="submit" className="btn btn-tonal m3-state-layer" disabled={!name.trim()}>
          <Icon name="add" size={20} />
          Hinzufügen
        </button>
      </form>
      <p id="new-player-error" className="min-h-[1.5rem] text-body-sm text-md-error" role="alert">
        {error}
      </p>

      <ul className="space-y-2">
        {players.map((p, i) => (
          <m.li
            key={p.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...spring.spatialDefault,
              delay: Math.min(i, 8) * 0.03
            }}
            className="flex items-center rounded-m3-lg bg-md-surface-container-low overflow-hidden"
          >
            <button
              type="button"
              className="flex flex-1 min-w-0 items-center gap-4 min-h-[72px] pl-4 pr-2 py-3 text-left m3-state-layer"
              onClick={() => navigate(playerPath(p.name))}
            >
              <Avatar name={p.name} picture={p.isMe ? me.picture : undefined} size={44} />
              <span className="flex-1 min-w-0 text-left">
                <span className="flex items-center gap-2">
                  <span className="text-title-md truncate">{p.name}</span>
                  {p.isMe && (
                    <span className="shrink-0 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container px-2 text-label-md">
                      Du
                    </span>
                  )}
                </span>
                <span className="block meta">{line(p)}</span>
              </span>
              {p.isMe && <Icon name="chevron" size={20} className="text-md-on-surface-variant mr-2" />}
            </button>
            {!p.isMe && (
              <button
                type="button"
                className={`icon-btn m3-state-layer shrink-0 mr-1 ${p.quickPick ? 'text-md-tertiary' : 'text-md-on-surface-variant'}`}
                aria-pressed={p.quickPick}
                aria-label={`${p.name} in der Schnellauswahl`}
                onClick={() => setQuickPick(p.name, !p.quickPick)}
              >
                <Icon name={p.quickPick ? 'star' : 'star-outline'} />
              </button>
            )}
          </m.li>
        ))}
      </ul>

      <div className="mt-10">
        <FriendsSection />
      </div>
    </div>
  )
}

export function PlayerDetailScreen() {
  const me = useMe()
  const { name: raw = '' } = useParams()
  const name = decodeURIComponent(raw)
  const navigate = useAppNavigate()
  const { showModal } = useUI()
  const { players, rename, remove, setQuickPick } = usePlayers()
  const player = players.find((p) => p.name === name)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  if (!player) {
    return (
      <div>
        <SubPageHeader title="Spieler" back="/spieler" />
        <p className="meta pt-6">Diese Person gibt es nicht mehr.</p>
      </div>
    )
  }

  const s = player.summary
  const best = s
    ? decadeRates(s)
        .filter((d) => d.tries >= 3 && d.rate !== null)
        .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.tries - a.tries)[0]
    : undefined
  const topCards = s ? [...DECADES].sort((a, b) => s.byDecade[b].cards - s.byDecade[a].cards)[0] : undefined

  const doRename = (to: string) => {
    rename(player.name, to)
    setEditing(false)
    navigate(playerPath(to), { replace: true })
  }

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    const to = draft.trim()
    if (!to || to === player.name) {
      setEditing(false)
      return
    }
    const other = players.find((p) => p.name === to)
    if (other) {
      showModal(
        `Mit ${to} zusammenführen?`,
        <p className="text-body-lg">
          {to} gibt es schon. Runden, Siege und Erfolge von {player.name} kommen zu {to}. {player.name} verschwindet aus der Liste.
        </p>,
        [
          { text: 'Abbrechen' },
          {
            text: 'Zusammenführen',
            variant: 'primary',
            onClick: () => doRename(to)
          }
        ]
      )
      return
    }
    doRename(to)
  }

  const askRemove = () =>
    showModal(
      `${player.name} entfernen?`,
      <p className="text-body-lg">
        {player.name} verschwindet aus Spielerliste, Schnellauswahl und Statistik, die Erfolge werden gelöscht. Die Runden im Verlauf
        bleiben, wie sie gespielt wurden.
      </p>,
      [
        { text: 'Behalten' },
        {
          text: 'Entfernen',
          variant: 'danger',
          onClick: () => {
            remove(player.name)
            navigate('/spieler', { replace: true })
          }
        }
      ]
    )

  return (
    <div>
      <SubPageHeader title={player.isMe ? `${player.name} (du)` : player.name} back="/spieler" />

      <div className="pt-2 space-y-6">
        <section className="flex items-center gap-4">
          <Avatar name={player.name} picture={player.isMe ? me.picture : undefined} size={64} />
          {editing ? (
            <form onSubmit={saveName} className="flex-1 flex flex-wrap gap-2">
              <label htmlFor="rename" className="sr-only">
                Neuer Name
              </label>
              <input
                id="rename"
                className="field flex-1 min-w-[10rem]"
                value={draft}
                maxLength={MAX_NAME}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-filled m3-state-layer">
                Speichern
              </button>
              <button type="button" className="btn btn-text m3-state-layer" onClick={() => setEditing(false)}>
                Abbrechen
              </button>
            </form>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-headline-sm truncate">{player.name}</p>
              <p className="meta">{s?.lastPlayed ? `Zuletzt gespielt ${formatDay(s.lastPlayed)}` : 'Noch keine Runde gespielt'}</p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Runden"
            value={s?.games ?? 0}
            note={s && s.games > 0 ? `${s.wins} ${s.wins === 1 ? 'Sieg' : 'Siege'}, ${pct(s.wins / s.games)}` : undefined}
          />
          <StatTile
            label="Trefferquote"
            value={pct(s?.accuracy ?? null)}
            note={s && s.tries > 0 ? `${s.correct} von ${s.tries}` : 'ab der nächsten Runde'}
          />
          <StatTile
            label="Stärkstes Jahrzehnt"
            value={
              best ? decadeLabel(best.decade) : topCards !== undefined && s && s.byDecade[topCards].cards > 0 ? decadeLabel(topCards) : '–'
            }
            note={
              best
                ? `${pct(best.rate)} richtig`
                : topCards !== undefined && s && s.byDecade[topCards].cards > 0
                  ? `${s.byDecade[topCards].cards} Karten`
                  : undefined
            }
          />
          {s && s.guesses > 0 ? (
            <StatTile
              label="Jahre raten"
              value={`± ${(s.yearOff ?? 0).toLocaleString('de-DE', { maximumFractionDigits: 1 })}`}
              note={`${s.exactYears} exakt`}
            />
          ) : (
            <StatTile
              label="Einsprüche"
              value={s?.challenges ?? 0}
              note={s && s.challenges > 0 ? `${s.challengesWon} gewonnen` : undefined}
            />
          )}
        </div>

        {s && s.games > 0 && (
          <section className="surface p-5 space-y-3" aria-labelledby="pd-profile">
            <h2 id="pd-profile" className="text-title-lg">
              Jahrzehnt-Profil
            </h2>
            <DecadeProfile people={[s]} />
          </section>
        )}

        <section className="surface overflow-hidden" aria-label="Verwalten">
          <button
            type="button"
            className="row m3-state-layer !rounded-none"
            onClick={() => navigate(`/erfolge?spieler=${encodeURIComponent(player.name)}`)}
          >
            <Icon name="trophy" className="text-md-on-surface-variant" />
            <span className="flex-1 text-left">
              <span className="block text-title-md">Erfolge</span>
              <span className="block meta">{player.achievements} erreicht</span>
            </span>
            <Icon name="chevron" size={20} className="text-md-on-surface-variant" />
          </button>
          {!player.isMe && (
            <>
              <div className="row !rounded-none">
                <Icon name="star" className="text-md-on-surface-variant" />
                <span className="flex-1">
                  <span className="block text-title-md">Schnellauswahl</span>
                  <span className="block meta">Im Spielaufbau mit einem Tipp dabei.</span>
                </span>
                <Switch checked={player.quickPick} onChange={(on) => setQuickPick(player.name, on)} ariaLabel="Schnellauswahl" />
              </div>
              <button
                type="button"
                className="row m3-state-layer !rounded-none"
                onClick={() => {
                  setDraft(player.name)
                  setEditing(true)
                }}
              >
                <Icon name="edit" className="text-md-on-surface-variant" />
                <span className="flex-1 text-left">
                  <span className="block text-title-md">Umbenennen</span>
                  <span className="block meta">Gibt es den Namen schon, werden beide zusammengeführt.</span>
                </span>
              </button>
              <button type="button" className="row m3-state-layer !rounded-none text-md-error" onClick={askRemove}>
                <Icon name="delete" />
                <span className="flex-1 text-left">
                  <span className="block text-title-md">Entfernen</span>
                  <span className="block meta">Aus Liste und Statistik, Erfolge werden gelöscht.</span>
                </span>
              </button>
            </>
          )}
        </section>
        {player.isMe && <p className="meta">Dein Name kommt aus deinem Google-Konto.</p>}
      </div>
    </div>
  )
}
