/**
 * Neues Spiel — mode, players and (alone) bot opponents on one screen.
 * Replaces the old three-page flow (mode → variant → players).
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useMe } from '@/auth/AuthContext'
import { useGame, useSettings } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { SubPageHeader } from '@/shell/AppShell'
import { Icon } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { MODE_COPY, MODE_ORDER, DIFFICULTY_LABEL } from '@/game/modeCopy'
import { ownPlayerName } from '@/game/owner'
import { createBotPlayers } from '@/services/botPlayer'
import { spring } from '@/motion/springs'
import type { GameMode } from '@/types'

type Difficulty = keyof typeof DIFFICULTY_LABEL
const MIN_PLAYERS = 2
const LAST_MODE_KEY = 'mxster_last_mode'

export function SetupScreen() {
  const me = useMe()
  const navigate = useAppNavigate()
  const { gameMode, setGameMode, players, addPlayer, removePlayer, startGame, resetGame, isGameStarted } = useGame()
  const { settings, addPlayer: rememberPlayer } = useSettings()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [botCount, setBotCount] = useState(1)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const inputRef = useRef<HTMLInputElement>(null)

  const humans = players.filter((p) => !p.isBot)
  const bots = players.filter((p) => p.isBot)
  const botsOn = bots.length > 0
  const canUseBots = humans.length === 1

  // Fresh setup: own name first, last mode preselected. Once per visit —
  // StrictMode replays effects, and the player list must not double up.
  const prepared = useRef(false)
  useEffect(() => {
    if (prepared.current) return
    prepared.current = true
    if (isGameStarted) resetGame()
    if (!gameMode) setGameMode((localStorage.getItem(LAST_MODE_KEY) as GameMode | null) ?? MODE_ORDER[0])
    if (isGameStarted || players.length === 0) addPlayer(ownPlayerName(me.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bots only make sense against exactly one human — drop them otherwise.
  useEffect(() => {
    if (!canUseBots && botsOn) removeBots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseBots, botsOn])

  function removeBots() {
    // Remove from the end so indices stay valid
    for (let i = players.length - 1; i >= 0; i--) if (players[i].isBot) removePlayer(i)
  }

  function setBots(on: boolean, count = botCount, diff = difficulty) {
    removeBots()
    if (!on) return
    createBotPlayers(count, diff, humans).forEach((bot) => addPlayer(bot.name, bot))
  }

  const nameTaken = (n: string) => players.some((p) => p.name.toLowerCase() === n.toLowerCase())

  function add(raw: string) {
    const n = raw.trim().slice(0, 20)
    if (!n) return
    if (nameTaken(n)) {
      setNameError(`${n} spielt schon mit.`)
      return
    }
    if (botsOn) removeBots()
    addPlayer(n)
    rememberPlayer(n)
    setName('')
    setNameError(null)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    add(name)
    inputRef.current?.focus()
  }

  const suggestions = settings.savedPlayers.filter((n) => !nameTaken(n)).slice(0, 8)
  const ready = !!gameMode && players.length >= MIN_PLAYERS

  const start = () => {
    if (!ready || !gameMode) return
    localStorage.setItem(LAST_MODE_KEY, gameMode)
    startGame()
    navigate('/spiel', { replace: true })
  }

  return (
    <div style={{ viewTransitionName: 'new-game' }}>
      <SubPageHeader title="Neues Spiel" />

      <div className="space-y-8 pt-2 pb-40">
        {/* Mode */}
        <section aria-labelledby="mode-h">
          <h2 id="mode-h" className="text-title-md mb-3">
            Wie wollt ihr spielen?
          </h2>
          <div role="radiogroup" aria-labelledby="mode-h" className="grid gap-3">
            {MODE_ORDER.map((mode) => {
              const copy = MODE_COPY[mode]
              const selected = gameMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGameMode(mode)}
                  className="relative text-left flex items-start gap-4 p-4 m3-state-layer"
                  style={{
                    borderRadius: selected ? 'var(--m3-shape-xl)' : 'var(--m3-shape-lg)',
                    transition: 'border-radius var(--m3-spatial-default)'
                  }}
                >
                  <span
                    className={`absolute inset-0 transition-colors duration-m3-effects ${
                      selected ? 'bg-md-secondary-container' : 'bg-md-surface-container-low'
                    }`}
                    style={{ borderRadius: 'inherit' }}
                    aria-hidden="true"
                  />
                  <span
                    className={`relative grid place-items-center w-12 h-12 shrink-0 rounded-m3-full transition-colors duration-m3-effects ${
                      selected ? 'bg-md-primary text-md-on-primary' : 'bg-md-surface-container-highest text-md-on-surface-variant'
                    }`}
                  >
                    <Icon name={copy.icon} />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className={`block text-title-md ${selected ? 'text-md-on-secondary-container' : ''}`}>{copy.name}</span>
                    <span className={`block text-body-md ${selected ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant'}`}>
                      {selected ? copy.how : copy.short}
                    </span>
                  </span>
                  <AnimatePresence initial={false}>
                    {selected && (
                      <m.span
                        className="relative text-md-on-secondary-container"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, transition: spring.effectsFast }}
                        transition={spring.spatialFast}
                      >
                        <Icon name="check" />
                      </m.span>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </div>
        </section>

        {/* Players */}
        <section aria-labelledby="players-h">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="players-h" className="text-title-md">
              Wer spielt mit?
            </h2>
            <span className="meta tabular">{players.length} dabei</span>
          </div>

          <ul className="space-y-2" aria-live="polite">
            <AnimatePresence initial={false}>
              {players.map((p, i) => (
                <m.li
                  key={p.name}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, transition: spring.effectsDefault }}
                  transition={spring.spatialDefault}
                  className="flex items-center gap-3 pl-4 pr-1 min-h-[56px] rounded-m3-lg bg-md-surface-container-low"
                >
                  <span
                    className={`grid place-items-center w-9 h-9 rounded-full text-label-lg ${
                      p.isBot ? 'bg-md-surface-container-highest text-md-on-surface-variant' : 'bg-md-tertiary-container text-md-on-tertiary-container'
                    }`}
                    aria-hidden="true"
                  >
                    {p.isBot ? <Icon name="bot" size={20} /> : p.name[0]?.toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-body-lg">
                    {p.name}
                    {p.isBot && p.botDifficulty && <span className="meta"> ({DIFFICULTY_LABEL[p.botDifficulty]})</span>}
                  </span>
                  {!p.isBot && (
                    <button type="button" className="icon-btn m3-state-layer" onClick={() => removePlayer(i)} aria-label={`${p.name} entfernen`}>
                      <Icon name="close" size={20} />
                    </button>
                  )}
                </m.li>
              ))}
            </AnimatePresence>
          </ul>

          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="player-name">
              Name hinzufügen
            </label>
            <input
              id="player-name"
              ref={inputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              maxLength={20}
              autoComplete="off"
              placeholder="Name hinzufügen"
              className="field flex-1"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'name-error' : undefined}
            />
            <button type="submit" className="btn btn-tonal m3-state-layer !px-4 min-h-[56px]" disabled={!name.trim()} aria-label="Hinzufügen">
              <Icon name="add" />
            </button>
          </form>
          {nameError && (
            <p id="name-error" className="mt-2 text-body-sm text-md-error">
              {nameError}
            </p>
          )}

          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Frühere Mitspieler">
              {suggestions.map((n) => (
                <button key={n} type="button" className="chip m3-state-layer" onClick={() => add(n)}>
                  <Icon name="add" size={18} />
                  {n}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Bots */}
        <AnimatePresence initial={false}>
          {canUseBots && (
            <m.section
              aria-labelledby="bots-h"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, transition: spring.effectsDefault }}
              transition={spring.spatialDefault}
              className="overflow-hidden"
            >
              <div className="surface p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-md-surface-container-highest text-md-on-surface-variant">
                    <Icon name="bot" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 id="bots-h" className="text-title-md">
                      Gegen den Computer
                    </h2>
                    <p className="meta">Allein? Dann spielen Bots gegen dich.</p>
                  </div>
                  <Switch checked={botsOn} onChange={(on) => setBots(on)} ariaLabel="Gegen den Computer spielen" />
                </div>
                {botsOn && (
                  <div className="space-y-3">
                    <SegmentedControl
                      label="Stärke"
                      value={difficulty}
                      onChange={(d) => {
                        setDifficulty(d)
                        setBots(true, botCount, d)
                      }}
                      segments={(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))}
                    />
                    <SegmentedControl
                      label="Anzahl"
                      value={botCount}
                      onChange={(c) => {
                        setBotCount(c)
                        setBots(true, c, difficulty)
                      }}
                      segments={[1, 2, 3].map((c) => ({ value: c, label: c === 1 ? '1 Bot' : `${c} Bots` }))}
                    />
                  </div>
                )}
              </div>
            </m.section>
          )}
        </AnimatePresence>
      </div>

      {/* Start */}
      <div className="fixed inset-x-0 bottom-0 z-30 md:pl-24 bg-gradient-to-t from-md-surface via-md-surface/95 to-transparent pt-8 safe-bottom">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-4">
          <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={!ready} onClick={start}>
            <Icon name="play" />
            {ready ? 'Los geht’s' : MIN_PLAYERS - players.length === 1 ? 'Noch eine Person dazu' : 'Noch zwei Personen dazu'}
          </button>
        </div>
      </div>
    </div>
  )
}
