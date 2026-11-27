import { z } from "zod"
import { monthSchema } from "../date"
import { PILLAR_KEYS } from "../rules/health-score"

export const healthPillarKeySchema = z.enum(PILLAR_KEYS)

/** Satu pilar skor kesehatan (BRD §8.2). `points` 0–25, `valueBp` dalam basis poin. */
export const healthPillarSchema = z.object({
  key: healthPillarKeySchema,
  label: z.string(),
  status: z.enum(["scored", "not_assessed"]),
  points: z.number().min(0).max(25),
  valueBp: z.number().int().nullable(),
  /** Rincian angka mentah pilar, misalnya "Rp6.000.000 dari Rp24.500.000". */
  detail: z.string(),
})

/** `GET /books/:bookId/health-score?month=YYYY-MM` (FR-51). */
export const healthScoreSchema = z.object({
  month: monthSchema,
  score: z.number().int().min(0).max(100),
  level: z.enum(["excellent", "good", "fair", "poor"]),
  levelLabel: z.string(),
  assessedCount: z.number().int().min(0).max(4),
  /** Pilar yang belum dinilai; skor hanya dilitung dari pilar yang tersisa. */
  note: z.string(),
  pillars: z.array(healthPillarSchema),
})
export type HealthScoreResponse = z.infer<typeof healthScoreSchema>
