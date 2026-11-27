import { createFileRoute } from "@tanstack/react-router"
import { WalletDetailPage } from "@/pages/wallets/WalletDetailPage"

// Detail rekening: layar sendiri yang bisa ditautkan, tab Lainnya tetap aktif (DS-NAV-01).
export const Route = createFileRoute("/_tabs/lainnya/rekening_/$id")({ component: WalletDetailPage })
