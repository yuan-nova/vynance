import { demoToImport } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { useCategories } from "@/features/categories"
import { useImportTransactions } from "@/features/transactions"
import { useWallets } from "@/features/wallets"
import { showSnackbar } from "@/lib/snackbar"
import { demoActions, useDemoTransactions } from "../hooks/useDemo"

type ImportDemoCardProps = { bookId: string; bookName: string }

/**
 * Tawaran impor data mode demo setelah daftar (PB-01 langkah 4, FR-151).
 * Transaksi masuk ke rekening tunai buku aktif; impor ulang aman karena tiap transaksi punya kunci tetap.
 */
export function ImportDemoCard({ bookId, bookName }: ImportDemoCardProps) {
  const rows = useDemoTransactions()
  const wallets = useWallets(bookId)
  const expense = useCategories(bookId, "expense")
  const income = useCategories(bookId, "income")
  const run = useImportTransactions(bookId)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  if (rows.length === 0) return null

  const list = wallets.data?.wallets.filter((w) => !w.archivedAt) ?? []
  const wallet = list.find((w) => w.type === "cash") ?? list[0]
  const ready = Boolean(wallet && expense.data && income.data)

  const start = () => {
    if (!wallet || !expense.data || !income.data) return
    const { items, skipped } = demoToImport(rows, {
      walletId: wallet.id,
      categories: [...expense.data, ...income.data].filter((c) => !c.archivedAt),
    })
    run.mutate(items, {
      onSuccess: (n) => {
        // Hanya yang benar-benar diimpor yang dihapus dari perangkat.
        for (const it of items) demoActions.remove(it.demoId)
        showSnackbar(
          skipped.length > 0
            ? `${n} diimpor. ${skipped.length} dilewati karena buku ${bookName} belum punya kategori yang sesuai.`
            : `${n} transaksi demo diimpor ke ${bookName}`,
          skipped.length > 0 ? { tone: "error" } : undefined,
        )
      },
      onError: (e) =>
        showSnackbar(`Impor terhenti: ${e.message}. Coba lagi, data yang sudah masuk tidak akan ganda.`, {
          tone: "error",
        }),
    })
  }

  return (
    <section className="card demo-import" aria-label="Impor data demo">
      <p className="row-title">Ada {rows.length} transaksi dari mode demo</p>
      <p className="row-sub">
        Impor ke buku {bookName}
        {wallet ? ` (rekening ${wallet.name})` : ""}? Setelah diimpor, data demo di perangkat ini dihapus.
      </p>
      <div className="demo-import-actions">
        <Button full loading={run.isPending} disabled={!ready} onClick={start}>
          Impor
        </Button>
        {confirmDiscard ? (
          <Button variant="destructive" full onClick={() => demoActions.clear()}>
            Ya, buang data demo
          </Button>
        ) : (
          <Button variant="ghost" full onClick={() => setConfirmDiscard(true)}>
            Buang
          </Button>
        )}
      </div>
    </section>
  )
}
