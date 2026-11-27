import { z } from "zod"
import { dateOnlySchema } from "../date"
import { CURRENCIES } from "../rules/subscription"

// Langganan (FR-80, PB-05). Nominal asing desimal string; rupiah string bilangan bulat.

const decimal2 = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Nominal tidak valid")
const decimal6 = z.string().regex(/^\d{1,12}(\.\d{1,6})?$/, "Kurs tidak valid")

export const subscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  serviceKey: z.string().nullable(),
  currency: z.enum(CURRENCIES),
  originalAmount: z.string(),
  fxRate: z.string().nullable(),
  amountIdr: z.string(),
  monthlyIdr: z.string(),
  cycle: z.enum(["monthly", "yearly"]),
  billingDay: z.number().int(),
  billingMonth: z.number().int().nullable(),
  walletId: z.string(),
  walletName: z.string(),
  categoryId: z.string().nullable(),
  startDate: z.string(),
  nextBillingDate: z.string(),
  paused: z.boolean(),
  /** Tanggal transaksi otomatis terakhir (#30), untuk "Tercatat otomatis …". */
  lastChargedOn: z.string().nullable(),
})
export type Subscription = z.infer<typeof subscriptionSchema>

export const subscriptionListSchema = z.object({
  subscriptions: z.array(subscriptionSchema),
  /** BR-40, hanya yang tidak dijeda. */
  monthlyTotal: z.string(),
  yearlyTotal: z.string(),
})
export type SubscriptionList = z.infer<typeof subscriptionListSchema>

const base = z.object({
  name: z.string().trim().min(1, "Nama langganan wajib diisi").max(60, "Nama maksimal 60 karakter"),
  currency: z.enum(CURRENCIES).default("IDR"),
  originalAmount: decimal2.refine((v) => Number(v) > 0, "Biaya harus lebih dari 0"),
  /** Kosong = kurs otomatis. Diabaikan untuk IDR. */
  fxRate: decimal6
    .refine((v) => Number(v) > 0, "Kurs harus lebih dari 0")
    .nullable()
    .default(null),
  cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  billingDay: z.number().int().min(1, "Tanggal 1–31").max(31, "Tanggal 1–31"),
  billingMonth: z.number().int().min(1).max(12).nullable().default(null),
  walletId: z.string(),
  categoryId: z.string().nullable().default(null),
  startDate: dateOnlySchema,
})

export const createSubscriptionSchema = base.strict().refine((v) => v.cycle === "monthly" || v.billingMonth !== null, {
  message: "Pilih bulan tagihan untuk langganan tahunan",
  path: ["billingMonth"],
})
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

export const updateSubscriptionSchema = base
  .extend({ paused: z.boolean().default(false) })
  .strict()
  .refine((v) => v.cycle === "monthly" || v.billingMonth !== null, {
    message: "Pilih bulan tagihan untuk langganan tahunan",
    path: ["billingMonth"],
  })
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

/** Kurs terbaru per mata uang (IDR per 1 unit) + sumbernya. */
export const fxRatesSchema = z.array(
  z.object({
    currency: z.string(),
    value: z.string(),
    source: z.enum(["reference", "fallback"]),
    fetchedAt: z.string().nullable(),
  }),
)
export type FxRates = z.infer<typeof fxRatesSchema>
