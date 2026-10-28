/**
 * Placeholder shapes while an account document loads (history, statistics).
 *
 * They take the form of what is coming — rows, tiles, a card — so the page
 * does not jump when the content arrives. They appear only after a short
 * delay (a fast load shows nothing at all instead of a flash) and shimmer
 * slowly; reduced motion keeps them still. Styles: .mx-skeleton in motion.css.
 */
import type { ReactNode } from 'react'
import { useMessages } from '@/i18n'
import { shellText } from '@/i18n/messages/shell'

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`mx-skeleton ${className}`} aria-hidden="true" />
}

/** Wrapper that tells assistive technology the page is loading. */
export function SkeletonGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  const t = useMessages(shellText)
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t.loading}</span>
      {children}
    </div>
  )
}

/** Rows like `.row` (history, lists). */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup className="space-y-2">
      <SkeletonBlock className="h-4 w-24 rounded-m3-full mb-3" />
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock key={i} className="h-16 rounded-m3-lg" />
      ))}
    </SkeletonGroup>
  )
}
