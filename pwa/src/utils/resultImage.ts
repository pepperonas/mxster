/**
 * The end of a round as a picture to share (WhatsApp and friends): the record,
 * the winner (or today's score), the ranking and the date, in the app's
 * colours. Drawn on a canvas, no library.
 */
export interface ResultCard {
  /** Big line: the winner's name or "7 von 10". */
  headline: string
  /** Small line above it: "Gewonnen hat" / "Tagesrunde". */
  kicker: string
  rows: { place: string; name: string; value: string }[]
  footer: string
}

const W = 1080
const H = 1350

function cssRgb(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v ? `rgb(${v})` : fallback
}

/** Shrinks the font until the text fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, weight: string, family: string): number {
  let s = size
  do {
    ctx.font = `${weight} ${s}px ${family}`
    if (ctx.measureText(text).width <= max) break
    s -= 4
  } while (s > 24)
  return s
}

export async function drawResultCard(card: ResultCard): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try {
    await document.fonts?.ready
  } catch {
    /* draw with whatever font is there */
  }
  const family = '"Roboto Flex", system-ui, sans-serif'
  const brand = cssRgb('--mx-brand', '#c2185b')
  const onBrand = cssRgb('--mx-on-brand', '#ffffff')

  ctx.fillStyle = brand
  ctx.fillRect(0, 0, W, H)

  // The record, half off the right edge
  const cx = W - 120
  const cy = 300
  ctx.fillStyle = '#111014'
  ctx.beginPath()
  ctx.arc(cx, cy, 300, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 2
  for (let r = 120; r < 295; r += 9) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = onBrand
  ctx.beginPath()
  ctx.arc(cx, cy, 95, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = brand
  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = onBrand
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 64px ${family}`
  ctx.fillText('mxtape', 80, 140)

  ctx.globalAlpha = 0.85
  ctx.font = `500 44px ${family}`
  ctx.fillText(card.kicker, 80, 560)
  ctx.globalAlpha = 1
  const size = fit(ctx, card.headline, W - 160, 150, '900', family)
  ctx.font = `900 ${size}px ${family}`
  ctx.fillText(card.headline, 80, 560 + size + 10)

  let y = 560 + size + 110
  for (const row of card.rows.slice(0, 6)) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.beginPath()
    ctx.roundRect(80, y - 62, W - 160, 88, 28)
    ctx.fill()
    ctx.fillStyle = onBrand
    ctx.font = `700 40px ${family}`
    ctx.fillText(row.place, 112, y)
    const nameSize = fit(ctx, row.name, W - 520, 40, '500', family)
    ctx.font = `500 ${nameSize}px ${family}`
    ctx.fillText(row.name, 190, y)
    ctx.font = `700 40px ${family}`
    ctx.textAlign = 'right'
    ctx.fillText(row.value, W - 112, y)
    ctx.textAlign = 'left'
    y += 108
  }

  ctx.globalAlpha = 0.85
  ctx.font = `500 34px ${family}`
  ctx.fillText(card.footer, 80, H - 80)
  ctx.globalAlpha = 1

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** Share the picture where the device can, download it otherwise. */
export async function shareResultCard(card: ResultCard, fileName = 'mxtape.png'): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await drawResultCard(card)
  if (!blob) return 'failed'
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'mxtape' })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
