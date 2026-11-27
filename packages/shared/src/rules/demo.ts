import { SEED_EXPENSE_CATEGORIES, SEED_INCOME_CATEGORIES } from "../defaults/book-seed"
import type { CreateTransactionInput } from "../schemas/transaction"
import type { DemoTransaction } from "../types"

// Mode demo dan impor setelah daftar (FR-151, PB-01 langkah 4).

/** Kategori yang bisa dipilih di mode demo: sama dengan data bawaan buku baru, jadi cocok saat impor. */
export const DEMO_CATEGORIES = {
  expense: SEED_EXPENSE_CATEGORIES.map((c) => c.name),
  income: SEED_INCOME_CATEGORIES.map((c) => c.name),
} as const

const FALLBACK = { expense: "Hiburan", income: "Pemasukan lain" } as const

/** Idempotency-Key per transaksi demo: impor ulang tidak membuat transaksi ganda. */
export function demoImportKey(demoId: string): string {
  return `demo_${demoId.replace(/[^A-Za-z0-9_-]/g, "")}`.slice(0, 64)
}

/**
 * Ubah transaksi demo menjadi input transaksi buku.
 * Kategori dicocokkan dengan nama (tanpa beda huruf besar/kecil); bila tidak ada, pakai kategori cadangan,
 * lalu kategori pertama sejenis. Transaksi tanpa kategori sejenis sama sekali masuk `skipped`
 * supaya tetap disimpan di perangkat, tidak hilang diam-diam.
 */
export function demoToImport(
  rows: readonly DemoTransaction[],
  book: { walletId: string; categories: readonly { id: string; name: string; kind: "income" | "expense" }[] },
): { items: { demoId: string; input: CreateTransactionInput; key: string }[]; skipped: DemoTransaction[] } {
  const byName = (kind: "income" | "expense", name: string) =>
    book.categories.find((c) => c.kind === kind && c.name.toLowerCase() === name.toLowerCase())
  const items: { demoId: string; input: CreateTransactionInput; key: string }[] = []
  const skipped: DemoTransaction[] = []
  for (const r of rows) {
    const cat =
      byName(r.type, r.categoryName) ??
      byName(r.type, FALLBACK[r.type]) ??
      book.categories.find((c) => c.kind === r.type)
    if (!cat) {
      skipped.push(r)
      continue
    }
    const input: CreateTransactionInput = {
      type: r.type,
      amount: BigInt(r.amount),
      txDate: r.txDate,
      walletId: book.walletId,
      categoryId: cat.id,
      note: r.note ?? undefined,
    }
    items.push({ demoId: r.id, input, key: demoImportKey(r.id) })
  }
  return { items, skipped }
}

/** Ringkasan bulan berjalan untuk layar demo. */
export function demoTotals(rows: readonly DemoTransaction[], month: string): { income: bigint; expense: bigint } {
  let income = 0n
  let expense = 0n
  for (const r of rows) {
    if (!r.txDate.startsWith(month)) continue
    if (r.type === "income") income += BigInt(r.amount)
    else expense += BigInt(r.amount)
  }
  return { income, expense }
}
