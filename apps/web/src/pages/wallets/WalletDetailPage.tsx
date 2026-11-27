import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { dateOnlyOf, heroNeedsShort, isDebtWallet, WALLET_TYPE_LABEL } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { ProgressBar } from "@/components/ProgressBar"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { TransactionList, useTransactionList } from "@/features/transactions"
import { useArchiveWallet, useDeleteWallet, useUpdateWallet, useWallets, WalletForm } from "@/features/wallets"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/_tabs/lainnya/rekening_/$id")

/**
 * Detail rekening (FR-11): saldo, pemakaian limit untuk utang (BR-05), riwayat transaksi rekening ini.
 * Saldo diambil dari daftar rekening yang sama dengan layar Rekening, jadi angkanya selalu sama (BR-01).
 */
export function WalletDetailPage() {
  const navigate = useNavigate()
  const { id } = route.useParams()
  const bookId = useActiveBook()?.id ?? ""
  const wallets = useWallets(bookId)
  const wallet = wallets.data?.wallets.find((w) => w.id === id)
  const list = useTransactionList(bookId, { walletId: id })
  const update = useUpdateWallet(bookId)
  const remove = useDeleteWallet(bookId)
  const archive = useArchiveWallet(bookId)
  const [sheet, setSheet] = useState<"edit" | "delete" | null>(null)
  const close = () => setSheet(null)
  const back = () => void navigate({ to: "/lainnya/rekening" })
  const items = list.data?.pages.flatMap((p) => p.data) ?? []
  // BR-35: rekening yang sudah dipakai ditawarkan arsip, bukan hapus.
  const used = items.length > 0
  const today = dateOnlyOf(new Date())

  if (wallets.isSuccess && !wallet) {
    return (
      <>
        <TopBar level={2} title="Rekening" backLabel="Kembali ke Rekening" onBack={back} />
        <EmptyState icon="bank" title="Rekening tidak ditemukan" body="Rekening ini mungkin sudah dihapus." />
      </>
    )
  }

  const balance = wallet ? BigInt(wallet.balance) : 0n
  const debt = wallet ? isDebtWallet(wallet.type) : false

  return (
    <>
      <TopBar
        level={2}
        title={wallet?.name ?? "Rekening"}
        backLabel="Kembali ke Rekening"
        onBack={back}
        action={wallet ? <IconButton icon="edit" label="Ubah rekening" onClick={() => setSheet("edit")} /> : undefined}
      />
      {wallets.isPending ? <Skeleton rows={1} height={140} /> : null}
      {wallets.isError && !wallet ? (
        <ErrorState
          message="Rekening gagal dimuat."
          onRetry={() => void wallets.refetch()}
          retrying={wallets.isFetching}
        />
      ) : null}

      {wallet ? (
        <section className="hero" aria-label={`Saldo ${wallet.name}`}>
          <p className="hero-label">
            {WALLET_TYPE_LABEL[wallet.type]}
            {wallet.archivedAt ? " · diarsipkan" : ""}
          </p>
          <p className="hero-value">
            <Money value={balance} short={heroNeedsShort(balance)} />
          </p>
          {debt && wallet.creditLimit !== null && wallet.limitUsageBp !== null ? (
            <>
              <ProgressBar
                valueBp={wallet.limitUsageBp}
                tone={wallet.limitUsageBp >= 9000 ? "exp" : wallet.limitUsageBp >= 7000 ? "warn" : "inc"}
                label={`Pemakaian limit ${wallet.name}`}
              />
              <div className="hero-row">
                <span>Terpakai {Math.floor(wallet.limitUsageBp / 100)}%</span>
                <span>
                  Limit <Money value={BigInt(wallet.creditLimit)} />
                </span>
              </div>
            </>
          ) : (
            <div className="hero-row">
              <span>
                Saldo awal <Money value={BigInt(wallet.openingBalance)} />
              </span>
            </div>
          )}
        </section>
      ) : null}

      {wallet?.archivedAt ? (
        <section className="card archived-note" aria-label="Rekening diarsipkan">
          <p className="body">
            Rekening ini diarsipkan: tidak muncul di pilihan transaksi baru, tetapi saldo dan riwayatnya tetap dihitung.
          </p>
          <Button
            variant="soft"
            full
            loading={archive.isPending}
            onClick={() =>
              archive.mutate(
                { id: wallet.id, archived: false },
                {
                  onSuccess: () => showSnackbar("Rekening aktif lagi"),
                  onError: (e) => showSnackbar(e.message, { tone: "error" }),
                },
              )
            }
          >
            Aktifkan lagi
          </Button>
        </section>
      ) : null}

      <section className="section" aria-labelledby="wallet-history">
        <h2 id="wallet-history" className="h2">
          Riwayat transaksi
        </h2>
        {list.isPending ? <Skeleton rows={5} /> : null}
        {list.isError && items.length === 0 ? (
          <ErrorState message="Riwayat gagal dimuat." onRetry={() => void list.refetch()} retrying={list.isFetching} />
        ) : null}
        {list.isSuccess && items.length === 0 ? (
          <EmptyState
            icon="list"
            title="Belum ada transaksi"
            body="Transaksi dari dan ke rekening ini tampil di sini."
          />
        ) : null}
        {items.length > 0 ? (
          <TransactionList
            items={items}
            today={today}
            hasMore={Boolean(list.hasNextPage)}
            loadingMore={list.isFetchingNextPage}
            loadMoreFailed={list.isFetchNextPageError}
            onLoadMore={() => void list.fetchNextPage()}
            onOpen={(tx) => void navigate({ to: "/transaksi/$id", params: { id: tx.id } })}
          />
        ) : null}
      </section>

      <Sheet open={sheet === "edit"} title="Ubah rekening" onClose={close}>
        {wallet && sheet === "edit" ? (
          <WalletForm
            key={wallet.id}
            initial={wallet}
            submitLabel="Simpan"
            pending={update.isPending}
            onDelete={() => setSheet("delete")}
            onSubmit={(v, onError) =>
              update.mutate(
                { id: wallet.id, input: v },
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
        open={sheet === "delete"}
        title={wallet ? (used ? `Arsipkan ${wallet.name}?` : `Hapus rekening ${wallet.name}?`) : ""}
        onClose={close}
        footer={
          wallet && used ? (
            <>
              {wallet.archivedAt ? null : (
                <Button
                  full
                  loading={archive.isPending}
                  onClick={() =>
                    archive.mutate(
                      { id: wallet.id, archived: true },
                      {
                        onSuccess: () => {
                          close()
                          showSnackbar("Rekening diarsipkan")
                        },
                        onError: (e) => {
                          close()
                          showSnackbar(e.message, { tone: "error" })
                        },
                      },
                    )
                  }
                >
                  Arsipkan
                </Button>
              )}
              <Button variant="ghost" full onClick={close}>
                Batal
              </Button>
            </>
          ) : wallet ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(wallet.id, {
                    onSuccess: () => {
                      showSnackbar("Rekening dihapus")
                      back()
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
        {used ? (
          <p className="body">
            Rekening ini sudah punya transaksi, jadi tidak bisa dihapus tanpa mengubah saldo total. Arsipkan saja:
            rekening disembunyikan dari pilihan transaksi baru, tetapi saldo dan riwayatnya tetap ada.
          </p>
        ) : (
          <p className="body">Rekening ini belum punya transaksi dan akan dihapus.</p>
        )}
      </Sheet>
    </>
  )
}
