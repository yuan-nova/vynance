import { useNavigate } from "@tanstack/react-router"
import { type ChildPlan, updateEducationSettingsSchema } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TextField } from "@/components/TextField"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  ChildCard,
  ChildForm,
  useCreateChild,
  useDeleteChild,
  useEducationPlan,
  useUpdateChild,
  useUpdateInflation,
} from "@/features/education"
import { showSnackbar } from "@/lib/snackbar"

type SheetState =
  | { kind: "create" }
  | { kind: "edit"; child: ChildPlan }
  | { kind: "delete"; child: ChildPlan }
  | { kind: "inflation" }
  | null

/** Dana Pendidikan (design/16-education-fund.svg, FR-120, PB-09, BR-43). */
export function EducationPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const query = useEducationPlan(bookId)
  const create = useCreateChild(bookId)
  const update = useUpdateChild(bookId)
  const remove = useDeleteChild(bookId)
  const inflation = useUpdateInflation(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const data = query.data
  const year = new Date().getFullYear()

  return (
    <>
      <TopBar
        level={2}
        title="Dana Pendidikan"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah anak" onClick={() => setSheet({ kind: "create" })} />}
      />

      {query.isPending ? <Skeleton rows={3} height={120} /> : null}
      {query.isError && !data ? (
        <ErrorState
          message="Rencana pendidikan gagal dimuat."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}

      {data && data.children.length > 0 ? (
        <section className="hero" aria-label="Ringkasan dana pendidikan">
          <p className="hero-label">Total setoran per bulan</p>
          <p className="hero-value">
            <Money value={BigInt(data.monthly)} />
          </p>
          <div className="hero-row">
            <span>{data.children.length} anak</span>
            <button type="button" className="hero-link" onClick={() => setSheet({ kind: "inflation" })}>
              Inflasi {data.inflationBp / 100}%/tahun
            </button>
          </div>
        </section>
      ) : null}

      {data && data.children.length === 0 ? (
        <EmptyState
          icon="school"
          title="Belum ada data anak"
          body="Tambahkan anak untuk melihat perkiraan biaya TK sampai kuliah dan setoran per bulannya."
          actionLabel="Tambah anak"
          onAction={() => setSheet({ kind: "create" })}
        />
      ) : null}

      {data && data.children.length > 0 ? (
        <section className="section goal-list" aria-label="Daftar anak">
          {data.children.map((c) => (
            <ChildCard key={c.id} child={c} year={year} onOpen={() => setSheet({ kind: "edit", child: c })} />
          ))}
          <p className="row-sub">
            Biaya dasar hari ini: TK Rp5 jt, SD Rp15 jt, SMP Rp25 jt, SMA Rp35 jt, Kuliah Rp150 jt. Tahun ajaran
            dianggap mulai Juli.
          </p>
        </section>
      ) : null}

      <Sheet open={sheet?.kind === "create"} title="Tambah anak" onClose={close}>
        <ChildForm
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

      <Sheet open={sheet?.kind === "edit"} title="Ubah data anak" onClose={close}>
        {sheet?.kind === "edit" ? (
          <ChildForm
            key={sheet.child.id}
            initial={sheet.child}
            pending={update.isPending}
            onDelete={() => setSheet({ kind: "delete", child: sheet.child })}
            onSubmit={(v, onError) =>
              update.mutate(
                { id: sheet.child.id, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Data anak disimpan")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet open={sheet?.kind === "inflation"} title="Inflasi pendidikan" onClose={close}>
        {sheet?.kind === "inflation" && data ? (
          <InflationForm
            initialBp={data.inflationBp}
            pending={inflation.isPending}
            onSubmit={(bp, onError) =>
              inflation.mutate(bp, {
                onSuccess: () => {
                  close()
                  showSnackbar("Inflasi disimpan")
                },
                onError,
              })
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "delete"}
        title={sheet?.kind === "delete" ? `Hapus ${sheet.child.name}?` : ""}
        onClose={close}
        footer={
          sheet?.kind === "delete" ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(sheet.child.id, {
                    onSuccess: () => {
                      close()
                      showSnackbar("Data anak dihapus")
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
        <p className="row-sub">Rencana pendidikan anak ini ikut terhapus. Saldo rekening tidak berubah.</p>
      </Sheet>
    </>
  )
}

type InflationFormProps = {
  initialBp: number
  pending: boolean
  onSubmit: (bp: number, onError: (err: unknown) => void) => void
}

/** Inflasi pendidikan per tahun dalam persen, bawaan 12% (BR-43). */
function InflationForm({ initialBp, pending, onSubmit }: InflationFormProps) {
  const [value, setValue] = useState(String(initialBp / 100).replace(".", ","))
  const [error, setError] = useState<string>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const pct = Number(value.replace(",", "."))
    const parsed = updateEducationSettingsSchema.safeParse({ inflationBp: Math.round(pct * 100) })
    if (value.trim() === "" || Number.isNaN(pct) || !parsed.success) {
      setError(parsed.success ? "Isi angka persen, misalnya 12" : parsed.error.issues[0]?.message)
      return
    }
    setError(undefined)
    onSubmit(parsed.data.inflationBp, (err) => setError(err instanceof Error ? err.message : "Gagal menyimpan"))
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Inflasi per tahun (%)"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
        hint="Bawaan 12%. Berlaku untuk semua anak di buku ini."
        autoFocus
      />
      <Button type="submit" full loading={pending}>
        Simpan
      </Button>
    </form>
  )
}
