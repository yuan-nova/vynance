import { createFileRoute } from "@tanstack/react-router"
import { monthSchema } from "@vynance/shared"
import { z } from "zod"
import { HomePage } from "@/pages/home/HomePage"

// Bulan ringkasan di URL (CODING-GUIDELINES §7.2 butir 4).
export const Route = createFileRoute("/_tabs/")({
  validateSearch: z.object({ bulan: monthSchema.optional().catch(undefined) }),
  component: HomePage,
})
