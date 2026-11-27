import {
  type CategoryKind,
  type CategoryUsage,
  type CreateTransactionInput,
  categoryUsageSchema,
  moneyToJson,
  type Transaction,
  transactionSchema,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const t = api.books[":bookId"].transactions

/** Catat transaksi. `idempotencyKey` dibuat sekali per sheet supaya simpan ganda tidak membuat dua transaksi. */
export async function createTransaction(
  bookId: string,
  input: CreateTransactionInput,
  idempotencyKey: string,
): Promise<Transaction> {
  const res = await t.$post({
    param: { bookId },
    header: { "idempotency-key": idempotencyKey },
    json: { ...input, amount: moneyToJson(input.amount) },
  })
  await ensureOk(res)
  return transactionSchema.parse((await res.json()).data)
}

export async function fetchCategoryUsage(bookId: string, kind: CategoryKind): Promise<CategoryUsage> {
  const res = await t["category-usage"].$get({ param: { bookId }, query: { kind } })
  await ensureOk(res)
  return categoryUsageSchema.parse((await res.json()).data)
}
