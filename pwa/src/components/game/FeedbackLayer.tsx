/**
 * FeedbackLayer — declarative reactions to a reveal.
 *
 * Replaces the old imperative DOM effects (rain, lightning, full-screen shake,
 * neon text overlays). Successes earn confetti in the theme colours (never
 * under reduced motion); a miss is felt locally — the card itself shakes on
 * the board. Every verdict is also announced to screen readers.
 */
import { useEffect, useState } from 'react'
import type { Reveal } from '@/game/useTurnFlow'
import { guessTier } from '@/game/guess'
import { celebrate } from '@/motion/celebrate'
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

export function FeedbackLayer({ reveal }: { reveal: Reveal | null }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reveal) return
    setMessage(announcementFor(reveal))

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
