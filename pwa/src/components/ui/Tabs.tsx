/**
 * M3 primary tabs for the pages of one destination (Rückblick: rounds | stats,
 * Leute: players | friends). Each tab is its own address, so bookmarks and the
 * back button work; switching swaps the entry (no stacked pages) and the
 * indicator glides under the chosen tab. Arrow keys move between tabs.
 */
import type { KeyboardEvent } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { m } from 'motion/react'
import { spring } from '@/motion/springs'
import { prefersReducedMotion } from '@/motion/policy'

export interface TabItem {
  to: string
  label: string
  /** Small count after the label (e.g. open friend requests). */
  badge?: number
}

export function Tabs({ items, label, id }: { items: TabItem[]; label: string; id: string }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = items.findIndex((i) => pathname === i.to || pathname.startsWith(i.to + '/'))
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = items[(Math.max(0, current) + step + items.length) % items.length]
    navigate(next.to, { replace: true, viewTransition: !prefersReducedMotion() })
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-tab="${next.to}"]`)?.focus())
  }
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex border-b border-md-outline-variant -mx-4 sm:mx-0 px-4 sm:px-0" data-tabs={id}>
      {items.map((item, i) => {
        const selected = i === current
        return (
          <NavLink
            key={item.to}
            to={item.to}
            replace
            viewTransition={!prefersReducedMotion()}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            data-tab={item.to}
            className={`relative flex-1 sm:flex-none sm:min-w-[120px] min-h-[48px] px-4 grid place-items-center text-title-sm m3-state-layer outline-none ${
              selected ? 'text-md-primary' : 'text-md-on-surface-variant'
            }`}
          >
            <span className="flex items-center gap-2">
              {item.label}
              {!!item.badge && (
                <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-md-error text-md-on-error text-label-sm tabular">{item.badge}</span>
              )}
            </span>
            {selected && (
              <m.span
                layoutId={`tab-indicator-${id}`}
                className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full bg-md-primary"
                transition={spring.spatialFast}
              />
            )}
          </NavLink>
        )
      })}
    </div>
  )
}
