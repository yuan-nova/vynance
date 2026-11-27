import { useNavigate } from "@tanstack/react-router"
import type { Goal } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { ProgressBar } from "@/components/ProgressBar"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  ContributeForm,
  GoalCard,
  GoalForm,
  useContribute,
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from "@/features/goals"
import { showSnackbar } from "@/lib/snackbar"

type SheetState =
  | { kind: "create" }
  | { kind: "edit"; goal: Goal }
  | { kind: "contribute"; goal: Goal }
  | { kind: "delete"; goal: Goal }
  | null

/** Target Tabungan (design/09-savings-goals.svg, FR-60, PB-07). */
export function GoalsPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const query = useGoals(bookId)
  const create = useCreateGoal(bookId)
  const update = useUpdateGoal(bookId)
  const remove = useDeleteGoal(bookId)
  const contribute = useContribute(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const data = query.data
  const collected = BigInt(data?.summary.collected ?? "0")
  const target = BigInt(data?.summary.target ?? "0")
  const pctBp = target > 0n ? Number((collected * 10_000n) / target) : 0

  return (
    <>
      <TopBar
        level={2}
        title="Target Tabungan"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah target" onClick={() => setSheet({ kind: "create" })} />}
      />

      {query.isPending ? <Skeleton rows={3} height={120} /> : null}
      {query.isError && !data ? (
        <ErrorState message="Target gagal dimuat." onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : null}

      {data && data.goals.length > 0 ? (
        <section className="hero" aria-label="Ringkasan target">
          <p className="hero-label">Total terkumpul</p>
          <p className="hero-value">
            <Money value={collected} />
          </p>
          <ProgressBar valueBp={Math.min(10_000, pctBp)} tone="inc" label="Progres semua target" />
          <div className="hero-row">
            <span>
              {Math.floor(pctBp / 100)}% dari <Money value={target} />
            </span>
            <span>{data.summary.count} target</span>
          </div>
        </section>
      ) : null}

      {data && data.goals.length === 0 ? (
        <EmptyState
          icon="target"
          title="Belum ada target tabungan"
          body="Buat target, misalnya dana darurat atau liburan, lalu catat setoran tiap bulan."
          actionLabel="Tambah target"
          onAction={() => setSheet({ kind: "create" })}
        />
      ) : null}

      {data && data.goals.length > 0 ? (
        <section className="section goal-list" aria-label="Daftar target">
          {data.goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onOpen={() => setSheet({ kind: "edit", goal: g })}
              onContribute={() => setSheet({ kind: "contribute", goal: g })}
            />
          ))}
        </section>
      ) : null}

      <Sheet open={sheet?.kind === "create"} title="Tambah target" onClose={close}>
        <GoalForm
          pending={create.isPending}
          onSubmit={(v, onError) =>
            create.mutate(v, {
              onSuccess: (g) => {
                close()
                showSnackbar(`Target ${g.name} ditambahkan`)
              },
              onError,
            })
          }
        />
      </Sheet>

      <Sheet open={sheet?.kind === "edit"} title="Ubah target" onClose={close}>
        {sheet?.kind === "edit" ? (
          <GoalForm
            key={sheet.goal.id}
            initial={sheet.goal}
            pending={update.isPending}
            onDelete={() => setSheet({ kind: "delete", goal: sheet.goal })}
            onSubmit={(v, onError) =>
              update.mutate(
                { id: sheet.goal.id, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Target disimpan")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "contribute"}
        title={sheet?.kind === "contribute" ? `Setor ke ${sheet.goal.name}` : ""}
        onClose={close}
      >
        {sheet?.kind === "contribute" ? (
          <ContributeForm
            key={sheet.goal.id}
            goal={sheet.goal}
            pending={contribute.isPending}
            onSubmit={(v, onError) =>
              contribute.mutate(
                { id: sheet.goal.id, input: v },
                {
                  onSuccess: (g) => {
                    close()
                    showSnackbar(g.status === "achieved" ? `Target ${g.name} tercapai!` : "Setoran dicatat")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "delete"}
        title={sheet?.kind === "delete" ? `Hapus target ${sheet.goal.name}?` : ""}
        onClose={close}
        footer={
          sheet?.kind === "delete" ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(sheet.goal.id, {
                    onSuccess: () => {
                      close()
                      showSnackbar("Target dihapus")
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
        <p className="row-sub">Riwayat setoran ikut terhapus dari daftar. Saldo rekening tidak berubah.</p>
      </Sheet>
    </>
  )
}
