/**
 * QR code as crisp SVG. Always dark modules on a white tile with a quiet zone,
 * whatever the theme — scanners need the contrast, not our colours.
 */
import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

export function QrCode({ value, size = 200, label }: { value: string; size?: number; label: string }) {
  const { cells, count } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(value)
    qr.make()
    const n = qr.getModuleCount()
    const out: string[] = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) out.push(`M${c} ${r}h1v1h-1z`)
    return { cells: out.join(''), count: n }
  }, [value])
  const quiet = 4
  const box = count + quiet * 2
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${box} ${box}`}
      shapeRendering="crispEdges"
      className="rounded-m3-lg"
      style={{ background: '#fff' }}
    >
      <path d={cells} fill="#111" />
    </svg>
  )
}
