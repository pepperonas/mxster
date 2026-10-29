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

  // Loading States
  isLoading: boolean
  loadingMessage: string
}

type UIAction =
  | { type: 'SHOW_MODAL'; payload: Omit<Modal, 'isOpen' | 'key'> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'ADD_TOAST'; payload: Omit<ToastType, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: number }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; message?: string } }

interface UIContextValue extends UIState {
  showModal: (title: string, content: ReactNode, buttons?: Modal['buttons'], options?: ModalOptions) => void
  /** Closes the dialog; resolves once its exit animation has finished. */
  closeModal: () => Promise<void>
  /** Called by <Modal> when the exit animation completed (AnimatePresence). */
  notifyModalExited: () => void
  addToast: (message: string, type?: ToastType['type'], duration?: number, action?: ToastType['action']) => void
  removeToast: (id: number) => void
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

  const addToast = useCallback(
    (message: string, type: ToastType['type'] = 'info', duration: number = 3000, action?: ToastType['action']) => {
    dispatch({
      type: 'ADD_TOAST',
      payload: { message, type, duration, action }
    })
  }, [])

  const removeToast = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id })
  }, [])

  // Stable action identities (consumers put them in effect deps and timers)
  const actions = useMemo(
    () => ({
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

/** The toast function when a UIProvider is around, else null (components that also render standalone). */
export function useToastOptional(): UIContextValue['addToast'] | null {
  return useContext(UIContext)?.addToast ?? null
}
