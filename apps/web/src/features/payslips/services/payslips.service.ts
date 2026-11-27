import { moneyToJson, type PayslipList, payslipListSchema, type SavePayslipInput } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const r = api.books[":bookId"].payslips

export async function fetchPayslips(bookId: string): Promise<PayslipList> {
  const res = await r.$get({ param: { bookId } })
  await ensureOk(res)
  return payslipListSchema.parse((await res.json()).data)
}

export async function savePayslip(bookId: string, input: SavePayslipInput): Promise<PayslipList> {
  const res = await r.$post({
    param: { bookId },
    json: {
      period: input.period,
      gross: moneyToJson(input.gross),
      deductions: moneyToJson(input.deductions),
      net: moneyToJson(input.net),
    },
  })
  await ensureOk(res)
  return payslipListSchema.parse((await res.json()).data)
}

export async function deletePayslip(bookId: string, id: string): Promise<void> {
  const res = await r[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}
