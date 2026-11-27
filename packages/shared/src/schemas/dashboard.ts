import { z } from "zod"
import { monthSchema } from "../date"
import { transactionListItemSchema } from "./transaction"

export const dashboardQuerySchema = z.object({ month: monthSchema }).strict()

/** Anggaran teratas di Beranda: kategori dengan pemakaian tertinggi (BR-10…BR-12). */
export const dashboardBudgetSchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  icon: z.string(),
  allocated: z.string(),
  spent: z.string(),
})

/** `GET /books/:bookId/dashboard?month=` (FR-50, FR-53). Semua rupiah string. */
export const dashboardSchema = z.object({
  month: monthSchema,
  wealth: z.object({ netWorth: z.string(), cash: z.string(), investments: z.string(), debt: z.string() }),
  /** Uang masuk/keluar bulan yang dipilih saja (temuan BRD §9 no. 14). */
  monthSummary: z.object({ income: z.string(), expense: z.string() }),
  topBudgets: z.array(dashboardBudgetSchema),
  recent: z.array(transactionListItemSchema),
})
export type Dashboard = z.infer<typeof dashboardSchema>
