import { formatDateShort, formatMonth, type PlannedItem } from "@vynance/shared"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"

type PlannedSectionProps = {
  items: PlannedItem[]
  /** Bulan berjalan; rencana bulan sebelumnya yang belum direalisasi ditandai Terlewat (PB-13 langkah 6). */
  currentMonth: string
  onOpen: (item: PlannedItem) => void
}

/** Bagian Rencana di atas riwayat (PB-14). Yang sudah direalisasi tampil sebagai transaksi biasa. */
export function PlannedSection({ items, currentMonth, onOpen }: PlannedSectionProps) {
  const shown = items.filter((i) => i.status !== "realized")
  if (shown.length === 0) return null
  return (
    <section className="section" aria-labelledby="planned-head">
      <div className="section-head">
        <h2 id="planned-head" className="h2">
          Rencana
        </h2>
      </div>
      <div className="card plain-list">
        {shown.map((i) => {
          const overdue = i.status === "pending" && i.period < currentMonth
          const income = i.sourceType === "income"
          return (
            <ListRow
              key={`${i.period}:${i.sourceType}:${i.sourceId}`}
              icon={income ? "trend" : "repeat"}
              tone={i.status === "skipped" ? "neutral" : income ? "inc" : "exp"}
              title={i.name}
              subtitle={
                i.status === "skipped"
                  ? `Dilewati · ${formatMonth(i.period)}`
                  : overdue
                    ? `Terlewat · ${formatMonth(i.period)}`
                    : `${income ? "Penghasilan" : "Langganan"} · ${formatDateShort(i.dueDate)}`
              }
              badge={
                i.status === "skipped" ? (
                  <Pill tone="neutral">Dilewati</Pill>
                ) : (
                  <Pill tone={overdue ? "warn" : "pri"}>{overdue ? "Terlewat" : "Rencana"}</Pill>
                )
              }
              trailing={<Money value={BigInt(i.amount)} sign={income ? "income" : "expense"} />}
              ariaLabel={`Realisasi ${i.name}`}
              onClick={() => onOpen(i)}
            />
          )
        })}
      </div>
    </section>
  )
}
