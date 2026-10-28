import { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { backStep, currentIdx, notePath, type Step } from './backStack'

/** Note every page with its history index (mounted once, in the router root). */
export function useNoteNavigation(): void {
  const { pathname, key } = useLocation()
  useEffect(() => notePath(currentIdx(), pathname), [pathname, key])
}

export function useStep() {
  const navigate = useAppNavigate()
  return useCallback(
    (step: Step) => {
      if (step.kind === 'back') navigate(-1)
      else navigate(step.to, { replace: step.replace })
    },
    [navigate]
  )
}

/** Back to `to`: one step back when it is the page behind, otherwise in place. */
export function useGoBack() {
  const run = useStep()
  return useCallback((to: string) => run(backStep(to)), [run])
}
