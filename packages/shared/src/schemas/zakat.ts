import { z } from "zod"
import { dateOnlySchema } from "../date"
import { positiveMoneySchema } from "../money/money"

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ID tidak valid")

/** Ringkasan zakat maal (PB-08). Uang berupa string di JSON. */
export const zakatSummarySchema = z.object({
  goldPrice: z.string(),
  goldSource: z.enum(["manual", "live", "default"]),
  goldFetchedAt: z.string().nullable(),
  cash: z.string(),
  investments: z.string(),
  debtDue: z.string(),
  wealth: z.string(),
  nisab: z.string(),
  obligatory: z.boolean(),
  zakat: z.string(),
  haulStart: z.string().nullable(),
  haulDate: z.string().nullable(),
  haulReached: z.boolean(),
  categoryId: z.string().nullable(),
})
export type ZakatSummary = z.infer<typeof zakatSummarySchema>

export const zakatQuerySchema = z.object({
  goldPrice: z
    .string()
    .regex(/^\d{1,10}$/)
    .optional(),
})

/** Catat pembayaran → transaksi keluar kategori Zakat & Infaq; mulai haul baru dari tanggal bayar. */
export const zakatPaymentSchema = z
  .object({ amount: positiveMoneySchema, walletId: ulid, txDate: dateOnlySchema })
  .strict()
export type ZakatPaymentInput = z.infer<typeof zakatPaymentSchema>

export const zakatHaulSchema = z.object({ haulStart: dateOnlySchema.nullable() }).strict()
