#!/usr/bin/env node
/**
 * App icons from one drawing: the record from components/ui/Vinyl.tsx.
 *
 *   node scripts/gen-icons.mjs
 *
 * Writes the SVG sources and renders every PNG with headless Chrome (gradients
 * and strokes render reliably there; ImageMagick's internal SVG renderer does
 * not), then packs favicon.ico from the 16/32/48 PNGs (PNG entries in an ICO
 * container, supported since Windows Vista — no extra dependency).
 *
 * Variants, because they are different jobs:
 *  - full   record with grooves on transparent ground (≥ 48 px, browser icon)
 *  - small  same record, fewer grooves, larger label — at 16/32 px the grooves
 *           blur into grey and the label is all that reads
 *  - tile   full-bleed dark square with the record inside the maskable safe
 *           zone (Android maskable, iOS touch icon — both crop themselves)
 *
 * Colours are the dark-theme tokens from styles/design-tokens.css.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../public/assets/', import.meta.url))
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const C = {
  vinyl: '#140c0e', // neutral-4
  groove: '#312829', // neutral-17
  rim: '#4a3e40', // lifts the disc off dark browser tabs
  label: '#fe4d86', // primary-60
  label2: '#ff8d43', // tertiary-70
  tile: '#b90c55', // primary-40 = --mx-brand, the "Neues Spiel" sleeve
}

function record({ grooves, labelR, arcW, rimW }) {
  const rings = grooves
    .map((r, i) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${C.groove}" stroke-width="${i % 3 === 0 ? 0.9 : 0.55}"/>`)
    .join('')
  const a0 = labelR * 0.8 // arc radius inside the label
  // Off-centre arc from 12 o'clock to ~2 o'clock, like the in-app label
  const x1 = 50 + a0 * Math.sin(Math.PI / 3)
  const y1 = 50 - a0 * Math.cos(Math.PI / 3)
  return `
    <circle cx="50" cy="50" r="${49 - rimW / 2}" fill="${C.vinyl}" stroke="${C.rim}" stroke-width="${rimW}"/>
    ${rings}
    <path d="M50 50 L24 9 A47 47 0 0 1 44 3.4 Z" fill="#fff" opacity="0.09"/>
    <path d="M50 50 L76 91 A47 47 0 0 1 56 96.6 Z" fill="#fff" opacity="0.09"/>
    <circle cx="50" cy="50" r="${labelR}" fill="${C.label}"/>
    <path d="M50 ${50 - a0}A${a0} ${a0} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="${C.label2}" stroke-width="${arcW}" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="${Math.max(2, labelR * 0.12)}" fill="${C.vinyl}"/>`
}

const svg = (body, size = 100) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${body}</svg>\n`

const FULL = record({ grooves: [44, 41, 38, 35, 32, 29, 26], labelR: 20, arcW: 3, rimW: 1.4 })
const SMALL = record({ grooves: [40, 32], labelR: 25, arcW: 5, rimW: 2.4 })
const tile = (scale) =>
  `<rect width="100" height="100" fill="${C.tile}"/><g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${FULL}</g>`

const SOURCES = {
  'icon.svg': svg(FULL),
  'icon-small.svg': svg(SMALL),
  // Maskable safe zone is the centre circle of 80 % — the disc stays inside it
  'icon-maskable.svg': svg(tile(0.72)),
  'icon-touch.svg': svg(tile(0.84)),
}

const RENDERS = [
  ['icon-small.svg', 16, 'favicon-16x16.png'],
  ['icon-small.svg', 32, 'favicon-32x32.png'],
  ['icon-small.svg', 48, 'favicon-48x48.png'],
  ['icon.svg', 192, 'icon-192.png'],
  ['icon.svg', 512, 'icon-512.png'],
  ['icon-maskable.svg', 192, 'icon-maskable-192.png'],
  ['icon-maskable.svg', 512, 'icon-maskable-512.png'],
  ['icon-touch.svg', 180, 'apple-touch-icon.png'],
]

for (const [name, body] of Object.entries(SOURCES)) writeFileSync(join(OUT, name), body)

const tmp = mkdtempSync(join(tmpdir(), 'mxster-icons-'))
try {
  for (const [src, size, out] of RENDERS) {
    const file = join(tmp, `${size}-${src}`)
    writeFileSync(file, readFileSync(join(OUT, src), 'utf8').replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`))
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--default-background-color=00000000', `--window-size=${size},${size}`,
      `--screenshot=${join(OUT, out)}`, `file://${file}`,
    ], { stdio: 'ignore' })
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

// favicon.ico: header + one 16-byte entry per image, then the raw PNGs
const pngs = [16, 32, 48].map((s) => [s, readFileSync(join(OUT, `favicon-${s}x${s}.png`))])
const head = Buffer.alloc(6 + 16 * pngs.length)
head.writeUInt16LE(0, 0)
head.writeUInt16LE(1, 2)
head.writeUInt16LE(pngs.length, 4)
let offset = head.length
pngs.forEach(([s, data], i) => {
  const e = 6 + 16 * i
  head.writeUInt8(s, e)
  head.writeUInt8(s, e + 1)
  head.writeUInt16LE(1, e + 4) // colour planes
  head.writeUInt16LE(32, e + 6) // bits per pixel
  head.writeUInt32LE(data.length, e + 8)
  head.writeUInt32LE(offset, e + 12)
  offset += data.length
})
writeFileSync(join(OUT, 'favicon.ico'), Buffer.concat([head, ...pngs.map(([, d]) => d)]))
console.log('icons written to', OUT)
