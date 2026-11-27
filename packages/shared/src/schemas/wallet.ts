import { z } from "zod"
import { isDebtWallet, walletTypeSchema } from "../enums/wallet"
import { moneySchema } from "../money/money"

const nameSchema = z.string().trim().min(1, "Nama rekening wajib diisi").max(40, "Nama rekening maksimal 40 karakter")
const limitSchema = moneySchema.refine((v) => v > 0n, "Limit harus lebih dari 0")

/** Rekening dengan saldo terhitung (BR-01). Uang berupa string di JSON. */
export const walletSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: walletTypeSchema,
  icon: z.string(),
  openingBalance: z.string(),
  creditLimit: z.string().nullable(),
  balance: z.string(),
  limitUsageBp: z.number().int().nullable(),
  archivedAt: z.string().nullable(),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletListSchema = z.object({
  wallets: z.array(walletSchema),
  summary: z.object({ cash: z.string(), debt: z.string(), walletCount: z.number(), debtCount: z.number() }),
})
export type WalletList = z.infer<typeof walletListSchema>

/** Limit hanya untuk kartu kredit dan PayLater (FR-10). */
export const createWalletSchema = z
  .object({
    name: nameSchema,
    type: walletTypeSchema,
    openingBalance: moneySchema.default(0n),
    creditLimit: limitSchema.nullable().optional(),
  })
  .strict()
  .refine((v) => isDebtWallet(v.type) || v.creditLimit == null, {
    message: "Limit hanya untuk kartu kredit dan PayLater",
    path: ["creditLimit"],
  })
export type CreateWalletInput = z.infer<typeof createWalletSchema>

export const updateWalletSchema = z
  .object({
    name: nameSchema.optional(),
    type: walletTypeSchema.optional(),
    openingBalance: moneySchema.optional(),
    creditLimit: limitSchema.nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Tidak ada perubahan")
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>

/** `POST /books/:bookId/onboarding/opening-balances` (PB-01 langkah 3). Daftar kosong = Lewati. */
export const openingBalancesSchema = z
  .object({
    balances: z
      .array(z.object({ walletId: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/), openingBalance: moneySchema }).strict())
      .max(50),
  })
  .strict()
export type OpeningBalancesInput = z.infer<typeof openingBalancesSchema>
