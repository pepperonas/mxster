import { createContext, useContext, useReducer, ReactNode, useCallback, useRef, useMemo } from 'react'
import type { ModalOptions, ModalButton, Toast as ToastType } from '@/types'

// ============================================================================
// Types
// ============================================================================

interface Modal {
  isOpen: boolean
  /** Changes with every showModal(); AnimatePresence keys on it (old exits, new enters). */
  key: number
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
  | { type: 'SHOW_MODAL'; payload: Omit<Modal, 'isOpen' | 'key'> }
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
  /** Closes the dialog; resolves once its exit animation has finished. */
  closeModal: () => Promise<void>
  /** Called by <Modal> when the exit animation completed (AnimatePresence). */
  notifyModalExited: () => void
  addToast: (message: string, type?: ToastType['type'], duration?: number) => void
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
    key: 0,
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
let modalKeyCounter = 0

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SHOW_MODAL':
      return {
        ...state,
        modal: {
          ...action.payload,
          isOpen: true,
          key: ++modalKeyCounter
        }
      }

    case 'CLOSE_MODAL':
      // Keep title/content so the dialog can animate out with its content intact
      if (!state.modal.isOpen) return state
      return {
        ...state,
        modal: { ...state.modal, isOpen: false }
      }

    case 'ADD_TOAST': {
      const id = toastIdCounter++
      const newToast: ToastType = {
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

  // Resolvers waiting for the current dialog's exit animation
  const exitWaiters = useRef<Array<() => void>>([])
  const isOpenRef = useRef(false)
  isOpenRef.current = state.modal.isOpen


  const showModal = useCallback(
    (title: string, content: ReactNode, buttons?: Modal['buttons'], options?: ModalOptions) => {
      isOpenRef.current = true
      dispatch({
        type: 'SHOW_MODAL',
        payload: { title, content, buttons, options }
      })
    },
    []
  )

  const notifyModalExited = useCallback(() => {
    const waiters = exitWaiters.current
    exitWaiters.current = []
    waiters.forEach((resolve) => resolve())
  }, [])

  const closeModal = useCallback((): Promise<void> => {
    if (!isOpenRef.current) return Promise.resolve()
    isOpenRef.current = false
    return new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      exitWaiters.current.push(done)
      // Safety net: never hang a game flow on an animation that didn't report back
      setTimeout(done, 700)
      dispatch({ type: 'CLOSE_MODAL' })
    })
  }, [])

  const addToast = useCallback((message: string, type: ToastType['type'] = 'info', duration: number = 3000) => {
    dispatch({
      type: 'ADD_TOAST',
      payload: { message, type, duration }
    })
  }, [])

  const removeToast = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id })
  }, [])

  // Stable action identities (consumers put them in effect deps and timers)
  const actions = useMemo(
    () => ({
      openSidebar: () => dispatch({ type: 'OPEN_SIDEBAR' }),
      closeSidebar: () => dispatch({ type: 'CLOSE_SIDEBAR' }),
      toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
      startQRScanner: () => dispatch({ type: 'START_QR_SCANNER' }),
      stopQRScanner: () => dispatch({ type: 'STOP_QR_SCANNER' }),
      toggleFlashlight: () => dispatch({ type: 'TOGGLE_FLASHLIGHT' }),
      setFlashlight: (enabled: boolean) => dispatch({ type: 'SET_FLASHLIGHT', payload: enabled }),
      setLoading: (isLoading: boolean, message?: string) =>
        dispatch({ type: 'SET_LOADING', payload: { isLoading, message } })
    }),
    []
  )

  const value: UIContextValue = {
    ...state,
    showModal,
    closeModal,
    notifyModalExited,
    addToast,
    removeToast,
    ...actions
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
