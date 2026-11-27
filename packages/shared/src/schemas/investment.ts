import { z } from "zod"
import { moneySchema, positiveMoneySchema } from "../money/money"

/** Jenis investasi dengan target nilai (PB-06 langkah 1). */
export const investmentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  targetValue: z.string().nullable(),
  sortOrder: z.number().int(),
})
export type InvestmentType = z.infer<typeof investmentTypeSchema>

export const INVESTMENT_ICONS = ["coins", "trend", "bank", "globe", "shield", "brief", "target", "spark"] as const

const typeName = z.string().trim().min(1, "Nama jenis wajib diisi").max(40, "Nama maksimal 40 karakter")

export const createInvestmentTypeSchema = z
  .object({
    name: typeName,
    icon: z.enum(INVESTMENT_ICONS).default("trend"),
    targetValue: positiveMoneySchema.nullable().default(null),
  })
  .strict()
export type CreateInvestmentTypeInput = z.infer<typeof createInvestmentTypeSchema>

export const updateInvestmentTypeSchema = createInvestmentTypeSchema
export type UpdateInvestmentTypeInput = CreateInvestmentTypeInput

const unitsSchema = z
  .string()
  .regex(/^\d{1,12}(\.\d{1,6})?$/, "Jumlah unit tidak valid")
  .refine((v) => Number(v) >= 0, "Unit tidak boleh minus")
const nonNegative = moneySchema.refine((v) => v >= 0n, "Tidak boleh minus")

/** Aset dengan untung/rugi terhitung (PB-06 langkah 2, 4). Uang berupa string di JSON. */
export const assetSchema = z.object({
  id: z.string(),
  investmentTypeId: z.string(),
  typeName: z.string(),
  name: z.string(),
  units: z.string(),
  costBasis: z.string(),
  currentValue: z.string(),
  gain: z.string(),
  gainBp: z.number().int().nullable(),
  valueUpdatedAt: z.string().nullable(),
})
export type Asset = z.infer<typeof assetSchema>

export const createAssetSchema = z
  .object({
    name: z.string().trim().min(1, "Nama aset wajib diisi").max(60, "Nama maksimal 60 karakter"),
    investmentTypeId: z.string(),
    units: unitsSchema.default("0"),
    costBasis: nonNegative,
    currentValue: nonNegative,
  })
  .strict()
export type CreateAssetInput = z.infer<typeof createAssetSchema>

/** Nilai kini diperbarui manual (PB-06 langkah 4). Modal berubah hanya lewat transaksi beli/jual (#32). */
export const updateAssetSchema = z
  .object({
    name: z.string().trim().min(1, "Nama aset wajib diisi").max(60, "Nama maksimal 60 karakter").optional(),
    investmentTypeId: z.string().optional(),
    units: unitsSchema.optional(),
    currentValue: nonNegative.optional(),
  })
  .strict()
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>

/** `GET /books/:bookId/investments`: portofolio lengkap untuk layar Investasi (design/10). */
export const portfolioSchema = z.object({
  totals: z.object({ cost: z.string(), value: z.string(), gain: z.string(), gainBp: z.number().int().nullable() }),
  types: z.array(
    investmentTypeSchema.extend({
      value: z.string(),
      cost: z.string(),
      assetCount: z.number().int(),
      progressBp: z.number().int().nullable(),
    }),
  ),
  assets: z.array(assetSchema),
})
export type Portfolio = z.infer<typeof portfolioSchema>
