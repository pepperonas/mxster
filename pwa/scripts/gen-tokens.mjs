/**
 * Regenerates the M3 reference palettes in src/styles/design-tokens.css
 * (between the GENERATED PALETTES markers) from the brand seeds below.
 *
 *   node scripts/gen-tokens.mjs          # rewrite the block
 *   node scripts/gen-tokens.mjs --check  # exit 1 if the file is out of date
 *
 * Roles (dark/light) reference tones by name, so a reseed reskins everything.
 */
import { readFileSync, writeFileSync } from 'node:fs'
// Deep imports: the package's barrel has extension-less ESM paths Node can't resolve.
import { Hct } from '../node_modules/@material/material-color-utilities/hct/hct.js'
import { TonalPalette } from '../node_modules/@material/material-color-utilities/palettes/tonal_palette.js'
import { argbFromHex } from '../node_modules/@material/material-color-utilities/utils/string_utils.js'

export const SEEDS = {
  primary: '#C2185B',   // vinyl magenta
  tertiary: '#FF8A3D',  // warm amber-orange (stage light)
  error: '#B3261E',
  success: '#2E9E5B',
  warning: '#F2A900',
  data: '#1E88E5',      // cool third hue for charts only (series 3)
}

const TONES = [0, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 100]

function palettes() {
  const p = Hct.fromInt(argbFromHex(SEEDS.primary))
  const t = Hct.fromInt(argbFromHex(SEEDS.tertiary))
  return {
    primary: TonalPalette.fromHueAndChroma(p.hue, Math.max(p.chroma, 60)),
    secondary: TonalPalette.fromHueAndChroma(p.hue, 22),
    tertiary: TonalPalette.fromHueAndChroma(t.hue, Math.max(t.chroma, 50)),
    neutral: TonalPalette.fromHueAndChroma(p.hue, 6),
    'neutral-variant': TonalPalette.fromHueAndChroma(p.hue, 12),
    error: TonalPalette.fromInt(argbFromHex(SEEDS.error)),
    success: TonalPalette.fromInt(argbFromHex(SEEDS.success)),
    warning: TonalPalette.fromInt(argbFromHex(SEEDS.warning)),
    data: TonalPalette.fromInt(argbFromHex(SEEDS.data)),
  }
}

const triplet = (argb) => `${(argb >> 16) & 255} ${(argb >> 8) & 255} ${argb & 255}`

export function renderBlock() {
  const lines = ['/* BEGIN GENERATED PALETTES — scripts/gen-tokens.mjs */', ':root {']
  for (const [name, pal] of Object.entries(palettes())) {
    lines.push(`  /* ${name} */`)
    for (const tone of TONES) lines.push(`  --md-ref-${name}-${tone}: ${triplet(pal.tone(tone))};`)
  }
  lines.push('}', '/* END GENERATED PALETTES */')
  return lines.join('\n')
}

const file = new URL('../src/styles/design-tokens.css', import.meta.url)
const css = readFileSync(file, 'utf8')
const re = /\/\* BEGIN GENERATED PALETTES[\s\S]*?\/\* END GENERATED PALETTES \*\//
if (!re.test(css)) throw new Error('GENERATED PALETTES markers missing in design-tokens.css')
const next = css.replace(re, renderBlock())
if (process.argv.includes('--check')) {
  if (next !== css) { console.error('design-tokens.css is out of date — run node scripts/gen-tokens.mjs'); process.exit(1) }
} else {
  writeFileSync(file, next)
  console.log('palettes regenerated')
}
