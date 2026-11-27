import { createFileRoute } from "@tanstack/react-router"
import { ZakatPage } from "@/pages/zakat/ZakatPage"

export const Route = createFileRoute("/_tabs/lainnya/zakat")({ component: ZakatPage })
