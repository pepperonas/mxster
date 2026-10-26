const day = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' })
const dayYear = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })

/** "heute", "gestern", "12. März" or "12. März 2025" for other years. */
export function formatDay(iso: string | number, now = new Date()): string {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diff === 0) return 'heute'
  if (diff === 1) return 'gestern'
  return d.getFullYear() === now.getFullYear() ? day.format(d) : dayYear.format(d)
}

export function formatTime(iso: string | number): string {
  return time.format(new Date(iso))
}
