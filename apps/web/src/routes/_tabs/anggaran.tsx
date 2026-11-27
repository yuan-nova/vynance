import { createFileRoute } from "@tanstack/react-router"
import { monthSchema } from "@vynance/shared"
import { z } from "zod"
import { BudgetPage } from "@/pages/budget/BudgetPage"

// Bulan aktif di URL (CODING-GUIDELINES §7.2 butir 4).
export const Route = createFileRoute("/_tabs/anggaran")({
  validateSearch: z.object({ bulan: monthSchema.optional().catch(undefined) }),
  component: BudgetPage,
})
