/**
 * "Nothing here yet" with a picture: a small record lying still in its
 * half-open sleeve, the page's subject on its label. The record stays the
 * app's one motif; here it rests (no spin), so the page stays calm.
 */
import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { Vinyl } from './Vinyl'
import { Icon, type IconName } from './Icon'
import { spring } from '@/motion/springs'

interface EmptyStateProps {
  icon: IconName
  title: string
  text: string
  action?: ReactNode
}

export function EmptyState({ icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="surface px-6 py-10 text-center" data-empty-state>
      <div className="relative mx-auto w-[200px] h-[120px]" aria-hidden="true">
        {/* The record slides half out of its sleeve once, then rests */}
        <m.div
          className="absolute top-1 left-[84px]"
          initial={{ x: -76, rotate: -60 }}
          animate={{ x: 0, rotate: 0 }}
          transition={{ ...spring.spatialSlow, delay: 0.15 }}
        >
          <Vinyl size={112} label={<Icon name={icon} size={22} />} />
        </m.div>
        <div className="absolute top-0 left-0 w-[116px] h-[116px] rounded-m3-md bg-md-secondary-container shadow-m3-1 grid place-items-center">
          <span className="w-12 h-12 rounded-full border-2 border-md-on-secondary-container/25" />
        </div>
      </div>
      <p className="mt-6 text-title-md">{title}</p>
      <p className="mt-1 meta">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
