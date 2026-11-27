import { createFileRoute } from "@tanstack/react-router"
import { monthSchema } from "@vynance/shared"
import { z } from "zod"
import { HealthScorePage } from "@/pages/health-score/HealthScorePage"

// Rincian skor kesehatan (DS-SHEET-01): layar penuh yang bisa ditautkan, bulan di URL.
export const Route = createFileRoute("/_tabs/skor-kesehatan")({
  validateSearch: z.object({ bulan: monthSchema.optional().catch(undefined) }),
  component: HealthScorePage,
})
