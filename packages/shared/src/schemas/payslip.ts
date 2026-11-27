import { z } from "zod"
import { moneySchema, positiveMoneySchema } from "../money/money"

const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Periode tidak valid (YYYY-MM)")

export const payslipSchema = z.object({
  id: z.string(),
  period: z.string(),
  gross: z.string(),
  deductions: z.string(),
  net: z.string(),
  changeBp: z.number().int().nullable(),
})
export type Payslip = z.infer<typeof payslipSchema>

/** Tren 12 slip terakhir (PB-10, FR-140). Uang berupa string di JSON. */
export const payslipListSchema = z.object({ payslips: z.array(payslipSchema) })
export type PayslipList = z.infer<typeof payslipListSchema>

/**
 * Angka slip hasil baca PDF di perangkat yang sudah ditinjau pengguna (ADR 0007).
 * File PDF tidak dikirim. Satu slip per periode; menyimpan periode yang sama menggantikan angka lama.
 */
export const savePayslipSchema = z
  .object({
    period: periodSchema,
    gross: positiveMoneySchema,
    deductions: moneySchema.refine((v) => v >= 0n, "Tidak boleh minus"),
    net: positiveMoneySchema,
  })
  .strict()
  .refine((v) => v.gross - v.deductions === v.net, {
    message: "Gaji bersih harus sama dengan gaji kotor dikurangi potongan",
    path: ["net"],
  })
export type SavePayslipInput = z.infer<typeof savePayslipSchema>
