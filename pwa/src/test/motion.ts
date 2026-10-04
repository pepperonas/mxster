/** Flip the mocked prefers-reduced-motion media query (see setup.ts). */
export function setReducedMotion(value: boolean): void {
  ;(window as { __mxReducedMotion?: boolean }).__mxReducedMotion = value
}
