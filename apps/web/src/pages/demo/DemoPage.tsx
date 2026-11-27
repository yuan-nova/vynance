import { useNavigate } from "@tanstack/react-router"
import { dateOnlyOf, demoTotals, formatDateShort, formatMonth, monthOfDate } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { DemoForm, demoActions, useDemoTransactions } from "@/features/demo"

/**
 * Mode demo tanpa akun (FR-151). Data hanya di perangkat; setelah daftar, Beranda menawarkan impor (PB-01 langkah 4).
 * Tanpa bottom nav karena belum ada buku (DS-NAV-01 pengecualian, sama seperti layar Masuk).
 */
export function DemoPage() {
  const navigate = useNavigate()
  const rows = useDemoTransactions()
  const [adding, setAdding] = useState(false)
  const [remove, setRemove] = useState<string | null>(null)
  const month = monthOfDate(dateOnlyOf(new Date()))
  const totals = demoTotals(rows, month)

  return (
    <div className="app-shell">
      <main className="app-main demo-page">
        <TopBar
          level={2}
          title="Mode Demo"
          backLabel="Kembali ke Masuk"
          onBack={() => void navigate({ to: "/masuk" })}
        />
        <p className="demo-banner" role="status">
          Data demo hanya tersimpan di perangkat ini. Daftar untuk menyimpannya ke buku dan memakai semua fitur.
        </p>

        <section className="hero" aria-label={`Ringkasan ${formatMonth(month)}`}>
          <p className="hero-label">{formatMonth(month)}</p>
          <p className="hero-value">
            <Money value={totals.income - totals.expense} />
          </p>
          <div className="hero-row">
            <span>
              Masuk <Money value={totals.income} short />
            </span>
            <span>
              Keluar <Money value={totals.expense} short />
            </span>
          </div>
        </section>

        <div className="stack section">
          <Button full icon="plus" onClick={() => setAdding(true)}>
            Catat transaksi
          </Button>
          <Button variant="soft" full onClick={() => void navigate({ to: "/masuk" })}>
            Daftar dan simpan data
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Belum ada transaksi demo"
            body="Coba catat pengeluaran atau pemasukan. Setelah daftar, kamu bisa mengimpornya."
            actionLabel="Catat transaksi"
            onAction={() => setAdding(true)}
          />
        ) : (
          <section className="section" aria-labelledby="demo-list">
            <div className="section-head">
              <h2 id="demo-list" className="h2">
                {rows.length} transaksi
              </h2>
            </div>
            <div className="card plain-list">
              {rows.map((r) => (
                <ListRow
                  key={r.id}
                  icon={r.type === "income" ? "trend" : "tag"}
                  tone={r.type === "income" ? "inc" : "exp"}
                  title={r.note ?? r.categoryName}
                  subtitle={`${r.categoryName} · ${formatDateShort(r.txDate)}`}
                  trailing={<Money value={BigInt(r.amount)} sign={r.type} />}
                  ariaLabel={`Hapus ${r.note ?? r.categoryName}`}
                  onClick={() => setRemove(r.id)}
                />
              ))}
            </div>
          </section>
        )}

        <Sheet open={adding} title="Catat transaksi demo" onClose={() => setAdding(false)}>
          {adding ? <DemoForm onSaved={() => setAdding(false)} /> : null}
        </Sheet>

        <Sheet
          open={remove !== null}
          title="Hapus transaksi demo?"
          onClose={() => setRemove(null)}
          footer={
            <>
              <Button
                variant="destructive"
                full
                onClick={() => {
                  if (remove) demoActions.remove(remove)
                  setRemove(null)
                }}
              >
                Hapus
              </Button>
              <Button variant="ghost" full onClick={() => setRemove(null)}>
                Batal
              </Button>
            </>
          }
        >
          <p className="row-sub">Transaksi ini hanya ada di perangkat, jadi tidak bisa dikembalikan.</p>
        </Sheet>
      </main>
    </div>
  )
}
