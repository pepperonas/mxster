import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig, domMax } from 'motion/react'

/**
 * Tests render `m.*` components like the app does, but with the Motion
 * features loaded synchronously. Without LazyMotion features, `m` elements
 * never report exit completion and AnimatePresence would wait forever.
 */
export function MotionTestProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
