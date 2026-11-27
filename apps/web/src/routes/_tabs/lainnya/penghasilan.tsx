import { createFileRoute } from "@tanstack/react-router"
import { IncomesPage } from "@/pages/incomes/IncomesPage"

export const Route = createFileRoute("/_tabs/lainnya/penghasilan")({ component: IncomesPage })
