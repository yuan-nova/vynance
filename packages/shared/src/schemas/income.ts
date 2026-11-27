import { z } from "zod"
import { positiveMoneySchema } from "../money/money"

const kindSchema = z.enum(["active", "passive"])

export const incomeSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: kindSchema,
  monthlyAmount: z.string(),
  isRecurring: z.boolean(),
})
export type IncomeSource = z.infer<typeof incomeSourceSchema>

/** Daftar sumber penghasilan dan porsi pasif (PB-10, FR-130). Uang berupa string di JSON. */
export const incomeListSchema = z.object({
  sources: z.array(incomeSourceSchema),
  summary: z.object({
    active: z.string(),
    passive: z.string(),
    total: z.string(),
    passiveBp: z.number().int(),
    targetBp: z.number().int(),
    metTarget: z.boolean(),
  }),
})
export type IncomeList = z.infer<typeof incomeListSchema>

const nameSchema = z.string().trim().min(1, "Nama sumber wajib diisi").max(60, "Nama sumber maksimal 60 karakter")

export const createIncomeSourceSchema = z
  .object({
    name: nameSchema,
    kind: kindSchema,
    monthlyAmount: positiveMoneySchema,
    isRecurring: z.boolean().default(true),
  })
  .strict()
export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>

export const updateIncomeSourceSchema = z
  .object({
    name: nameSchema.optional(),
    kind: kindSchema.optional(),
    monthlyAmount: positiveMoneySchema.optional(),
    isRecurring: z.boolean().optional(),
  })
  .strict()
export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>

/** Target porsi pasif 0–100%. */
export const updatePassiveTargetSchema = z
  .object({
    targetBp: z.number().int().min(0, "Target tidak boleh minus").max(10_000, "Target maksimal 100%"),
  })
  .strict()
export type UpdatePassiveTargetInput = z.infer<typeof updatePassiveTargetSchema>
