import { z } from "zod"

/** Jenis investasi (TSD §6.2). CRUD + target di #31. */
export const investmentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  targetValue: z.string().nullable(),
  sortOrder: z.number().int(),
})
export type InvestmentType = z.infer<typeof investmentTypeSchema>
