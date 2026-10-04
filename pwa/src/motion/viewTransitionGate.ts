/**
 * Knows whether a document View Transition is running.
 *
 * Route changes animate through the View Transitions API (the new page arrives
 * as a live snapshot sliding in). A Motion entrance on that page would run at
 * the same time and the page would animate twice. Components that animate on
 * mount ask `isViewTransitionActive()` and skip their entrance when a route
 * transition is already providing one.
 *
 * Installed once in main.tsx by wrapping document.startViewTransition, which
 * covers both React Router's `viewTransition` navigations and the theme reveal.
 */

type Listener = () => void

let active = 0
const listeners = new Set<Listener>()
let installed = false

const notify = () => listeners.forEach((l) => l())

export function isViewTransitionActive(): boolean {
  return active > 0
}

export function onViewTransitionChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

interface TransitionLike {
  finished: Promise<unknown>
}

export function installViewTransitionGate(doc: Document = document): void {
  const original = (doc as Document & { startViewTransition?: (...args: unknown[]) => TransitionLike })
    .startViewTransition
  if (installed || typeof original !== 'function') return
  installed = true

  ;(doc as unknown as { startViewTransition: (...args: unknown[]) => TransitionLike }).startViewTransition = (
    ...args: unknown[]
  ) => {
    const transition = original.apply(doc, args)
    active++
    notify()
    let done = false
    const end = () => {
      if (done) return
      done = true
      active = Math.max(0, active - 1)
      notify()
    }
    transition.finished.then(end, end)
    // Never leave the gate closed if `finished` stalls (slow snapshot on weak GPUs)
    setTimeout(end, 3000)
    return transition
  }
}

/** Test hook. */
export function __resetViewTransitionGate(): void {
  active = 0
  installed = false
  listeners.clear()
}
