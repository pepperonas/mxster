import { useEffect } from 'react'
import { m, useSpring, useTransform } from 'motion/react'
import { spring } from '@/motion/springs'
import { useReducedMotionPreference } from '@/motion/policy'

interface AnimatedNumberProps {
  value: number
  className?: string
  /** Start the count from this value on mount (e.g. 0 for a result reveal). */
  from?: number
}

/**
 * A number that counts to its new value on a critically damped spring
 * (effects-slow: fast start, no overshoot — numbers shouldn't wobble past
 * their target). Under reduced motion it changes instantly.
 * The visible text is aria-hidden; screen readers get the final value.
 */
export function AnimatedNumber({ value, className, from }: AnimatedNumberProps) {
  const reduced = useReducedMotionPreference()
  const motionValue = useSpring(from ?? value, spring.effectsSlow)
  const display = useTransform(motionValue, (v) => Math.round(v).toString())

  useEffect(() => {
    if (reduced) motionValue.jump(value)
    else motionValue.set(value)
  }, [value, reduced, motionValue])

  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      <m.span aria-hidden="true">{display}</m.span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
