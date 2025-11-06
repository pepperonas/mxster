/**
 * Modal Component
 * Reusable modal dialog with React Portal
 * Integrates with UIContext for state management
 */

import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useUI, useInteraction } from '@/contexts'
import type { ModalButton } from '@/types'

export function Modal() {
  const { modal, closeModal } = useUI()
  const { registerInteraction } = useInteraction()
  const primaryButtonRef = useRef<HTMLButtonElement>(null)

  // Close modal on ESC key, trigger primary button on Enter
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Respect 'required' option - if set, ESC key is disabled
      if (e.key === 'Escape' && !modal.options?.disableEscapeKey && !modal.options?.required) {
        closeModal()
      }

      // Press Enter to click primary button
      if (e.key === 'Enter' && modal.buttons && modal.buttons.length > 0) {
        e.preventDefault()
        const primaryButton = modal.buttons.find((btn: ModalButton) => btn.variant === 'primary')
        if (primaryButton && !primaryButton.disabled) {
          primaryButton.onClick?.()
          if (primaryButton.closeOnClick !== false) {
            closeModal()
          }
        }
      }
    },
    [closeModal, modal.options, modal.buttons]
  )

  // Register ESC key listener
  useEffect(() => {
    if (modal.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [modal.isOpen, handleKeyDown])

  // Browser Back Button Support with History API
  useEffect(() => {
    if (!modal.isOpen) return

    // Push fake state to history when modal opens
    const modalState = { modal: true }
    window.history.pushState(modalState, '')

    console.log('📱 Modal opened, pushed history state')

    // Register modal interaction for background animation
    registerInteraction('modal', 60)

    // Focus primary button after modal opens
    setTimeout(() => {
      if (primaryButtonRef.current) {
        primaryButtonRef.current.focus()
      }
    }, 100)

    // Handle browser back button
    const handlePopState = (_e: PopStateEvent) => {
      // If user clicks back, close the modal
      if (modal.isOpen) {
        console.log('🔙 Browser back button pressed, closing modal')
        closeModal()
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Cleanup on unmount or when modal closes
    return () => {
      window.removeEventListener('popstate', handlePopState)

      // If modal is still in history, remove it
      if (window.history.state?.modal) {
        window.history.back()
        console.log('🔌 Modal cleanup: removed history state')
      }
    }
  }, [modal.isOpen, closeModal, registerInteraction])

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Respect 'required' option - if set, backdrop click is disabled
      if (e.target === e.currentTarget && !modal.options?.disableBackdropClick && !modal.options?.required) {
        closeModal()
      }
    },
    [closeModal, modal.options]
  )

  // Don't render if modal is closed
  if (!modal.isOpen) return null

  // Render modal via React Portal
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pt-20 pb-6"
      onClick={handleBackdropClick}
    >
      <div
        className="relative glass rounded-2xl shadow-glow-accent border-2 border-accent/30 max-w-[95vw] sm:max-w-md md:max-w-2xl w-full mx-4 max-h-[calc(100vh-12rem)] sm:max-h-[85vh] overflow-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent/30">
          <h2
            id="modal-title"
            className="text-2xl font-bold flex items-center gap-2"
          >
            {/* Split emoji from text */}
            {(() => {
              // Only apply emoji splitting if title is a string
              if (typeof modal.title !== 'string') {
                return modal.title
              }

              // Enhanced emoji regex that captures emoji with variation selectors
              const emojiRegex = /^((?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\u{FE00}-\u{FE0F}\u{200D}]*)\s*/u
              const match = modal.title.match(emojiRegex)
              if (match) {
                const emoji = match[1]
                const text = modal.title.slice(match[0].length)
                return (
                  <>
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-white">{text}</span>
                  </>
                )
              }
              return <span className="text-white">{modal.title}</span>
            })()}
          </h2>

          {!modal.options?.hideCloseButton && !modal.options?.required && (
            <button
              onClick={closeModal}
              className="text-text-secondary hover:text-white transition-colors p-2"
              aria-label="Close modal"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 text-gray-300">
          {modal.content}
        </div>

        {/* Buttons */}
        {modal.buttons && modal.buttons.length > 0 && (
          <div className="flex justify-end gap-3 p-6 border-t border-accent/30">
            {modal.buttons.map((button: ModalButton, index: number) => (
              <button
                key={index}
                ref={button.variant === 'primary' ? primaryButtonRef : null}
                onClick={() => {
                  button.onClick?.()
                  if (button.closeOnClick !== false) {
                    closeModal()
                  }
                }}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all
                  ${
                    button.variant === 'primary'
                      ? 'btn btn-accent'
                      : button.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500'
                        : 'btn btn-secondary'
                  }
                  ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={button.disabled}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
