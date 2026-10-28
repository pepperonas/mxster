/**
 * The colour of an album cover, for the glow behind the turntable on reveal.
 *
 * `dominantColor` is pure: it averages the pixels, giving colourful ones more
 * weight and leaving out near-black and near-white (borders, text, empty
 * backgrounds), so a mostly black cover with a red logo glows red. `tameColor`
 * then keeps the result calm: moderate saturation, mid lightness — a glow, not
 * a flood. The covers are same-origin, so a canvas may read them.
 */
import { useEffect, useState } from 'react'

export type Rgb = [number, number, number]

/** RGBA pixel data → weighted average colour, or null when nothing colourful is left. */
export function dominantColor(data: ArrayLike<number>): Rgb | null {
  let r = 0
  let g = 0
  let b = 0
  let w = 0
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const R = data[i]
    const G = data[i + 1]
    const B = data[i + 2]
    const max = Math.max(R, G, B)
    const min = Math.min(R, G, B)
    if (max < 28 || min > 235) continue
    const sat = max === 0 ? 0 : (max - min) / max
    const weight = 0.15 + sat * sat * 4
    r += R * weight
    g += G * weight
    b += B * weight
    w += weight
  }
  if (w === 0) return null
  return [Math.round(r / w), Math.round(g / w), Math.round(b / w)]
}

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return [h * 60, s, l]
}

function toRgb([h, s, l]: [number, number, number]): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/** Same hue, saturation at most 0.7, lightness between 0.42 and 0.62. */
export function tameColor(rgb: Rgb): Rgb {
  const [h, s, l] = toHsl(rgb)
  return toRgb([h, Math.min(s, 0.7), Math.min(0.62, Math.max(0.42, l))])
}

const cache = new Map<string, Rgb | null>()

/** The cover's tamed colour once the image has loaded (null while loading, on error, or for a grey cover). */
export function useCoverColor(src: string | null | undefined): Rgb | null {
  const [color, setColor] = useState<Rgb | null>(src ? (cache.get(src) ?? null) : null)
  useEffect(() => {
    if (!src) {
      setColor(null)
      return
    }
    if (cache.has(src)) {
      setColor(cache.get(src) ?? null)
      return
    }
    let alive = true
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      let result: Rgb | null = null
      try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 24
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(img, 0, 0, 24, 24)
          const found = dominantColor(ctx.getImageData(0, 0, 24, 24).data)
          result = found ? tameColor(found) : null
        }
      } catch {
        result = null
      }
      cache.set(src, result)
      if (alive) setColor(result)
    }
    img.onerror = () => {
      cache.set(src, null)
      if (alive) setColor(null)
    }
    img.src = src
    return () => {
      alive = false
    }
  }, [src])
  return color
}

/** Load a cover ahead of time (the reveal then shows it at once). */
export function preloadCover(src: string): void {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}
