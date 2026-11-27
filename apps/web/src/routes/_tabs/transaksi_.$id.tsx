import { createFileRoute } from "@tanstack/react-router"
import { TransactionDetailPage } from "@/pages/transactions/TransactionDetailPage"

// Detail transaksi: layar penuh yang bisa ditautkan (DS-SHEET-01). Tab Transaksi tetap aktif (DS-NAV-01).
export const Route = createFileRoute("/_tabs/transaksi_/$id")({ component: TransactionDetailPage })
