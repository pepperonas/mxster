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
import { useInteraction } from '@/contexts'

export function announcementFor(reveal: Reveal): string {
  if (reveal.kind === 'placement') {
    if (reveal.isFirstCard) return `Startkarte gelegt: ${reveal.song.title}, ${reveal.song.year}.`
    return reveal.isCorrect
      ? `Richtig platziert! ${reveal.song.title} ist von ${reveal.song.year}.`
      : `Leider falsch. ${reveal.song.title} ist von ${reveal.song.year}.`
  }
  const { total } = reveal.breakdown
  return `${total} ${total === 1 ? 'Punkt' : 'Punkte'}. ${reveal.song.title} von ${reveal.song.artist}, ${reveal.song.year}.`
}

export function FeedbackLayer({ reveal }: { reveal: Reveal | null }) {
  const { registerInteraction } = useInteraction()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reveal) return
    setMessage(announcementFor(reveal))

    let cancel = () => {}
    if (reveal.kind === 'placement') {
      if (reveal.isCorrect && !reveal.isFirstCard) cancel = celebrate('small')
      registerInteraction('game', reveal.isCorrect ? 90 : 55)
    } else {
      const tier = guessTier(reveal.breakdown.total)
      if (tier === 'perfect') cancel = celebrate('big')
      else if (tier === 'great') cancel = celebrate('small')
      registerInteraction('game', tier === 'miss' ? 50 : 70 + reveal.breakdown.total)
    }
    return cancel
  }, [reveal, registerInteraction])

  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}
