import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import { spring } from './springs'

const loadFeatures = () => import('./features').then((mod) => mod.default)

/**
 * App-wide motion setup.
 * - LazyMotion + `m.*` components keep the initial bundle small; `strict`
 *   throws if anything renders the full `motion.*` component by mistake.
 * - reducedMotion="user": transform/layout animations become instant for users
 *   who ask for reduced motion, opacity/colour still fade.
 * - Default transition = M3 spatial-default spring.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={spring.spatialDefault}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
