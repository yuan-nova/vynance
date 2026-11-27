import { useNavigate } from "@tanstack/react-router"
import { INCOME_KIND_LABEL, type IncomeSource, updatePassiveTargetSchema } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { PercentForm } from "@/components/PercentForm"
import { ProgressBar } from "@/components/ProgressBar"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  IncomeForm,
  useCreateIncome,
  useDeleteIncome,
  useIncomes,
  useUpdateIncome,
  useUpdatePassiveTarget,
} from "@/features/incomes"
import { showSnackbar } from "@/lib/snackbar"

type SheetState =
  | { kind: "create" }
  | { kind: "edit"; source: IncomeSource }
  | { kind: "delete"; source: IncomeSource }
  | { kind: "target" }
  | null

const pct = (bp: number) => `${Math.floor(bp / 100)}%`

/** Sumber Penghasilan (FR-130, PB-10): daftar aktif/pasif dan porsi pasif terhadap target. */
export function IncomesPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const query = useIncomes(bookId)
  const create = useCreateIncome(bookId)
  const update = useUpdateIncome(bookId)
  const remove = useDeleteIncome(bookId)
  const target = useUpdatePassiveTarget(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const data = query.data
  const s = data?.summary

  return (
    <>
      <TopBar
        level={2}
        title="Sumber Penghasilan"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah sumber" onClick={() => setSheet({ kind: "create" })} />}
      />

      {query.isPending ? <Skeleton rows={3} height={64} /> : null}
      {query.isError && !data ? (
        <ErrorState
          message="Penghasilan gagal dimuat."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}

      {data && s && data.sources.length > 0 ? (
        <section className="hero" aria-label="Porsi penghasilan pasif">
          <p className="hero-label">Total per bulan</p>
          <p className="hero-value">
            <Money value={BigInt(s.total)} />
          </p>
          <ProgressBar
            valueBp={Math.min(10_000, s.targetBp > 0 ? Math.floor((s.passiveBp * 10_000) / s.targetBp) : 10_000)}
            tone={s.metTarget ? "inc" : "warn"}
            label="Porsi pasif terhadap target"
          />
          <div className="hero-row">
            <span>
              Pasif {pct(s.passiveBp)} · {s.metTarget ? "target tercapai" : "di bawah target"}
            </span>
            <button type="button" className="hero-link" onClick={() => setSheet({ kind: "target" })}>
              Target {pct(s.targetBp)}
            </button>
          </div>
        </section>
      ) : null}

      {data && data.sources.length === 0 ? (
        <EmptyState
          icon="brief"
          title="Belum ada sumber penghasilan"
          body="Catat gaji dan penghasilan pasif seperti sewa atau dividen untuk melihat porsinya."
          actionLabel="Tambah sumber"
          onAction={() => setSheet({ kind: "create" })}
        />
      ) : null}

      {data && s && data.sources.length > 0 ? (
        <>
          {(["active", "passive"] as const).map((k) => {
            const rows = data.sources.filter((x) => x.kind === k)
            return (
              <section key={k} className="section" aria-label={`Penghasilan ${INCOME_KIND_LABEL[k].toLowerCase()}`}>
                <div className="section-head">
                  <h2 className="h2">{INCOME_KIND_LABEL[k]}</h2>
                  <Money value={BigInt(k === "active" ? s.active : s.passive)} />
                </div>
                {rows.length === 0 ? (
                  <p className="row-sub">Belum ada.</p>
                ) : (
                  <div className="card plain-list">
                    {rows.map((x) => (
                      <ListRow
                        key={x.id}
                        icon={k === "active" ? "brief" : "coins"}
                        tone={k === "active" ? "pri" : "inc"}
                        title={x.name}
                        subtitle={x.isRecurring ? "Rutin tiap bulan" : "Tidak tetap"}
                        trailing={<Money value={BigInt(x.monthlyAmount)} />}
                        ariaLabel={`Ubah ${x.name}`}
                        onClick={() => setSheet({ kind: "edit", source: x })}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </>
      ) : null}

      <Sheet open={sheet?.kind === "create"} title="Tambah sumber" onClose={close}>
        <IncomeForm
          pending={create.isPending}
          onSubmit={(v, onError) =>
            create.mutate(v, {
              onSuccess: () => {
                close()
                showSnackbar(`${v.name} ditambahkan`)
              },
              onError,
            })
          }
        />
      </Sheet>

      <Sheet open={sheet?.kind === "edit"} title="Ubah sumber" onClose={close}>
        {sheet?.kind === "edit" ? (
          <IncomeForm
            key={sheet.source.id}
            initial={sheet.source}
            pending={update.isPending}
            onDelete={() => setSheet({ kind: "delete", source: sheet.source })}
            onSubmit={(v, onError) =>
              update.mutate(
                { id: sheet.source.id, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Sumber disimpan")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet open={sheet?.kind === "target"} title="Target penghasilan pasif" onClose={close}>
        {sheet?.kind === "target" && s ? (
          <PercentForm
            label="Target porsi pasif (%)"
            hint="Bawaan 30% dari total penghasilan."
            schema={updatePassiveTargetSchema.shape.targetBp}
            initialBp={s.targetBp}
            pending={target.isPending}
            onSubmit={(bp, onError) =>
              target.mutate(bp, {
                onSuccess: () => {
                  close()
                  showSnackbar("Target disimpan")
                },
                onError,
              })
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "delete"}
        title={sheet?.kind === "delete" ? `Hapus ${sheet.source.name}?` : ""}
        onClose={close}
        footer={
          sheet?.kind === "delete" ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(sheet.source.id, {
                    onSuccess: () => {
                      close()
                      showSnackbar("Sumber dihapus")
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
        <p className="row-sub">Transaksi pemasukan yang sudah dicatat tidak ikut terhapus.</p>
      </Sheet>
    </>
  )
}
