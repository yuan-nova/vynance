import type { DateOnly, Month } from "../date/date"
import type { PlannedItem, PlannedSource } from "../schemas/planned"
import type { SubscriptionCycle } from "./subscription"
import { billingDate, isBilledInMonth } from "./subscription"

export type PlannedIncomeSource = {
  id: string
  name: string
  monthlyAmount: bigint
  categoryId: string | null
  /** Bulan sumber dibuat; rencana tidak muncul untuk bulan sebelumnya. */
  createdMonth: Month
}

export type PlannedSubscription = {
  id: string
  name: string
  amountIdr: bigint
  cycle: SubscriptionCycle
  billingDay: number
  billingMonth: number | null
  startDate: DateOnly
  walletId: string
  categoryId: string | null
}

export type PlannedRecord = {
  sourceType: PlannedSource
  sourceId: string
  status: "realized" | "skipped"
  transactionId: string | null
  /** false bila transaksi hasil realisasi sudah dihapus → rencana kembali belum direalisasi (PB-13 langkah 5). */
  transactionAlive: boolean
}

/**
 * Rencana transaksi satu bulan (PB-13, BR-60). Penghasilan rutin jatuh tanggal 1; langganan pada tanggal
 * tagihannya bila ditagih bulan itu dan sudah mulai. Status dari catatan realisasi/lewati.
 */
export function plannedItemsFor(
  month: Month,
  src: { incomes: PlannedIncomeSource[]; subscriptions: PlannedSubscription[] },
  records: PlannedRecord[],
): PlannedItem[] {
  const byKey = new Map(records.map((r) => [`${r.sourceType}:${r.sourceId}`, r]))
  const statusOf = (type: PlannedSource, id: string): Pick<PlannedItem, "status" | "transactionId"> => {
    const r = byKey.get(`${type}:${id}`)
    if (!r) return { status: "pending", transactionId: null }
    if (r.status === "skipped") return { status: "skipped", transactionId: null }
    return r.transactionAlive
      ? { status: "realized", transactionId: r.transactionId }
      : { status: "pending", transactionId: null }
  }
  const items: PlannedItem[] = []
  for (const s of src.incomes) {
    if (s.createdMonth > month) continue
    items.push({
      sourceType: "income",
      sourceId: s.id,
      period: month,
      name: s.name,
      amount: s.monthlyAmount.toString(),
      dueDate: `${month}-01`,
      walletId: null,
      categoryId: s.categoryId,
      ...statusOf("income", s.id),
    })
  }
  for (const s of src.subscriptions) {
    if (!isBilledInMonth(s, month)) continue
    const due = billingDate(month, s.billingDay)
    if (due < s.startDate) continue
    items.push({
      sourceType: "subscription",
      sourceId: s.id,
      period: month,
      name: s.name,
      amount: s.amountIdr.toString(),
      dueDate: due,
      walletId: s.walletId,
      categoryId: s.categoryId,
      ...statusOf("subscription", s.id),
    })
  }
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name))
}

/** Idempotency-Key realisasi: sama untuk percobaan yang sama, beda setelah realisasi sebelumnya dihapus. */
export function plannedIdempotencyKey(type: PlannedSource, sourceId: string, period: Month, attempt: number): string {
  return `plan-${type === "income" ? "i" : "s"}-${sourceId}-${period}-${attempt}`
}
