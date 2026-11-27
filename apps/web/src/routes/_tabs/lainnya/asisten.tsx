import { createFileRoute } from "@tanstack/react-router"
import { AdvisorPage } from "@/pages/advisor/AdvisorPage"

export const Route = createFileRoute("/_tabs/lainnya/asisten")({ component: AdvisorPage })
