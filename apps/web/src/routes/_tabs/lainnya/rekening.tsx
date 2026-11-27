import { createFileRoute } from "@tanstack/react-router"
import { WalletsPage } from "@/pages/wallets/WalletsPage"

export const Route = createFileRoute("/_tabs/lainnya/rekening")({ component: WalletsPage })
