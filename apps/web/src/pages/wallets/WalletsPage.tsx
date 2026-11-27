import { useNavigate } from "@tanstack/react-router"
import { heroNeedsShort, isDebtWallet, type Wallet } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  useCreateWallet,
  useDeleteWallet,
  useUpdateWallet,
  useWallets,
  WalletForm,
  WalletRow,
} from "@/features/wallets"
import { showSnackbar } from "@/lib/snackbar"

type SheetState = { kind: "create" } | { kind: "edit"; wallet: Wallet } | { kind: "delete"; wallet: Wallet } | null

/** Layar Rekening (design/06-wallets.svg, FR-10): total kas, rekening per kelompok, utang + pemakaian limit. */
export function WalletsPage() {
  const navigate = useNavigate()
  const book = useActiveBook()
  const bookId = book?.id ?? ""
  const query = useWallets(bookId)
  const create = useCreateWallet(bookId)
  const update = useUpdateWallet(bookId)
  const remove = useDeleteWallet(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)

  const data = query.data
  const active = (data?.wallets ?? []).filter((w) => w.archivedAt === null)
  const cash = active.filter((w) => !isDebtWallet(w.type))
  const debts = active.filter((w) => isDebtWallet(w.type))

  return (
    <>
      <TopBar
        level={2}
        title="Rekening"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah rekening" onClick={() => setSheet({ kind: "create" })} />}
      />

      {query.isPending ? <Skeleton rows={4} /> : null}
      {query.isError && !data ? (
        <ErrorState message="Rekening gagal dimuat." onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : null}

      {data ? (
        <section className="hero" aria-label="Ringkasan rekening">
          <p className="hero-label">Total kas</p>
          <p className="hero-value">
            <Money value={BigInt(data.summary.cash)} short={heroNeedsShort(BigInt(data.summary.cash))} />
          </p>
          <div className="hero-row">
            <span>
              Total utang <Money value={BigInt(data.summary.debt)} />
            </span>
            <span>
              {data.summary.walletCount} rekening · {data.summary.debtCount} utang
            </span>
          </div>
        </section>
      ) : null}

      {data && active.length === 0 ? (
        <EmptyState
          icon="bank"
          title="Belum ada rekening"
          body="Tambahkan rekening bank, e-wallet, tunai, atau kartu kredit."
          actionLabel="Tambah rekening"
          onAction={() => setSheet({ kind: "create" })}
        />
      ) : null}

      {cash.length > 0 ? (
        <section className="section" aria-labelledby="w-cash">
          <h2 id="w-cash" className="h2">
            Uang &amp; tabungan
          </h2>
          <div className="card plain-list">
            {cash.map((w) => (
              <WalletRow key={w.id} wallet={w} onOpen={() => setSheet({ kind: "edit", wallet: w })} />
            ))}
          </div>
        </section>
      ) : null}

      {debts.length > 0 ? (
        <section className="section" aria-labelledby="w-debt">
          <h2 id="w-debt" className="h2">
            Utang
          </h2>
          <div className="card plain-list">
            {debts.map((w) => (
              <WalletRow key={w.id} wallet={w} onOpen={() => setSheet({ kind: "edit", wallet: w })} />
            ))}
          </div>
        </section>
      ) : null}

      <Sheet open={sheet?.kind === "create"} title="Tambah rekening" onClose={close}>
        <WalletForm
          submitLabel="Simpan"
          pending={create.isPending}
          onSubmit={(v, onError) =>
            create.mutate(v, {
              onSuccess: (w) => {
                close()
                showSnackbar(`Rekening ${w.name} ditambahkan`)
              },
              onError,
            })
          }
        />
      </Sheet>

      <Sheet open={sheet?.kind === "edit"} title="Ubah rekening" onClose={close}>
        {sheet?.kind === "edit" ? (
          <WalletForm
            key={sheet.wallet.id}
            initial={sheet.wallet}
            submitLabel="Simpan"
            pending={update.isPending}
            onDelete={() => setSheet({ kind: "delete", wallet: sheet.wallet })}
            onSubmit={(v, onError) =>
              update.mutate(
                { id: sheet.wallet.id, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Rekening disimpan")
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
        title={sheet?.kind === "delete" ? `Hapus rekening ${sheet.wallet.name}?` : ""}
        onClose={close}
        footer={
          sheet?.kind === "delete" ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(sheet.wallet.id, {
                    onSuccess: () => {
                      close()
                      showSnackbar("Rekening dihapus")
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
        <p className="body">
          Rekening hanya bisa dihapus bila belum punya transaksi. Rekening yang sudah dipakai bisa diarsipkan.
        </p>
      </Sheet>
    </>
  )
}
