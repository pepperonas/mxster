/**
 * Modal Component
 * Reusable modal dialog with React Portal
 * Integrates with UIContext for state management
 */

import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useUI } from '@/contexts'
import type { ModalButton } from '@/types'

export function Modal() {
  const { modal, hideModal } = useUI()

  // Close modal on ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modal.options?.disableEscapeKey) {
        hideModal()
      }
    },
    [hideModal, modal.options]
  )

  // Register ESC key listener
  useEffect(() => {
    if (modal.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [modal.isOpen, handleKeyDown])

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !modal.options?.disableBackdropClick) {
        hideModal()
      }
    },
    [hideModal, modal.options]
  )

  // Don't render if modal is closed
  if (!modal.isOpen) return null

  // Render modal via React Portal
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2
            id="modal-title"
            className="text-2xl font-bold text-white"
          >
            {modal.title}
          </h2>

          {!modal.options?.hideCloseButton && (
            <button
              onClick={hideModal}
              className="text-gray-400 hover:text-white transition-colors p-2"
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
          <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
            {modal.buttons.map((button: ModalButton, index: number) => (
              <button
                key={index}
                onClick={() => {
                  button.onClick?.()
                  if (button.closeOnClick !== false) {
                    hideModal()
                  }
                }}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all
                  ${
                    button.variant === 'primary'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : button.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }
                  ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={button.disabled}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
