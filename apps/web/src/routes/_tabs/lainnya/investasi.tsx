import { createFileRoute } from "@tanstack/react-router"
import { InvestmentsPage } from "@/pages/investments/InvestmentsPage"

export const Route = createFileRoute("/_tabs/lainnya/investasi")({ component: InvestmentsPage })
