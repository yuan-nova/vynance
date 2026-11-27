import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { formatDateLong, formatTime, TX_TYPE_ICON, TX_TYPE_LABEL, TX_TYPE_TONE, txSign } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"
import { Sheet } from "@/components/Sheet"
import { ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  AddTransactionForm,
  useDeleteTransaction,
  useRestoreTransaction,
  useTransaction,
} from "@/features/transactions"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/_tabs/transaksi_/$id")

/** Detail transaksi (layar penuh, DS-SHEET-01): Ubah di sheet, Hapus langsung + Urungkan 6 detik (DS-ACTION-03). */
export function TransactionDetailPage() {
  const navigate = useNavigate()
  const { id } = route.useParams()
  const bookId = useActiveBook()?.id ?? ""
  const tx = useTransaction(bookId, id)
  const remove = useDeleteTransaction(bookId)
  const restore = useRestoreTransaction(bookId)
  const [editing, setEditing] = useState(false)
  // Kembali ke induk informasi, bukan riwayat browser (DS-NAV-02).
  const back = () => void navigate({ to: "/transaksi" })

  const del = () =>
    remove.mutate(id, {
      onSuccess: () => {
        back()
        showSnackbar("Transaksi dihapus", {
          undo: () =>
            restore.mutate(id, {
              onSuccess: () => showSnackbar("Transaksi dikembalikan"),
              onError: (e) => showSnackbar(e.message, { tone: "error" }),
            }),
        })
      },
      onError: (e) => showSnackbar(e.message, { tone: "error" }),
    })

  const d = tx.data
  return (
    <>
      <TopBar level={2} title="Detail transaksi" backLabel="Kembali ke Transaksi" onBack={back} />
      {tx.isPending ? <Skeleton rows={4} /> : null}
      {tx.isError ? (
        <ErrorState message="Transaksi tidak ditemukan atau gagal dimuat." onRetry={() => void tx.refetch()} />
      ) : null}
      {d ? (
        <>
          <section className={`card detail-hero`}>
            <span className={`tile tile-${TX_TYPE_TONE[d.type]}`}>
              <Icon name={TX_TYPE_ICON[d.type]} />
            </span>
            <p className="row-sub">{TX_TYPE_LABEL[d.type]}</p>
            <p className="hero-value">
              <Money value={BigInt(d.amount)} sign={txSign(d.type)} />
            </p>
            {d.note ? <p className="body">{d.note}</p> : null}
          </section>
          <dl className="card detail-list">
            <div>
              <dt>Tanggal</dt>
              <dd>{formatDateLong(d.txDate)}</dd>
            </div>
            {d.type === "transfer" ? (
              <>
                <div>
                  <dt>Dari rekening</dt>
                  <dd>{d.walletName}</dd>
                </div>
                <div>
                  <dt>Ke rekening</dt>
                  <dd>{d.toWalletName ?? "(dihapus)"}</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt>Kategori</dt>
                  <dd>{d.categoryName ?? "(dihapus)"}</dd>
                </div>
                <div>
                  <dt>Rekening</dt>
                  <dd>{d.walletName}</dd>
                </div>
              </>
            )}
            <div>
              <dt>Sumber</dt>
              <dd>
                {d.source === "manual" ? (
                  "Dicatat manual"
                ) : d.source === "scan" ? (
                  <Pill tone="neutral">Scan</Pill>
                ) : (
                  <Pill tone="auto">Otomatis</Pill>
                )}
              </dd>
            </div>
            <div>
              <dt>Dicatat oleh</dt>
              <dd>
                {d.createdByName || "Anggota"} · {formatTime(new Date(d.createdAt))}
              </dd>
            </div>
            {d.updatedByName !== null ? (
              <div>
                <dt>Diubah oleh</dt>
                <dd>
                  {d.updatedByName || "Anggota"} · {formatDateLong(d.updatedAt.slice(0, 10))}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="stack section">
            <Button variant="soft" full icon="edit" onClick={() => setEditing(true)}>
              Ubah
            </Button>
            <Button variant="ghost" full icon="trash" loading={remove.isPending} onClick={del}>
              Hapus transaksi
            </Button>
          </div>
          <Sheet open={editing} title="Ubah transaksi" onClose={() => setEditing(false)}>
            {editing ? (
              <AddTransactionForm
                bookId={bookId}
                initial={d}
                onSaved={() => {
                  setEditing(false)
                  showSnackbar("Transaksi disimpan")
                }}
              />
            ) : null}
          </Sheet>
        </>
      ) : null}
    </>
  )
}
