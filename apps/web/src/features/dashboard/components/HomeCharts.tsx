import { type DashboardCharts, formatMonth, MONTH_SHORT_ID, ratio } from "@vynance/shared"
import { Money } from "@/components/Money"
import { usePrivacyMode } from "@/lib/hooks/usePrivacyMode"

type HomeChartsProps = { data: DashboardCharts }

const SLICE_COLORS = ["var(--pri)", "var(--exp)", "var(--warn)", "var(--trf)", "var(--inv)", "var(--faint)"]

function shortMonth(m: string): string {
  return MONTH_SHORT_ID[Number(m.slice(5, 7)) - 1] ?? m
}

/**
 * Grafik Beranda (FR-52, DS-DATA-03). SVG dekoratif (aria-hidden); semua nilai juga tersedia sebagai teks/tabel.
 * Mode privasi (BR-44): nominal disamarkan lewat <Money>, bentuk grafik disembunyikan.
 */
export function HomeCharts({ data }: HomeChartsProps) {
  const privacy = usePrivacyMode()
  const flows = data.cashflow.map((f) => ({ ...f, inc: BigInt(f.income), exp: BigInt(f.expense) }))
  const max = flows.reduce((a, f) => (f.inc > a ? f.inc : f.exp > a ? f.exp : a), 0n)
  const slices = data.byCategory.map((s) => ({ ...s, v: BigInt(s.amount) }))
  const total = slices.reduce((a, s) => a + s.v, 0n)
  const change = data.compare.changeBp

  let acc = 0
  const arcs = slices.map((s, i) => {
    const r = ratio(s.v, total)
    const start = acc
    acc += r
    return { ...s, start, r, color: SLICE_COLORS[i % SLICE_COLORS.length] }
  })
  const C = 2 * Math.PI * 15.915

  return (
    <>
      <section className="section" aria-labelledby="chart-flow">
        <h2 id="chart-flow" className="h2">
          Arus kas 6 bulan
        </h2>
        <div className="card chart-card">
          {privacy ? null : (
            <svg className="chart-bars" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">
              {flows.map((f, i) => {
                const x = i * 50 + 8
                const hi = ratio(f.inc, max) * 110
                const he = ratio(f.exp, max) * 110
                return (
                  <g key={f.month}>
                    <rect x={x} y={115 - hi} width="15" height={hi} rx="3" fill="var(--inc)" />
                    <rect x={x + 18} y={115 - he} width="15" height={he} rx="3" fill="var(--exp)" />
                  </g>
                )
              })}
            </svg>
          )}
          <div className="chart-axis" aria-hidden="true">
            {flows.map((f) => (
              <span key={f.month}>{shortMonth(f.month)}</span>
            ))}
          </div>
          <table className="chart-table">
            <caption className="sr-only">Pemasukan dan pengeluaran per bulan</caption>
            <thead>
              <tr>
                <th scope="col">Bulan</th>
                <th scope="col">
                  <span className="dot dot-inc" aria-hidden="true" /> Masuk
                </th>
                <th scope="col">
                  <span className="dot dot-exp" aria-hidden="true" /> Keluar
                </th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => (
                <tr key={f.month}>
                  <th scope="row">{formatMonth(f.month)}</th>
                  <td>
                    <Money value={f.inc} short />
                  </td>
                  <td>
                    <Money value={f.exp} short />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="chart-cat">
        <h2 id="chart-cat" className="h2">
          Pengeluaran per kategori
        </h2>
        <div className="card chart-card chart-donut-row">
          {total === 0n ? (
            <p className="body">Belum ada pengeluaran bulan ini.</p>
          ) : (
            <>
              {privacy ? null : (
                <svg className="chart-donut" viewBox="0 0 42 42" aria-hidden="true">
                  {arcs.map((a) => (
                    <circle
                      key={a.name}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="none"
                      stroke={a.color}
                      strokeWidth="6"
                      strokeDasharray={`${a.r * C} ${C}`}
                      strokeDashoffset={-a.start * C}
                      transform="rotate(-90 21 21)"
                    />
                  ))}
                </svg>
              )}
              <ul className="plain-list chart-legend">
                {arcs.map((a) => (
                  <li key={a.name}>
                    <span className="dot" style={{ background: a.color }} aria-hidden="true" />
                    <span className="truncate">{a.name}</span>
                    <span className="chart-legend-val">
                      <Money value={a.v} short />
                      {privacy ? null : <span className="row-sub"> · {Math.round(a.r * 100)}%</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="chart-compare">
        <h2 id="chart-compare" className="h2">
          Bulan ini vs bulan lalu
        </h2>
        <div className="card chart-card">
          <p className="body">
            Pengeluaran <Money value={BigInt(data.compare.current)} /> dibanding{" "}
            <Money value={BigInt(data.compare.previous)} />
            {change === null || privacy ? null : (
              <strong className={change > 0 ? "text-exp" : "text-inc"}>
                {" "}
                ({change > 0 ? "naik" : "turun"} {Math.abs(Math.round(change / 100))}%)
              </strong>
            )}
          </p>
          <ul className="plain-list chart-compare">
            {data.compare.categories.map((c) => {
              const cur = BigInt(c.current)
              const prev = BigInt(c.previous)
              const top = cur > prev ? cur : prev
              return (
                <li key={c.name}>
                  <span className="truncate">{c.name}</span>
                  {privacy ? null : (
                    <span className="chart-compare-bars" aria-hidden="true">
                      <span className="bar bar-cur" style={{ width: `${ratio(cur, top) * 100}%` }} />
                      <span className="bar bar-prev" style={{ width: `${ratio(prev, top) * 100}%` }} />
                    </span>
                  )}
                  <span className="chart-legend-val">
                    <Money value={cur} short /> <span className="row-sub">/ </span>
                    <Money value={prev} short className="row-sub" />
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
