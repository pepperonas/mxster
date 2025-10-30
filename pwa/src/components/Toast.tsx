/**
 * Toast Notification Component
 * Shows temporary notifications at the bottom of the screen
 * Integrates with UIContext for state management
 */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useUI } from '@/contexts'
import type { Toast as ToastType } from '@/types'

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: () => void }) {
  // Auto-remove after duration
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(onRemove, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onRemove])

  // Icon based on type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
    }
  }

  // Color based on type
  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-600 border-green-500 shadow-glow-sm'
      case 'error':
        return 'bg-red-600 border-red-500 shadow-glow-sm'
      case 'warning':
        return 'bg-yellow-600 border-yellow-500 shadow-glow-sm'
      default:
        return 'glass border-accent/30 shadow-glow-sm'
    }
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border-2
        ${getColorClasses()}
        text-white min-w-[300px] max-w-md
        animate-slide-up backdrop-blur-sm
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export function Toast() {
  const { toasts, removeToast } = useUI()

  // Don't render if no toasts
  if (toasts.length === 0) return null

  // Render toasts via React Portal
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  )
}
