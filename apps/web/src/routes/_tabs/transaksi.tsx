import { createFileRoute } from "@tanstack/react-router"
import { TransactionsPage } from "@/pages/transactions/TransactionsPage"

export const Route = createFileRoute("/_tabs/transaksi")({ component: TransactionsPage })
