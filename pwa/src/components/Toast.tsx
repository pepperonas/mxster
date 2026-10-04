/**
 * Toasts — M3 snackbars stacked at the bottom.
 *
 * Motion: each toast springs in from below; when one leaves the rest of the
 * stack reflows with a layout spring. Toasts can be flung sideways — the
 * release velocity/offset decides, and the exit continues in that direction.
 * The auto-dismiss timer pauses while hovered or dragged.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m, type PanInfo } from 'motion/react'
import { useUI } from '@/contexts'
import { spring } from '@/motion/springs'
import type { Toast as ToastType } from '@/types'

const SWIPE_DISTANCE = 96
const SWIPE_VELOCITY = 500

function ToastIcon({ type }: { type: ToastType['type'] }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, 'aria-hidden': true }
  switch (type) {
    case 'success':
      return <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>
    case 'error':
      return <svg {...common}><path d="M18 6L6 18M6 6l12 12" /></svg>
    case 'warning':
      return <svg {...common}><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
  }
}

// M3 snackbar: inverse surface; the type shows as a tinted icon accent.
const TONE: Record<ToastType['type'], string> = {
  success: 'bg-md-inverse-surface text-md-inverse-on-surface [&_.toast-icon]:text-md-success-inverse',
  error: 'bg-md-error-container text-md-on-error-container',
  warning: 'bg-md-inverse-surface text-md-inverse-on-surface [&_.toast-icon]:text-md-warning-inverse',
  info: 'bg-md-inverse-surface text-md-inverse-on-surface [&_.toast-icon]:text-md-inverse-primary'
}

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const [exitX, setExitX] = useState(0)
  const remaining = useRef(toast.duration)
  const startedAt = useRef(0)

  const remove = useCallback(() => onRemove(toast.id), [onRemove, toast.id])

  // Auto-dismiss that pauses while hovered/dragged (and resumes with the rest)
  useEffect(() => {
    if (toast.duration <= 0 || paused) return
    startedAt.current = performance.now()
    const timer = window.setTimeout(remove, remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(400, remaining.current - (performance.now() - startedAt.current))
    }
  }, [paused, remove, toast.duration])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setPaused(false)
    const { offset, velocity } = info
    if (Math.abs(offset.x) > SWIPE_DISTANCE || Math.abs(velocity.x) > SWIPE_VELOCITY) {
      setExitX(Math.sign(offset.x || velocity.x) * 420)
      // Remove one frame later so the exit sees the fling direction
      requestAnimationFrame(remove)
    }
  }

  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: spring.spatialDefault }}
      exit={
        exitX
          ? { opacity: 0, x: exitX, transition: spring.effectsDefault }
          : { opacity: 0, scale: 0.94, transition: spring.effectsDefault }
      }
      transition={spring.spatialDefault}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.6}
      onDragStart={() => setPaused(true)}
      onDragEnd={onDragEnd}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
      className={`flex items-center gap-3 pl-4 pr-2 py-2 min-h-[48px] rounded-m3-md shadow-m3-3 touch-pan-y select-none cursor-grab active:cursor-grabbing ${TONE[toast.type]} w-full sm:w-auto sm:min-w-[320px] max-w-md`}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      <span className="toast-icon flex-shrink-0">
        <ToastIcon type={toast.type} />
      </span>
      <span className="flex-1 text-label-lg">{toast.message}</span>
      <button
        onClick={remove}
        className="flex-shrink-0 touch-target rounded-m3-full m3-state-layer"
        aria-label="Hinweis schließen"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </m.li>
  )
}

export function Toast() {
  const { toasts, removeToast } = useUI()

  return createPortal(
    <ol
      className="fixed bottom-4 left-4 right-4 sm:left-auto z-[60] flex flex-col items-stretch sm:items-end gap-2 pb-[env(safe-area-inset-bottom)] pointer-events-none [&>li]:pointer-events-auto"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </ol>,
    document.body
  )
}
