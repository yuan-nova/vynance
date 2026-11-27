import { z } from "zod"
import { moneySchema } from "../money/money"

const stageSchema = z.object({
  key: z.enum(["tk", "sd", "smp", "sma", "kuliah"]),
  label: z.string(),
  startYear: z.number().int(),
  status: z.enum(["upcoming", "ongoing", "done"]),
  futureCost: z.string(),
  allocated: z.string(),
  shortfall: z.string(),
  monthsLeft: z.number().int().nullable(),
  monthly: z.string().nullable(),
})
export type EducationStage = z.infer<typeof stageSchema>

export const childPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthYear: z.number().int(),
  savings: z.string(),
  stages: z.array(stageSchema),
  monthly: z.string(),
})
export type ChildPlan = z.infer<typeof childPlanSchema>

/** Rencana dana pendidikan satu buku (PB-09, FR-120). Uang berupa string di JSON. */
export const educationPlanSchema = z.object({
  inflationBp: z.number().int(),
  children: z.array(childPlanSchema),
  monthly: z.string(),
})
export type EducationPlan = z.infer<typeof educationPlanSchema>

const nameSchema = z.string().trim().min(1, "Nama anak wajib diisi").max(60, "Nama anak maksimal 60 karakter")
const birthYearSchema = z.coerce
  .number()
  .int("Tahun lahir tidak valid")
  .min(1990, "Tahun lahir minimal 1990")
  .max(2100, "Tahun lahir tidak valid")
const savingsSchema = moneySchema.refine((v) => v >= 0n, "Tidak boleh minus")

export const createChildSchema = z
  .object({ name: nameSchema, birthYear: birthYearSchema, savings: savingsSchema.default(0n) })
  .strict()
export type CreateChildInput = z.infer<typeof createChildSchema>

export const updateChildSchema = z
  .object({ name: nameSchema.optional(), birthYear: birthYearSchema.optional(), savings: savingsSchema.optional() })
  .strict()
export type UpdateChildInput = z.infer<typeof updateChildSchema>

/** Inflasi pendidikan bisa diubah pengguna (BR-43): 0–30% per tahun. */
export const updateEducationSettingsSchema = z
  .object({
    inflationBp: z.number().int().min(0, "Inflasi tidak boleh minus").max(3000, "Inflasi maksimal 30% per tahun"),
  })
  .strict()
export type UpdateEducationSettingsInput = z.infer<typeof updateEducationSettingsSchema>
