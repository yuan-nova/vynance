import {
  type CategoryKind,
  type CategoryUsage,
  type CreateTransactionInput,
  categoryUsageSchema,
  moneyToJson,
  type Transaction,
  type TransactionPage,
  type TransactionSummary,
  type TxType,
  transactionPageSchema,
  transactionSchema,
  transactionSummarySchema,
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

type ListFilter = { type?: TxType; from?: string; to?: string; walletId?: string; q?: string }

export async function fetchTransactions(bookId: string, filter: ListFilter, cursor?: string): Promise<TransactionPage> {
  const res = await t.$get({ param: { bookId }, query: { ...filter, ...(cursor ? { cursor } : {}) } })
  await ensureOk(res)
  return transactionPageSchema.parse(await res.json())
}

export async function fetchTransactionSummary(bookId: string, from: string, to: string): Promise<TransactionSummary> {
  const res = await t.summary.$get({ param: { bookId }, query: { from, to } })
  await ensureOk(res)
  return transactionSummarySchema.parse((await res.json()).data)
}
