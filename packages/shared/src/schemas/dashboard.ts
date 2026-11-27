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
  /** Pemakaian alokasi dalam basis poin (10.000 = 100%), BR-11. */
  usageBp: z.number().int(),
})

/** `GET /books/:bookId/dashboard?month=` (FR-50, FR-53). Semua rupiah string. */
export const dashboardSchema = z.object({
  month: monthSchema,
  wealth: z.object({ netWorth: z.string(), cash: z.string(), investments: z.string(), debt: z.string() }),
  /** Uang masuk/keluar bulan yang dipilih saja (temuan BRD §9 no. 14). */
  monthSummary: z.object({ income: z.string(), expense: z.string() }),
  /** Skor kesehatan bulan yang dipilih (FR-51); rincian pilar ada di `/health-score`. */
  healthScore: z.object({
    score: z.number().int().min(0).max(100),
    level: z.enum(["excellent", "good", "fair", "poor"]),
    levelLabel: z.string(),
  }),
  topBudgets: z.array(dashboardBudgetSchema),
  recent: z.array(transactionListItemSchema),
})
export type Dashboard = z.infer<typeof dashboardSchema>

/** Grafik Beranda (FR-52): arus kas 6 bulan, pengeluaran per kategori, bulan ini vs lalu. Uang string. */
export const dashboardChartsSchema = z.object({
  month: monthSchema,
  cashflow: z.array(z.object({ month: monthSchema, income: z.string(), expense: z.string() })),
  byCategory: z.array(z.object({ name: z.string(), amount: z.string() })),
  compare: z.object({
    current: z.string(),
    previous: z.string(),
    changeBp: z.number().int().nullable(),
    categories: z.array(z.object({ name: z.string(), current: z.string(), previous: z.string() })),
  }),
})
export type DashboardCharts = z.infer<typeof dashboardChartsSchema>
