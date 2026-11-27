import { useNavigate } from "@tanstack/react-router"
import { formatMonth, type Payslip } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { PayslipForm, useDeletePayslip, usePayslips, useSavePayslip } from "@/features/payslips"
import { showSnackbar } from "@/lib/snackbar"

type SheetState = { kind: "add" } | { kind: "delete"; slip: Payslip } | null

/** Perubahan neto dengan tanda dan teks, bukan hanya warna (DS-COLOR-01). */
function Change({ bp }: { bp: number | null }) {
  if (bp === null) return <span className="row-sub">—</span>
  const sign = bp > 0 ? "+" : bp < 0 ? "−" : ""
  const pct = (Math.abs(bp) / 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })
  const tone = bp > 0 ? "text-inc" : bp < 0 ? "text-exp" : "row-sub"
  return (
    <span className={`payslip-change ${tone}`}>
      {sign}
      {pct}%
    </span>
  )
}

/** Slip Gaji (FR-140, PB-10): tren gaji bersih 12 bulan dan % perubahan. */
export function PayslipsPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const query = usePayslips(bookId)
  const save = useSavePayslip(bookId)
  const remove = useDeletePayslip(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const slips = query.data?.payslips ?? []
  const latest = slips.at(-1)
  const max = slips.reduce((m, s) => (BigInt(s.gross) > m ? BigInt(s.gross) : m), 0n)

  return (
    <>
      <TopBar
        level={2}
        title="Slip Gaji"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah slip" onClick={() => setSheet({ kind: "add" })} />}
      />

      {query.isPending ? <Skeleton rows={3} height={64} /> : null}
      {query.isError && !query.data ? (
        <ErrorState
          message="Slip gaji gagal dimuat."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}

      {latest ? (
        <section className="hero" aria-label="Slip terbaru">
          <p className="hero-label">Gaji bersih {formatMonth(latest.period)}</p>
          <p className="hero-value">
            <Money value={BigInt(latest.net)} />
          </p>
          <div className="hero-row">
            <span>
              Kotor <Money value={BigInt(latest.gross)} short /> · potongan{" "}
              <Money value={BigInt(latest.deductions)} short />
            </span>
            <span>
              vs bulan sebelumnya <Change bp={latest.changeBp} />
            </span>
          </div>
        </section>
      ) : null}

      {query.data && slips.length === 0 ? (
        <EmptyState
          icon="doc"
          title="Belum ada slip gaji"
          body="Unggah PDF slip gaji. Isinya dibaca di perangkat ini, hanya angkanya yang disimpan."
          actionLabel="Tambah slip"
          onAction={() => setSheet({ kind: "add" })}
        />
      ) : null}

      {slips.length > 0 ? (
        <section className="section" aria-labelledby="payslip-trend">
          <div className="section-head">
            <h2 id="payslip-trend" className="h2">
              Tren {slips.length} bulan
            </h2>
          </div>
          <ul className="card payslip-list">
            {[...slips].reverse().map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="payslip-row"
                  aria-label={`Hapus slip ${formatMonth(s.period)}`}
                  onClick={() => setSheet({ kind: "delete", slip: s })}
                >
                  <span className="payslip-row-head">
                    <span className="row-title">{formatMonth(s.period)}</span>
                    <Change bp={s.changeBp} />
                    <Money value={BigInt(s.net)} />
                  </span>
                  <span className="payslip-bar" aria-hidden="true">
                    <span
                      className="payslip-bar-net"
                      style={{ width: `${max > 0n ? Number((BigInt(s.net) * 1000n) / max) / 10 : 0}%` }}
                    />
                    <span
                      className="payslip-bar-ded"
                      style={{ width: `${max > 0n ? Number((BigInt(s.deductions) * 1000n) / max) / 10 : 0}%` }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="row-sub">Batang hijau: gaji bersih. Batang abu: potongan.</p>
        </section>
      ) : null}

      <Sheet open={sheet?.kind === "add"} title="Tambah slip gaji" onClose={close}>
        {sheet?.kind === "add" ? (
          <PayslipForm
            pending={save.isPending}
            onSubmit={(v, onError) =>
              save.mutate(v, {
                onSuccess: () => {
                  close()
                  showSnackbar(`Slip ${formatMonth(v.period)} disimpan`)
                },
                onError,
              })
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "delete"}
        title={sheet?.kind === "delete" ? `Hapus slip ${formatMonth(sheet.slip.period)}?` : ""}
        onClose={close}
        footer={
          sheet?.kind === "delete" ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(sheet.slip.id, {
                    onSuccess: () => {
                      close()
                      showSnackbar("Slip dihapus")
                    },
                    onError: (e) => {
                      close()
                      showSnackbar(e.message, { tone: "error" })
                    },
                  })
                }
              >
                Hapus
              </Button>
              <Button variant="ghost" full onClick={close}>
                Batal
              </Button>
            </>
          ) : null
        }
      >
        <p className="row-sub">Angka slip periode ini dihapus dari tren.</p>
      </Sheet>
    </>
  )
}
