/**
 * Spielen — the landing destination after sign-in. One big way into a new
 * round (the record half out of its sleeve), then the last round and the
 * nearest achievement. Nothing else competes for attention.
 */
import { m } from 'motion/react'
import { useMe } from '@/auth/AuthContext'
import { useAchievements, useGameHistory } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { MODE_COPY } from '@/game/modeCopy'
import { spring } from '@/motion/springs'
import { ownPlayerName } from '@/game/owner'
import { formatDay } from '@/utils/format'
import { ACHIEVEMENT_DEFINITIONS, type Achievement } from '@/types/achievements'

export function HomeScreen() {
  const me = useMe()
  const navigate = useAppNavigate()
  const { history } = useGameHistory()
  const { getPlayerAchievements } = useAchievements()
  const firstName = ownPlayerName(me.name)
  const last = history[0]
  const stored = getPlayerAchievements(firstName)
  const next = nearestAchievement(
    stored.length ? stored : Object.values(ACHIEVEMENT_DEFINITIONS).map((d) => ({ ...d, unlocked: false, progress: d.target ? 0 : undefined }))
  )

  return (
    <div className="pt-4 md:pt-10 space-y-6">
      <h1 className="text-headline-md text-md-on-surface">
        {last ? `Noch eine Runde, ${firstName}?` : `Willkommen, ${firstName}.`}
      </h1>

      {/* The sleeve: a brand-coloured card with the record sliding out of it */}
      <button
        type="button"
        onClick={() => navigate('/neu')}
        className="group relative block w-full text-left overflow-hidden rounded-m3-xxl m3-state-layer"
        style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))', viewTransitionName: 'new-game' }}
      >
        <div className="relative z-10 p-7 pr-[42%] min-h-[220px] flex flex-col justify-between">
          <span className="text-poster" style={{ fontSize: 'clamp(2.4rem, 9vw, 3.4rem)' }}>
            Neues
            <br />
            Spiel
          </span>
          <span className="mt-6 inline-flex items-center gap-2 text-label-lg opacity-90">
            Modus und Mitspieler wählen
            <Icon name="chevron" size={20} />
          </span>
        </div>
        {/* Positioning lives on a plain wrapper: Motion owns the transform below */}
        <div className="absolute top-1/2 right-0 translate-x-[38%] -translate-y-1/2">
          <m.div initial={{ x: 60, rotate: -30 }} animate={{ x: 0, rotate: 0 }} transition={spring.spatialSlow}>
            <div className="transition-transform duration-m3-spatial ease-m3-spatial group-hover:-translate-x-4 group-active:-translate-x-6">
              <Vinyl size="clamp(250px, 30vw, 340px)" spinning />
            </div>
          </m.div>
        </div>
      </button>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="last-round" className="surface p-5">
          <h2 id="last-round" className="text-title-md mb-3">
            Letzte Runde
          </h2>
          {last ? (
            <button
              type="button"
              onClick={() => navigate(`/verlauf/${last.id}`)}
              className="w-full text-left flex items-center gap-4 -m-2 p-2 rounded-m3-lg m3-state-layer"
            >
              <span className="grid place-items-center w-12 h-12 rounded-m3-lg bg-md-tertiary-container text-md-on-tertiary-container">
                <Icon name={MODE_COPY[last.gameMode]?.icon ?? 'note'} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-title-md truncate">{last.winner.name} hat gewonnen</span>
                <span className="block meta truncate">
                  {MODE_COPY[last.gameMode]?.name ?? 'Runde'}, {formatDay(last.date)}
                </span>
              </span>
              <Icon name="chevron" className="text-md-on-surface-variant" />
            </button>
          ) : (
            <p className="meta">Hier steht nach eurer ersten Runde, wer gewonnen hat.</p>
          )}
        </section>

        <section aria-labelledby="next-goal" className="surface p-5">
          <h2 id="next-goal" className="text-title-md mb-3">
            Nächster Erfolg
          </h2>
          {next ? (
            <button
              type="button"
              onClick={() => navigate('/erfolge')}
              className="w-full text-left flex items-center gap-4 -m-2 p-2 rounded-m3-lg m3-state-layer"
            >
              <ProgressRing value={next.progress ?? 0} max={next.target ?? 1} size={48}>
                <span className="text-title-md">{next.icon}</span>
              </ProgressRing>
              <span className="min-w-0 flex-1">
                <span className="block text-title-md truncate">{next.name}</span>
                <span className="block meta">
                  {next.target ? `${next.progress ?? 0} von ${next.target}` : next.description}
                </span>
              </span>
            </button>
          ) : (
            <p className="meta">Spiel eine Runde, um deinen ersten Erfolg freizuschalten.</p>
          )}
        </section>
      </div>
    </div>
  )
}

/** Locked achievement with the highest completion ratio (progress-based first). */
function nearestAchievement(list: Achievement[]): Achievement | null {
  const locked = list.filter((a) => !a.unlocked)
  if (locked.length === 0) return null
  const withProgress = locked
    .filter((a) => a.target && (a.progress ?? 0) > 0)
    .sort((a, b) => (b.progress ?? 0) / (b.target ?? 1) - (a.progress ?? 0) / (a.target ?? 1))
  return withProgress[0] ?? locked[0]
}
