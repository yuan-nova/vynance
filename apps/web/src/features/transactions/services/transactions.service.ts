import {
  type CategoryKind,
  type CategoryUsage,
  type CreateTransactionInput,
  categoryUsageSchema,
  moneyToJson,
  type OutboxItem,
  type OutboxSendResult,
  type ScanCommitInput,
  type Transaction,
  type TransactionDetail,
  type TransactionPage,
  type TransactionSummary,
  type TxType,
  transactionDetailSchema,
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

/**
 * Kirim satu item antrean offline dengan Idempotency-Key aslinya (NFR-04).
 * 2xx = terkirim; 4xx selain 401/408/429 = ditolak permanen; sisanya dan kegagalan jaringan = coba lagi.
 */
export async function sendOutboxItem(item: OutboxItem): Promise<OutboxSendResult> {
  try {
    const res = await t.$post({
      param: { bookId: item.bookId },
      header: { "idempotency-key": item.key },
      // Sudah berbentuk JSON (amount string) sejak dimasukkan ke antrean.
      json: item.input as Parameters<typeof t.$post>[0]["json"],
    })
    if (res.ok) return "sent"
    return res.status >= 500 || [401, 408, 429].includes(res.status) ? "retry" : "rejected"
  } catch {
    return "retry"
  }
}

/** Simpan semua baris scan yang dipilih (PB-03 langkah 5). */
export async function commitScan(
  bookId: string,
  items: ScanCommitInput["items"],
  idempotencyKey: string,
): Promise<number> {
  const res = await t.scan.$post({
    param: { bookId },
    header: { "idempotency-key": idempotencyKey },
    json: { items: items.map((x) => ({ ...x, amount: moneyToJson(x.amount) })) },
  })
  await ensureOk(res)
  return (await res.json()).data.length
}

/** URL unduhan CSV (FR-22) dengan filter daftar yang sama; cookie sesi ikut karena satu origin. */
export function transactionsCsvUrl(bookId: string, filter: Omit<ListFilter, "cursor">): string {
  const params = new URLSearchParams(
    Object.entries(filter).flatMap(([k, v]) => (v ? [[k, String(v)] as [string, string]] : [])),
  )
  const qs = params.toString()
  return `/api/v1/books/${bookId}/exports/transactions.csv${qs ? `?${qs}` : ""}`
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

export async function fetchTransaction(bookId: string, id: string): Promise<TransactionDetail> {
  const res = await t[":id"].$get({ param: { bookId, id } })
  await ensureOk(res)
  return transactionDetailSchema.parse((await res.json()).data)
}

export async function updateTransaction(
  bookId: string,
  id: string,
  input: CreateTransactionInput,
): Promise<TransactionDetail> {
  const res = await t[":id"].$patch({ param: { bookId, id }, json: { ...input, amount: moneyToJson(input.amount) } })
  await ensureOk(res)
  return transactionDetailSchema.parse((await res.json()).data)
}

export async function deleteTransaction(bookId: string, id: string): Promise<void> {
  const res = await t[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}

export async function restoreTransaction(bookId: string, id: string): Promise<void> {
  const res = await t[":id"].restore.$post({ param: { bookId, id } })
  await ensureOk(res)
}
