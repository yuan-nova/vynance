import { z } from "zod"
import { dateOnlySchema } from "../date"
import { moneySchema, positiveMoneySchema } from "../money/money"

const goalStatusSchema = z.enum(["achieved", "overdue", "onTrack", "attention"])

/** Target tabungan dengan progres terhitung (PB-07). Uang berupa string di JSON. */
export const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  targetAmount: z.string(),
  initialAmount: z.string(),
  collected: z.string(),
  targetDate: z.string().nullable(),
  note: z.string().nullable(),
  percentBp: z.number().int(),
  remaining: z.string(),
  monthsLeft: z.number().int().nullable(),
  monthlyNeeded: z.string().nullable(),
  pace: z.string(),
  status: goalStatusSchema,
})
export type Goal = z.infer<typeof goalSchema>

export const goalListSchema = z.object({
  goals: z.array(goalSchema),
  summary: z.object({ collected: z.string(), target: z.string(), count: z.number().int() }),
})
export type GoalList = z.infer<typeof goalListSchema>

export const GOAL_ICONS = ["target", "shield", "heart", "car", "school", "globe", "bag", "brief", "zap"] as const

const nameSchema = z.string().trim().min(1, "Nama target wajib diisi").max(60, "Nama target maksimal 60 karakter")
const noteSchema = z.string().trim().max(200, "Catatan maksimal 200 karakter")
const nonNegative = moneySchema.refine((v) => v >= 0n, "Tidak boleh minus")

export const createGoalSchema = z
  .object({
    name: nameSchema,
    icon: z.enum(GOAL_ICONS).default("target"),
    targetAmount: positiveMoneySchema,
    initialAmount: nonNegative.default(0n),
    targetDate: dateOnlySchema.nullable().default(null),
    note: noteSchema.nullable().default(null),
  })
  .strict()
export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const updateGoalSchema = z
  .object({
    name: nameSchema.optional(),
    icon: z.enum(GOAL_ICONS).optional(),
    targetAmount: positiveMoneySchema.optional(),
    initialAmount: nonNegative.optional(),
    targetDate: dateOnlySchema.nullable().optional(),
    note: noteSchema.nullable().optional(),
  })
  .strict()
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>

export const createContributionSchema = z
  .object({ amount: positiveMoneySchema, contributedOn: dateOnlySchema })
  .strict()
export type CreateContributionInput = z.infer<typeof createContributionSchema>
