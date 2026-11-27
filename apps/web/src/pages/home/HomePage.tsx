import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { addMonths, formatMonth, heroNeedsShort, monthOf } from "@vynance/shared"
import { IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { useMe } from "@/features/auth"
import { BookPicker, useActiveBook } from "@/features/books"
import { TopBudgets, useDashboard } from "@/features/dashboard"
import { HealthScoreCard, useHealthScore } from "@/features/health-score"
import { TransactionRow } from "@/features/transactions"

const route = getRouteApi("/_tabs/")

/** Beranda (design/03-dashboard.svg, FR-50/FR-53): kekayaan bersih, bulan dipilih, anggaran teratas, transaksi terakhir. */
export function HomePage() {
  const navigate = useNavigate({ from: "/" })
  const { bulan } = route.useSearch()
  const month = bulan ?? monthOf(new Date())
  const bookId = useActiveBook()?.id ?? ""
  const me = useMe()
  const q = useDashboard(bookId, month)
  const score = useHealthScore(bookId, month)
  const d = q.data
  const firstName = me.data?.name.split(" ")[0] ?? ""

  return (
    <>
      <header className="home-head">
        <h1 className="h1-tab">{firstName ? `Halo, ${firstName}` : "Halo"}</h1>
        <BookPicker />
      </header>

      {q.isPending ? <Skeleton rows={3} height={96} /> : null}
      {q.isError && !d ? (
        <ErrorState message="Beranda gagal dimuat." onRetry={() => void q.refetch()} retrying={q.isFetching} />
      ) : null}

      {d ? (
        <>
          <section className="hero" aria-label="Kekayaan bersih">
            <p className="hero-label">Kekayaan bersih</p>
            <p className="hero-value">
              <Money value={BigInt(d.wealth.netWorth)} short={heroNeedsShort(BigInt(d.wealth.netWorth))} />
            </p>
            <div className="hero-stats">
              <div>
                <p className="hero-label">Kas</p>
                <Money value={BigInt(d.wealth.cash)} short />
              </div>
              <div>
                <p className="hero-label">Investasi</p>
                <Money value={BigInt(d.wealth.investments)} short />
              </div>
              <div>
                <p className="hero-label">Utang</p>
                <Money value={BigInt(d.wealth.debt)} short />
              </div>
            </div>
          </section>

          <section className="card month-card" aria-label={`Ringkasan ${formatMonth(month)}`}>
            <div className="month-nav">
              <IconButton
                icon="chev_l"
                label="Bulan sebelumnya"
                onClick={() => void navigate({ search: { bulan: addMonths(month, -1) } })}
              />
              <span className="month-label">{formatMonth(month)}</span>
              <IconButton
                icon="chev_r"
                label="Bulan berikutnya"
                onClick={() => void navigate({ search: { bulan: addMonths(month, 1) } })}
              />
            </div>
            <p className="row-sub">
              Sisa <Money value={BigInt(d.monthSummary.income) - BigInt(d.monthSummary.expense)} />
            </p>
            <div className="summary-strip">
              <div>
                <p className="row-sub">Uang masuk</p>
                <Money value={BigInt(d.monthSummary.income)} tone="inc" />
              </div>
              <div>
                <p className="row-sub">Uang keluar</p>
                <Money value={BigInt(d.monthSummary.expense)} tone="exp" />
              </div>
            </div>
          </section>

          <section className="section" aria-labelledby="home-health">
            <h2 id="home-health" className="sr-only">
              Skor kesehatan
            </h2>
            {score.data ? (
              <HealthScoreCard
                score={score.data}
                onOpen={() => void navigate({ to: "/skor-kesehatan", search: { bulan: month } })}
              />
            ) : null}
          </section>

          <section className="section" aria-labelledby="home-budget">
            <div className="section-head">
              <h2 id="home-budget" className="h2">
                Anggaran bulan ini
              </h2>
              <Link to="/anggaran" search={{ bulan: month }} className="text-link">
                Lihat semua
              </Link>
            </div>
            {d.topBudgets.length ? (
              <TopBudgets items={d.topBudgets} />
            ) : (
              <EmptyState
                icon="pie"
                title="Anggaran belum diatur"
                body="Atur alokasi per kategori supaya pengeluaran terpantau."
                actionLabel="Atur anggaran"
                onAction={() => void navigate({ to: "/anggaran", search: { bulan: month } })}
              />
            )}
          </section>

          <section className="section" aria-labelledby="home-recent">
            <div className="section-head">
              <h2 id="home-recent" className="h2">
                Transaksi terakhir
              </h2>
              <Link to="/transaksi" className="text-link">
                Semua
              </Link>
            </div>
            {d.recent.length ? (
              <div className="card plain-list">
                {d.recent.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    onOpen={() => void navigate({ to: "/transaksi/$id", params: { id: tx.id } })}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon="list" title="Belum ada transaksi" body="Catat uang masuk atau keluar pertama Anda." />
            )}
          </section>
        </>
      ) : null}
    </>
  )
}
