import { z } from "zod"
import { dateOnlySchema, monthSchema } from "../date/date"
import { moneySchema } from "../money/money"

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ID tidak valid")

export const PLANNED_SOURCES = ["income", "subscription"] as const
export const plannedSourceSchema = z.enum(PLANNED_SOURCES)
export type PlannedSource = z.infer<typeof plannedSourceSchema>

export const PLANNED_STATUSES = ["pending", "realized", "skipped"] as const
export type PlannedStatus = (typeof PLANNED_STATUSES)[number]

/** Rencana transaksi satu bulan (PB-13, BR-60). Uang berupa string di JSON. */
export const plannedItemSchema = z.object({
  sourceType: plannedSourceSchema,
  sourceId: z.string(),
  period: z.string(),
  name: z.string(),
  amount: z.string(),
  dueDate: z.string(),
  walletId: z.string().nullable(),
  categoryId: z.string().nullable(),
  status: z.enum(PLANNED_STATUSES),
  transactionId: z.string().nullable(),
})
export type PlannedItem = z.infer<typeof plannedItemSchema>

export const plannedListSchema = z.object({ items: z.array(plannedItemSchema) })
export type PlannedList = z.infer<typeof plannedListSchema>

export const plannedQuerySchema = z.object({ month: monthSchema })

/** Realisasi (PB-13 langkah 3–4). Nominal 0 = Lewati; selain itu semua isian bisa diubah dari rencana. */
export const realizePlannedSchema = z
  .object({
    sourceType: plannedSourceSchema,
    sourceId: ulid,
    period: monthSchema,
    amount: moneySchema.refine((v) => v >= 0n, "Nominal tidak boleh minus"),
    txDate: dateOnlySchema,
    walletId: ulid,
    categoryId: ulid,
    note: z.string().trim().max(200, "Catatan maksimal 200 karakter").optional(),
  })
  .strict()
export type RealizePlannedInput = z.infer<typeof realizePlannedSchema>
