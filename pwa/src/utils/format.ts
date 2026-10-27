import { defineMessages, getLang, localeOf, msg, type Lang } from '@/i18n'

const text = defineMessages({
  de: { today: 'heute', yesterday: 'gestern' },
  en: { today: 'today', yesterday: 'yesterday' }
})

const formatters = new Map<Lang, { day: Intl.DateTimeFormat; dayYear: Intl.DateTimeFormat; time: Intl.DateTimeFormat }>()
function fmt(lang: Lang = getLang()) {
  let f = formatters.get(lang)
  if (!f) {
    const locale = localeOf(lang)
    f = {
      day: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }),
      dayYear: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
    }
    formatters.set(lang, f)
  }
  return f
}

/** "today", "yesterday", "12 March" or "12 March 2025" for other years (in the app's language). */
export function formatDay(iso: string | number, now = new Date()): string {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diff === 0) return msg(text).today
  if (diff === 1) return msg(text).yesterday
  return d.getFullYear() === now.getFullYear() ? fmt().day.format(d) : fmt().dayYear.format(d)
}

export function formatTime(iso: string | number): string {
  return fmt().time.format(new Date(iso))
}
