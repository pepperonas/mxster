/**
 * Clock offset to the server (pure). Each ping gives one estimate: the server
 * stamped its time somewhere between sending and receiving, so assume the
 * middle. The median of the latest samples ignores a slow round trip.
 */
export interface ClockSample {
  sent: number
  received: number
  server: number
}

export function offsetOf({ sent, received, server }: ClockSample): number {
  return server - (sent + received) / 2
}

export function medianOffset(samples: readonly ClockSample[]): number {
  if (samples.length === 0) return 0
  const values = samples.map(offsetOf).sort((a, b) => a - b)
  const mid = Math.floor(values.length / 2)
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2
}

/** Where the song should be now, in seconds, for a cue (server ms) and an offset. */
export function cuePosition(cue: { playing: boolean; positionMs: number; at: number }, localNow: number, offset: number): number {
  const serverNow = localNow + offset
  const ms = cue.playing ? cue.positionMs + Math.max(0, serverNow - cue.at) : cue.positionMs
  return ms / 1000
}
