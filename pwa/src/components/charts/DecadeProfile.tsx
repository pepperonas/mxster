/**
 * Decade profile: the spider web over the eight decades for up to three
 * people. Two views of the same question "where do you know your music?":
 *  - Trefferquote: share of right placements/guesses per decade (needs the
 *    turn log, i.e. rounds since v0.6.0);
 *  - Karten: where a person's right cards come from (all rounds).
 * The view without data is not offered as default; a table carries every value.
 */
import { useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { decadeLabel, DECADES } from '@/game/songPool'
import { decadeRates, decadeShares, type PlayerSummary } from '@/game/stats'
import { RadarChart } from './RadarChart'
import { useMessages } from '@/i18n'
import { statsText } from '@/i18n/messages/stats'

type Metric = 'rate' | 'cards'

export function DecadeProfile({ people }: { people: PlayerSummary[] }) {
  const t = useMessages(statsText)
  const hasRates = people.some((p) => p.tries > 0)
  const hasCards = people.some((p) => DECADES.some((d) => p.byDecade[d].cards > 0))
  const [picked, setMetric] = useState<Metric | null>(null)
  const metric: Metric = picked ?? (hasRates ? 'rate' : 'cards')
  const axes = DECADES.map(decadeLabel)

  const series =
    metric === 'rate'
      ? people.map((p) => {
          const r = decadeRates(p)
          return {
            name: p.name,
            values: r.map((d) => d.rate),
            detail: r.map((d) => t.rightOf(p.byDecade[d.decade].correct, d.tries))
          }
        })
      : people.map((p) => {
          const s = decadeShares(p)
          return {
            name: p.name,
            values: s.map((d) => (d.cards > 0 ? d.share : null)),
            detail: s.map((d) => t.cardCount(d.cards))
          }
        })

  // Shares rarely pass 40 %: scale the web to the largest share (rounded up to 10 %)
  const maxShare = Math.max(0.1, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)))
  const max = metric === 'rate' ? 1 : Math.min(1, Math.ceil(maxShare * 10) / 10)

  return (
    <div className="space-y-3">
      <SegmentedControl<Metric>
        label={t.metric}
        value={metric}
        onChange={setMetric}
        segments={[
          { value: 'rate', label: t.hitRate },
          { value: 'cards', label: t.cards }
        ]}
      />
      <p className="text-body-sm text-md-on-surface-variant">
        {metric === 'rate'
          ? t.rateHint
          : t.cardsHint}
      </p>

      {(metric === 'rate' && !hasRates) || (metric === 'cards' && !hasCards) ? (
        <p className="rounded-m3-lg bg-md-surface-container p-4 text-body-md text-md-on-surface-variant">
          {metric === 'rate' ? t.noRatesYet : t.noCardsYet}
        </p>
      ) : (
        <>
          <RadarChart
            axes={axes}
            series={series}
            max={max}
            label={t.profileAria(metric === 'rate' ? t.hitRate : t.shareOfCards, people.map((p) => p.name).join(', '))}
          />
          <details className="group">
            <summary className="cursor-pointer text-label-lg text-md-primary py-2 list-none">
              <span className="group-open:hidden">{t.showTable}</span>
              <span className="hidden group-open:inline">{t.hideTable}</span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm tabular">
                <thead>
                  <tr className="text-md-on-surface-variant text-left">
                    <th className="py-1 pr-3 font-medium">{t.decade}</th>
                    {series.map((s) => (
                      <th key={s.name} className="py-1 pr-3 font-medium truncate max-w-[8rem]">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {axes.map((a, i) => (
                    <tr key={a} className="border-t border-md-outline-variant/50">
                      <td className="py-1 pr-3">{a}</td>
                      {series.map((s) => (
                        <td key={s.name} className="py-1 pr-3">
                          {s.values[i] === null ? '–' : t.percent(Math.round((s.values[i] as number) * 100))}
                          <span className="text-md-on-surface-variant"> ({s.detail[i]})</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  )
}
