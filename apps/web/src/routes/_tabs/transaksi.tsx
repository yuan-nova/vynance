import { createFileRoute } from "@tanstack/react-router"
import { monthSchema } from "@vynance/shared"
import { z } from "zod"
import { TransactionsPage } from "@/pages/transactions/TransactionsPage"

// Filter dan bulan di URL (CODING-GUIDELINES §7.2 butir 4, DS-DATA-02).
export const Route = createFileRoute("/_tabs/transaksi")({
  validateSearch: z.object({
    bulan: monthSchema.optional().catch(undefined),
    jenis: z.enum(["semua", "keluar", "masuk", "transfer"]).catch("semua").default("semua"),
    rekening: z.string().optional().catch(undefined),
    cari: z.string().max(100).optional().catch(undefined),
    // Mode daftar (PB-14): riwayat (bawaan) atau per kategori.
    mode: z.enum(["riwayat", "kategori"]).catch("riwayat").default("riwayat"),
  }),
  component: TransactionsPage,
})
