import { EmptyState } from "@/components/States"
import { TopBar } from "@/components/TopBar"

export function BudgetPage() {
  return (
    <>
      <TopBar level={1} title="Anggaran" />
      <EmptyState icon="pie" title="Belum ada rencana bulan ini" body="Atur penghasilan dan anggaran per kategori." />
    </>
  )
}
