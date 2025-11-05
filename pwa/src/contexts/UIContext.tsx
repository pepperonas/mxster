import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'
import type { ModalOptions, ModalButton, Toast as ToastType } from '@/types'

// ============================================================================
// Types
// ============================================================================

interface Modal {
  isOpen: boolean
  title: string
  content: ReactNode
  buttons?: ModalButton[]
  options?: ModalOptions
}

interface UIState {
  // Modal
  modal: Modal

  // Toast Notifications
  toasts: ToastType[]

  // Sidebar
  isSidebarOpen: boolean

  // QR Scanner
  isQRScannerActive: boolean
  isFlashlightEnabled: boolean

  // Loading States
  isLoading: boolean
  loadingMessage: string
}

type UIAction =
  | { type: 'SHOW_MODAL'; payload: Omit<Modal, 'isOpen'> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'ADD_TOAST'; payload: Omit<ToastType, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: number }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'START_QR_SCANNER' }
  | { type: 'STOP_QR_SCANNER' }
  | { type: 'TOGGLE_FLASHLIGHT' }
  | { type: 'SET_FLASHLIGHT'; payload: boolean }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; message?: string } }

interface UIContextValue extends UIState {
  showModal: (title: string, content: ReactNode, buttons?: Modal['buttons'], options?: ModalOptions) => void
  closeModal: () => void
  addToast: (message: string, type?: Toast['type'], duration?: number) => void
  removeToast: (id: number) => void
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  startQRScanner: () => void
  stopQRScanner: () => void
  toggleFlashlight: () => void
  setFlashlight: (enabled: boolean) => void
  setLoading: (isLoading: boolean, message?: string) => void
}

// ============================================================================
// Context
// ============================================================================

const UIContext = createContext<UIContextValue | undefined>(undefined)

// ============================================================================
// Initial State
// ============================================================================

const initialState: UIState = {
  modal: {
    isOpen: false,
    title: '',
    content: null,
    buttons: [],
    options: {}
  },
  toasts: [],
  isSidebarOpen: false,
  isQRScannerActive: false,
  isFlashlightEnabled: false,
  isLoading: false,
  loadingMessage: ''
}

// ============================================================================
// Reducer
// ============================================================================

let toastIdCounter = 0

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SHOW_MODAL':
      return {
        ...state,
        modal: {
          ...action.payload,
          isOpen: true
        }
      }

    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: initialState.modal
      }

    case 'ADD_TOAST': {
      const id = toastIdCounter++
      const newToast: Toast = {
        ...action.payload,
        id
      }
      return {
        ...state,
        toasts: [...state.toasts, newToast]
      }
    }

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload)
      }

    case 'OPEN_SIDEBAR':
      return { ...state, isSidebarOpen: true }

    case 'CLOSE_SIDEBAR':
      return { ...state, isSidebarOpen: false }

    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen }

    case 'START_QR_SCANNER':
      return { ...state, isQRScannerActive: true }

    case 'STOP_QR_SCANNER':
      return {
        ...state,
        isQRScannerActive: false,
        isFlashlightEnabled: false
      }

    case 'TOGGLE_FLASHLIGHT':
      return {
        ...state,
        isFlashlightEnabled: !state.isFlashlightEnabled
      }

    case 'SET_FLASHLIGHT':
      return {
        ...state,
        isFlashlightEnabled: action.payload
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingMessage: action.payload.message || ''
      }

    default:
      return state
  }
}

// ============================================================================
// Provider
// ============================================================================

interface UIProviderProps {
  children: ReactNode
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, initialState)

  const showModal = useCallback(
    (title: string, content: ReactNode, buttons?: Modal['buttons'], options?: ModalOptions) => {
      dispatch({
        type: 'SHOW_MODAL',
        payload: { title, content, buttons, options }
      })
    },
    []
  )

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' })
  }, [])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    dispatch({
      type: 'ADD_TOAST',
      payload: { message, type, duration }
    })
  }, [])

  const removeToast = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id })
  }, [])

  const value: UIContextValue = {
    ...state,
    showModal,
    closeModal,
    addToast,
    removeToast,
    openSidebar: () => dispatch({ type: 'OPEN_SIDEBAR' }),
    closeSidebar: () => dispatch({ type: 'CLOSE_SIDEBAR' }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    startQRScanner: () => dispatch({ type: 'START_QR_SCANNER' }),
    stopQRScanner: () => dispatch({ type: 'STOP_QR_SCANNER' }),
    toggleFlashlight: () => dispatch({ type: 'TOGGLE_FLASHLIGHT' }),
    setFlashlight: (enabled) => dispatch({ type: 'SET_FLASHLIGHT', payload: enabled }),
    setLoading: (isLoading, message) =>
      dispatch({ type: 'SET_LOADING', payload: { isLoading, message } })
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
