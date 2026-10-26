/**
 * Modal — the app's single dialog surface (state lives in UIContext).
 *
 * Motion:
 * - Desktop: centred dialog that rises and scales in on the spatial-default
 *   spring and leaves on a critically damped spring (exits are quicker).
 * - Compact (phones): bottom sheet. Dismissible sheets can be flung down from
 *   the drag handle; the release velocity decides (M3 sheet behaviour).
 *   Required dialogs never dismiss by gesture.
 * - AnimatePresence keys on modal.key with mode="wait": when one dialog
 *   replaces another the old one finishes leaving first, and closeModal()'s
 *   promise resolves on exit — no setTimeout sequencing needed.
 *
 * Accessibility: focus moves into the dialog, Tab is trapped, the app behind
 * is `inert`, and focus returns to the opener when the dialog is gone.
 */

import { useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m, useDragControls, type PanInfo } from 'motion/react'
import { useUI } from '@/contexts'
import { useMediaQuery, COMPACT_QUERY } from '@/hooks/useMediaQuery'
import { spring } from '@/motion/springs'
import type { ModalButton } from '@/types'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Browser back closes the open dialog. One history entry is pushed while any
 * dialog is open. Closing removes it with history.back(), which fires an
 * *asynchronous* popstate — that self-caused pop must not close the next
 * dialog that may already be open by then (dialogs now follow each other
 * immediately). A single global listener counts and swallows our own pops.
 */
const modalHistory = (() => {
  let selfPops = 0
  let onBack: (() => void) | null = null
  let installed = false
  const install = () => {
    if (installed) return
    installed = true
    window.addEventListener('popstate', () => {
      if (selfPops > 0) {
        selfPops--
        return
      }
      onBack?.()
    })
  }
  return {
    open(close: () => void) {
      install()
      onBack = close
      window.history.pushState({ modal: true }, '')
    },
    close() {
      onBack = null
      if (window.history.state?.modal) {
        selfPops++
        window.history.back()
      }
    }
  }
})()

const EMOJI_PREFIX = /^((?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\u{FE00}-\u{FE0F}\u{200D}]*)\s*/u

function DialogTitle({ title }: { title: ReactNode }) {
  if (typeof title !== 'string') return <>{title}</>
  const match = title.match(EMOJI_PREFIX)
  if (!match) return <span>{title}</span>
  return (
    <>
      <span aria-hidden="true">{match[1]}</span>
      <span>{title.slice(match[0].length)}</span>
    </>
  )
}

export function Modal() {
  const { modal, closeModal, notifyModalExited } = useUI()
  const compact = useMediaQuery(COMPACT_QUERY)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)

  const dismissible = !modal.options?.required

  // Remember where focus came from when a dialog opens from a closed state.
  // Done during render on purpose: child effects run before parent effects,
  // so by the time an effect here ran, the dialog would already have moved
  // focus to its own primary button.
  if (modal.isOpen && !wasOpenRef.current) {
    const active = document.activeElement
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null
  }
  wasOpenRef.current = modal.isOpen

  // Keep the page behind non-interactive while any dialog is open
  useEffect(() => {
    if (!modal.isOpen) return
    const app = document.getElementById('app')
    app?.setAttribute('inert', '')
    return () => app?.removeAttribute('inert')
  }, [modal.isOpen])

  // Browser back closes the dialog (see modalHistory)
  useEffect(() => {
    if (!modal.isOpen) return
    modalHistory.open(() => void closeModal())
    return () => modalHistory.close()
  }, [modal.isOpen, closeModal])

  const handleExitComplete = useCallback(() => {
    notifyModalExited()
    const target = returnFocusRef.current
    returnFocusRef.current = null
    if (target?.isConnected) target.focus({ preventScroll: true })
  }, [notifyModalExited])

  return createPortal(
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {modal.isOpen && (
        <DialogSurface
          key={modal.key}
          dialog={modal}
          compact={compact}
          dismissible={dismissible}
          onDismiss={() => void closeModal()}
        />
      )}
    </AnimatePresence>,
    document.body
  )
}

interface DialogSurfaceProps {
  /**
   * Snapshot of the dialog this surface shows. Passed as a prop (not read from
   * context) so a dialog that is animating out keeps its own content while
   * the next one is already in the store — AnimatePresence retains the last
   * props of an exiting child.
   */
  dialog: ReturnType<typeof useUI>['modal']
  compact: boolean
  dismissible: boolean
  onDismiss: () => void
}

function DialogSurface({ dialog, compact, dismissible, onDismiss }: DialogSurfaceProps) {
  const { closeModal } = useUI()
  const panelRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const dragControls = useDragControls()
  const { title, content, buttons = [], options } = dialog

  // Initial focus: primary action, else first focusable, else the panel
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const target = primaryRef.current ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    target.focus({ preventScroll: true })
  }, [])

  const runButton = useCallback(
    (button: ModalButton) => {
      if (button.disabled) return
      button.onClick?.()
      if (button.closeOnClick !== false) void closeModal()
    },
    [closeModal]
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (dismissible && !options?.disableEscapeKey) {
        e.stopPropagation()
        onDismiss()
      }
      return
    }
    if (e.key === 'Enter') {
      // Let focused controls handle Enter themselves (no double activation)
      const tag = (e.target as HTMLElement).tagName
      if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      const primary = buttons.find((b) => b.variant === 'primary')
      if (primary) {
        e.preventDefault()
        runButton(primary)
      }
      return
    }
    if (e.key === 'Tab' && panelRef.current) {
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onDismiss()
  }

  const backdropClosable = dismissible && !options?.disableBackdropClick
  const showClose = dismissible && !options?.hideCloseButton

  const panelMotion = compact
    ? {
        initial: { y: '100%' },
        animate: { y: 0, transition: spring.spatialDefault },
        exit: { y: '100%', transition: spring.effectsSlow }
      }
    : {
        initial: { opacity: 0, y: 24, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1, transition: spring.spatialDefault },
        exit: { opacity: 0, y: 12, scale: 0.98, transition: spring.effectsDefault }
      }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${compact ? 'items-end' : 'items-center pt-20 pb-6 px-4'}`}
      onKeyDown={onKeyDown}
    >
      <m.div
        className="absolute inset-0 bg-md-scrim/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: spring.effectsSlow }}
        exit={{ opacity: 0, transition: spring.effectsDefault }}
        onClick={backdropClosable ? onDismiss : undefined}
        aria-hidden="true"
      />

      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative m3-dialog-panel w-full flex flex-col outline-none ${
          compact
            ? 'rounded-b-none max-h-[88vh] pb-[env(safe-area-inset-bottom)]'
            : 'max-w-md md:max-w-2xl max-h-[85vh]'
        }`}
        {...panelMotion}
        drag={compact && dismissible ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.7 }}
        onDragEnd={onDragEnd}
      >
        {compact && dismissible && (
          <div
            className="flex justify-center pt-3 pb-1 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => dismissible && dragControls.start(e)}
            aria-hidden="true"
          >
            <span className="block h-1 w-8 rounded-m3-full bg-md-on-surface-variant/40" />
          </div>
        )}

        <div
          className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-3 sm:pt-5 pb-3"
          onPointerDown={(e) => compact && dismissible && dragControls.start(e)}
        >
          <h2 id="modal-title" className="text-headline-sm text-md-on-surface flex items-center gap-2 min-w-0">
            <DialogTitle title={title} />
          </h2>
          {showClose && (
            <button
              onClick={onDismiss}
              className="touch-target rounded-m3-full m3-state-layer text-md-on-surface-variant hover:text-md-on-surface transition-colors"
              aria-label="Schließen"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-4 text-md-on-surface-variant overflow-y-auto overscroll-contain">{content}</div>

        {buttons.length > 0 && (
          <div className="flex flex-wrap justify-end gap-3 px-5 sm:px-6 py-4 border-t border-md-outline-variant/60">
            {buttons.map((button, index) => (
              <button
                key={index}
                ref={button.variant === 'primary' ? primaryRef : undefined}
                onClick={() => runButton(button)}
                disabled={button.disabled}
                className={`btn ${
                  button.variant === 'primary'
                    ? 'btn-brand'
                    : button.variant === 'danger'
                      ? 'bg-md-error text-md-on-error focus-visible:ring-md-error'
                      : 'btn-tonal'
                } ${button.className ?? ''}`}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </m.div>
    </div>
  )
}
