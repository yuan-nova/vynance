import { createFileRoute } from "@tanstack/react-router"
import { PayslipsPage } from "@/pages/payslips/PayslipsPage"

export const Route = createFileRoute("/_tabs/lainnya/slip-gaji")({ component: PayslipsPage })
