import { z } from "zod"
import { moneySchema } from "../money/money"

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ID tidak valid")
const nonNegative = moneySchema.refine((v) => v >= 0n, "Nominal tidak boleh minus")

export const PLAN_METHODS = ["custom", "50_30_20", "60_20_20", "70_10_20", "fixed"] as const
export const planMethodSchema = z.enum(PLAN_METHODS)
export type PlanMethod = z.infer<typeof planMethodSchema>

export const ALLOCATION_MODES = ["amount", "percent"] as const
export const allocationModeSchema = z.enum(ALLOCATION_MODES)
export type AllocationMode = z.infer<typeof allocationModeSchema>

const allocationBase = {
  mode: allocationModeSchema,
  amount: nonNegative.default(0n),
  percentBp: z.number().int().min(0).max(10_000).default(0),
}

export const planAllocationInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("expense"), categoryId: ulid, ...allocationBase }).strict(),
  z.object({ kind: z.literal("investment"), investmentTypeId: ulid, ...allocationBase }).strict(),
])
export type PlanAllocationInput = z.infer<typeof planAllocationInputSchema>

export const planIncomeInputSchema = z
  .object({ name: z.string().trim().min(1, "Nama penghasilan wajib diisi").max(60), amount: nonNegative })
  .strict()

/**
 * `PUT /books/:bookId/plans/:month` (PB-04). Dokumen utuh; `version` = versi yang dibaca klien.
 * Versi beda → 409 supaya perubahan anggota lain tidak tertimpa diam-diam.
 */
export const putPlanSchema = z
  .object({
    version: z.number().int().min(0),
    spendingCap: nonNegative.nullable(),
    defaultWalletId: ulid.nullable(),
    method: planMethodSchema.default("custom"),
    incomes: z.array(planIncomeInputSchema).max(20),
    allocations: z.array(planAllocationInputSchema).max(200),
  })
  .strict()
export type PutPlanInput = z.infer<typeof putPlanSchema>

const allocationOut = z.object({
  kind: z.enum(["expense", "investment"]),
  categoryId: z.string().nullable(),
  investmentTypeId: z.string().nullable(),
  mode: allocationModeSchema,
  amount: z.string(),
  percentBp: z.number().int(),
  carriedOver: z.string(),
})
export type PlanAllocation = z.infer<typeof allocationOut>

/** Rencana satu bulan. `version` 0 = belum pernah disimpan. Uang sebagai string. */
export const planSchema = z.object({
  month: z.string(),
  version: z.number().int(),
  spendingCap: z.string().nullable(),
  defaultWalletId: z.string().nullable(),
  method: planMethodSchema,
  /** `fromSource` = dari Sumber Penghasilan rutin (BR-62), hanya baca; sisanya penghasilan khusus bulan itu. */
  incomes: z.array(z.object({ name: z.string(), amount: z.string(), fromSource: z.boolean().default(false) })),
  allocations: z.array(allocationOut),
  /** Pemasukan tercatat bulan itu (realisasi), ditampilkan terpisah dari rencana (temuan BRD §9 no. 8). */
  recordedIncome: z.string(),
  /** BR-10: realisasi pengeluaran per categoryId bulan ini (rupiah string). */
  spentByCategory: z.record(z.string(), z.string()),
  updatedByName: z.string().nullable(),
  updatedAt: z.string().nullable(),
})
export type Plan = z.infer<typeof planSchema>
