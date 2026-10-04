/**
 * Lets foreground interactions ask the WebGL background to step back.
 *
 * While any reason is active (e.g. a card is being dragged) the particle
 * scene renders at a reduced frame rate, so the main thread and GPU belong to
 * the gesture. Reasons are reference-counted by name.
 */
const reasons = new Set<string>()

export function quietBackground(reason: string): () => void {
  reasons.add(reason)
  return () => reasons.delete(reason)
}

export function isBackgroundQuiet(): boolean {
  return reasons.size > 0
}
