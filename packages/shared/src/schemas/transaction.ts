import { z } from "zod"
import { dateOnlySchema } from "../date/date"
import { txTypeSchema } from "../enums/wallet"
import { positiveMoneySchema } from "../money/money"

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ID tidak valid")
const note = z.string().trim().max(200, "Catatan maksimal 200 karakter").optional()

export const TX_SOURCES = ["manual", "subscription", "scan"] as const
export const txSourceSchema = z.enum(TX_SOURCES)
export type TxSource = z.infer<typeof txSourceSchema>

/** Transaksi di JSON. Uang berupa string (CODING-GUIDELINES §6.8). */
export const transactionSchema = z.object({
  id: z.string(),
  type: txTypeSchema,
  amount: z.string(),
  txDate: z.string(),
  walletId: z.string(),
  toWalletId: z.string().nullable(),
  categoryId: z.string().nullable(),
  assetId: z.string().nullable(),
  note: z.string().nullable(),
  source: txSourceSchema,
  createdBy: z.string(),
  createdAt: z.string(),
})
export type Transaction = z.infer<typeof transactionSchema>

// BR-30: jumlah > 0. Kategori wajib untuk uang masuk/keluar; transfer memakai rekening tujuan (BR-31).
const incomeExpense = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: positiveMoneySchema,
    txDate: dateOnlySchema,
    walletId: ulid,
    categoryId: ulid,
    note,
  })
  .strict()

const transfer = z
  .object({
    type: z.literal("transfer"),
    amount: positiveMoneySchema,
    txDate: dateOnlySchema,
    walletId: ulid,
    toWalletId: ulid,
    note,
  })
  .strict()
  .refine((v) => v.toWalletId !== v.walletId, {
    message: "Rekening tujuan harus beda dengan rekening sumber",
    path: ["toWalletId"],
  })

/** Beli/jual aset ditambahkan di #32. */
export const createTransactionSchema = z.union([incomeExpense, transfer])
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

/** Header `Idempotency-Key` (CODING-GUIDELINES §6.7). */
export const idempotencyKeySchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

/** Jumlah pemakaian kategori untuk mengurutkan chip "sering dipakai" (PB-02 langkah 3). */
export const categoryUsageSchema = z.array(z.object({ categoryId: z.string(), count: z.number().int() }))
export type CategoryUsage = z.infer<typeof categoryUsageSchema>
