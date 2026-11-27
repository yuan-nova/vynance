import { createFileRoute } from "@tanstack/react-router"
import { GoalsPage } from "@/pages/goals/GoalsPage"

export const Route = createFileRoute("/_tabs/lainnya/target")({ component: GoalsPage })
