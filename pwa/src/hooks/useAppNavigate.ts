/**
 * Navigation wrapper that opts every route change into the View Transitions
 * API (M3 shared-element route transitions). Falls back automatically:
 * React Router feature-detects document.startViewTransition, and reduced
 * motion disables the transition at the source.
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavigateOptions, To } from 'react-router-dom'
import { prefersReducedMotion } from '@/utils/animationHelpers'

export function useAppNavigate() {
  const navigate = useNavigate()

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        navigate(to)
        return
      }
      navigate(to, { viewTransition: !prefersReducedMotion(), ...options })
    },
    [navigate]
  )
}
