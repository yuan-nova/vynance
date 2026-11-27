import { createFileRoute } from "@tanstack/react-router"
import { monthSchema } from "@vynance/shared"
import { z } from "zod"
import { BudgetWizardPage } from "@/pages/budget/BudgetWizardPage"

// Layar penuh (bukan sheet) karena langkahnya saling bergantung (DS-SHEET-01). Tab Anggaran tetap aktif.
export const Route = createFileRoute("/_tabs/anggaran_/wizard")({
  validateSearch: z.object({ bulan: monthSchema.optional().catch(undefined) }),
  component: BudgetWizardPage,
})
