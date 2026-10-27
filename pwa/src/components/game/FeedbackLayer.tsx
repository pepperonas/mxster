/**
 * FeedbackLayer — declarative reactions to a reveal.
 *
 * Replaces the old imperative DOM effects (rain, lightning, full-screen shake,
 * neon text overlays). Successes earn confetti in the theme colours (never
 * under reduced motion); a miss is felt locally — the card itself shakes on
 * the board. Phones feel the verdict as a short vibration (utils/haptics).
 * Every verdict is also announced to screen readers.
 */
import { useEffect, useState } from 'react'
import type { Reveal } from '@/game/useTurnFlow'
import { guessTier } from '@/game/guess'
import { celebrate } from '@/motion/celebrate'
import { haptic, type HapticKind } from '@/utils/haptics'
import { msg } from '@/i18n'
import { gameText } from '@/i18n/messages/game'

export function announcementFor(reveal: Reveal): string {
  const t = msg(gameText)
  const { title, artist, year } = reveal.song
  if (reveal.kind === 'placement') {
    if (reveal.isFirstCard) return t.announceStart(title, year)
    if (reveal.challenge?.won) return t.announceObjection(title, year)
    return reveal.isCorrect ? t.announceRight(title, year) : t.announceWrong(title, year)
  }
  return t.announceGuess(reveal.breakdown.total, title, artist, year)
}

/** What the phone feels on a verdict (a first card is no verdict). */
export function hapticFor(reveal: Reveal): HapticKind | null {
  if (reveal.kind === 'placement') {
    if (reveal.isFirstCard) return null
    return reveal.isCorrect || reveal.challenge?.won ? 'success' : 'miss'
  }
  const tier = guessTier(reveal.breakdown.total)
  if (tier === 'perfect') return 'win'
  if (tier === 'great' || tier === 'good') return 'success'
  return tier === 'miss' ? 'miss' : null
}

export function FeedbackLayer({ reveal }: { reveal: Reveal | null }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reveal) return
    setMessage(announcementFor(reveal))
    const feel = hapticFor(reveal)
    if (feel) haptic(feel)

    let cancel = () => {}
    if (reveal.kind === 'placement') {
      if ((reveal.isCorrect || reveal.challenge?.won) && !reveal.isFirstCard) cancel = celebrate('small')
    } else {
      const tier = guessTier(reveal.breakdown.total)
      if (tier === 'perfect') cancel = celebrate('big')
      else if (tier === 'great') cancel = celebrate('small')
    }
    return cancel
  }, [reveal])

  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}
