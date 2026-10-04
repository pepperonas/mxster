/**
 * SelectionTrail — the choices made so far in the setup flow, as chips.
 *
 * The chip icons carry view-transition-names: the icon of the card the
 * player tapped on the previous screen travels into its chip (shared element
 * via the View Transitions API, see markSharedElement).
 */
import { useGame } from '@/contexts'
import { GAME_MODE_INFO, GAME_VARIANT_INFO } from '@/utils/gameModes'

export const TRAIL_MODE = 'trail-mode'
export const TRAIL_VARIANT = 'trail-variant'

/** Name the tapped card's icon so the route transition morphs it into the trail. */
export function markSharedElement(el: Element | null, name: string) {
  if (el instanceof HTMLElement) el.style.viewTransitionName = name
}

export function SelectionTrail({ showVariant = false }: { showVariant?: boolean }) {
  const { gameMode, gameVariant } = useGame()
  if (!gameMode) return null
  const mode = GAME_MODE_INFO[gameMode]
  const variant = showVariant && gameVariant ? GAME_VARIANT_INFO[gameVariant] : null

  return (
    <ul className="flex flex-wrap justify-center gap-2 mb-6" aria-label="Deine Auswahl">
      <li className="flex items-center gap-2 pl-1.5 pr-3.5 py-1 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container text-label-lg">
        <span className="text-xl leading-none" style={{ viewTransitionName: TRAIL_MODE }} aria-hidden="true">
          {mode.icon}
        </span>
        {mode.name}
      </li>
      {variant && (
        <li className="flex items-center gap-2 pl-1.5 pr-3.5 py-1 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container text-label-lg">
          <span className="text-xl leading-none" style={{ viewTransitionName: TRAIL_VARIANT }} aria-hidden="true">
            {variant.icon}
          </span>
          {variant.name}
        </li>
      )}
    </ul>
  )
}
