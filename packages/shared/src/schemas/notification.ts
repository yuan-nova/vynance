import { z } from "zod"
import { formatMonth } from "../date"

// Notifikasi anggaran (PB-12 langkah 6, BR-11). Tanpa nominal supaya aman untuk mode privasi dan layar kunci.

export const BUDGET_ALERT_THRESHOLDS = [9000, 10_000] as const

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.string(),
  data: z.record(z.string(), z.string()),
  readAt: z.string().nullable(),
  createdAt: z.string(),
})
export type AppNotification = z.infer<typeof notificationSchema>

export const notificationListSchema = z.object({ items: z.array(notificationSchema), unread: z.number().int() })
export type NotificationList = z.infer<typeof notificationListSchema>

export const bookSettingsSchema = z.object({ budgetAlertEnabled: z.boolean() })
export type BookSettings = z.infer<typeof bookSettingsSchema>
export const updateBookSettingsSchema = z.object({ budgetAlertEnabled: z.boolean() }).strict()

/** BR-11: ambang yang sudah tercapai (≥ 90%, ≥ 100%). Alokasi 0 → tidak ada peringatan. */
export function reachedThresholds(allocated: bigint, spent: bigint): number[] {
  if (allocated <= 0n) return []
  const bp = Number((spent * 10_000n) / allocated)
  return BUDGET_ALERT_THRESHOLDS.filter((t) => bp >= t)
}

/** Judul + isi notifikasi tanpa nominal (aman untuk mode privasi). */
export function notificationText(n: Pick<AppNotification, "kind" | "data">): { title: string; body: string } {
  if (n.kind === "budget_alert") {
    const month = n.data.month ? formatMonth(n.data.month) : "bulan ini"
    const over = n.data.threshold === "10000"
    return {
      title: over ? `Anggaran ${n.data.category} terlampaui` : `Anggaran ${n.data.category} hampir habis`,
      body: over
        ? `Pengeluaran ${n.data.category} sudah melewati anggaran ${month}.`
        : `Pengeluaran ${n.data.category} sudah ${n.data.pct ?? "90"}% dari anggaran ${month}.`,
    }
  }
  return { title: "Pemberitahuan", body: "Ada pembaruan di buku ini." }
}
