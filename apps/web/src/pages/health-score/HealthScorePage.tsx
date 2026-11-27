import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { addMonths, formatMonth, HEALTH_LEVEL_TONE, monthOf, PILLAR_LABEL, type PillarKey } from "@vynance/shared"
import { IconButton } from "@/components/Button"
import { Pill } from "@/components/Pill"
import { ProgressBar } from "@/components/ProgressBar"
import { ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { useHealthScore } from "@/features/health-score"

const route = getRouteApi("/_tabs/skor-kesehatan")

/** Penjelasan singkat tiap pilar (BRD §8.2) supaya pengguna tahu cara menaikkan poin. */
const PILLAR_HINT: Record<PillarKey, string> = {
  savings: "Sisihkan minimal 20% dari uang masuk bulan ini.",
  budget: "Atur anggaran kategori dan jaga realisasi tetap di bawah alokasi.",
  debt: "Jaga pemakaian limit kartu kredit dan PayLater di bawah 30%.",
  investment: "Bangun porsi investasi minimal 20% dari kas + investasi.",
}

/**
 * Rincian skor kesehatan (FR-51, BRD §8.2): total, tingkat, rincian 4 pilar.
 * Pilar tanpa data ditandai "Belum dinilai" dan tidak dihitung sebagai 25 poin.
 */
export function HealthScorePage() {
  const navigate = useNavigate({ from: "/skor-kesehatan" })
  const { bulan } = route.useSearch()
  const month = bulan ?? monthOf(new Date())
  const bookId = useActiveBook()?.id ?? ""
  const q = useHealthScore(bookId, month)
  const d = q.data

  return (
    <>
      <TopBar
        level={2}
        title="Skor kesehatan"
        backLabel="Kembali ke Beranda"
        onBack={() => void navigate({ to: "/" })}
      />

      {q.isPending ? <Skeleton rows={4} height={88} /> : null}
      {q.isError && !d ? (
        <ErrorState message="Skor kesehatan gagal dimuat." onRetry={() => void q.refetch()} retrying={q.isFetching} />
      ) : null}

      {d ? (
        <>
          <section className="card score-hero" aria-label={`Skor kesehatan ${d.score} dari 100`}>
            <p className="hero-label">Skor kesehatan</p>
            <p className="score-hero-num">
              {d.score}
              <span className="score-hero-max">/100</span>
            </p>
            <Pill tone={HEALTH_LEVEL_TONE[d.level]}>{d.levelLabel}</Pill>
            <p className="row-sub score-note">{d.note}</p>
          </section>

          <section className="section" aria-labelledby="health-pillars">
            <h2 id="health-pillars" className="h2">
              Rincian pilar
            </h2>
            <div className="card plain-list">
              {d.pillars.map((p) => (
                <div key={p.key} className="status-row score-pillar-row">
                  <div className="row-main">
                    <span className="row-title">
                      <span className="truncate">{PILLAR_LABEL[p.key]}</span>
                      {p.status === "not_assessed" ? <Pill tone="neutral">Belum dinilai</Pill> : null}
                    </span>
                    <span className="row-sub">{p.detail}</span>
                    {p.status === "scored" ? (
                      <ProgressBar
                        valueBp={Math.round((p.points / 25) * 10_000)}
                        tone={p.points >= 20 ? "inc" : p.points >= 10 ? "warn" : "exp"}
                        label={`${p.label}: ${Math.round(p.points)} dari 25 poin`}
                      />
                    ) : null}
                    <span className="row-meta score-hint">{PILLAR_HINT[p.key]}</span>
                  </div>
                  <span className="score-points" aria-hidden="true">
                    {p.status === "scored" ? `${Math.round(p.points)}/25` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
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
              Pilar anggaran dan tabungan dihitung dari bulan yang dipilih. Pilar utang memakai pemakaian limit saat
              ini.
            </p>
          </section>
        </>
      ) : null}
    </>
  )
}
