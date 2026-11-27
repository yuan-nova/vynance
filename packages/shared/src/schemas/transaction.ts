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

/** BR-32: beli/jual aset wajib rekening dan aset. Tidak dihitung pemasukan/pengeluaran (PB-02). */
const assetTrade = z
  .object({
    type: z.enum(["asset_buy", "asset_sell"]),
    amount: positiveMoneySchema,
    txDate: dateOnlySchema,
    walletId: ulid,
    assetId: ulid,
    note,
  })
  .strict()

export const createTransactionSchema = z.union([incomeExpense, transfer, assetTrade])
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

/** Baris daftar transaksi dengan nama terkait (DS-DATA-01). Nama kategori/rekening yang dihapus tetap tampil. */
export const transactionListItemSchema = transactionSchema.extend({
  categoryName: z.string().nullable(),
  categoryIcon: z.string().nullable(),
  walletName: z.string(),
  toWalletName: z.string().nullable(),
  createdByName: z.string(),
})
export type TransactionListItem = z.infer<typeof transactionListItemSchema>

export const transactionPageSchema = z.object({
  data: z.array(transactionListItemSchema),
  nextCursor: z.string().nullable(),
})
export type TransactionPage = z.infer<typeof transactionPageSchema>

/** Filter daftar (FR-21). `cursor` = "YYYY-MM-DD.<id>" dari halaman sebelumnya. */
export const transactionListQuerySchema = z
  .object({
    type: txTypeSchema.optional(),
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    walletId: ulid.optional(),
    q: z.string().trim().max(100).optional(),
    cursor: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}\.[0-9A-HJKMNP-TV-Z]{26}$/)
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>

/** Ringkasan masuk/keluar suatu rentang (transfer & aset tidak dihitung, PB-02). */
export const transactionSummarySchema = z.object({ income: z.string(), expense: z.string() })
export type TransactionSummary = z.infer<typeof transactionSummarySchema>

export const transactionSummaryQuerySchema = z.object({ from: dateOnlySchema, to: dateOnlySchema }).strict()

/** Ubah transaksi: isi lengkap seperti saat mencatat (FR-20). Beli/jual aset diubah lewat #32 (BR-34). */
export const updateTransactionSchema = createTransactionSchema
export type UpdateTransactionInput = CreateTransactionInput

/** Detail transaksi + riwayat pembuat/pengubah (FR-20). */
export const transactionDetailSchema = transactionListItemSchema.extend({
  updatedByName: z.string().nullable(),
  updatedAt: z.string(),
})
export type TransactionDetail = z.infer<typeof transactionDetailSchema>
