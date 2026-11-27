import { EmptyState } from "@/components/States"
import { TopBar } from "@/components/TopBar"

export function TransactionsPage() {
  return (
    <>
      <TopBar level={1} title="Transaksi" />
      <EmptyState icon="list" title="Belum ada transaksi" body="Transaksi yang kamu catat tampil di sini." />
    </>
  )
}
