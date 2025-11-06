/**
 * Hook for managing game history (completed games)
 *
 * NOTE: This hook is now a re-export from GameHistoryContext for backward compatibility.
 * The Context-based implementation provides shared state across all components,
 * ensuring automatic UI updates without needing page refreshes.
 *
 * @deprecated Import directly from '@/contexts' instead
 */
export { useGameHistory } from '@/contexts/GameHistoryContext'
