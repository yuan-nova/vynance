export type CategoryGroup<T> = {
  /** null = transaksi tanpa kategori (transfer, beli/jual aset). */
  categoryId: string | null
  kind: "income" | "expense" | "other"
  /** Pagu dari rencana bulanan (hanya kategori pengeluaran yang dialokasikan). */
  budget: bigint | null
  realized: bigint
  /** Rencana belum direalisasi di kategori ini (BR-64). */
  planned: bigint
  transactions: T[]
}

type Tx = { type: string; amount: string; categoryId: string | null }
type Planned = { categoryId: string | null; amount: string; sourceType: "income" | "subscription"; status: string }

/**
 * Mode Per kategori di daftar transaksi (PB-14). Kategori yang punya pagu atau rencana tetap tampil walau
 * belum ada transaksi. Urutan: pemasukan, pengeluaran (terbesar dulu), lalu tanpa kategori.
 */
export function groupTransactionsByCategory<T extends Tx>(
  txs: T[],
  opts: { budgets: ReadonlyMap<string, bigint>; planned: readonly Planned[] },
): CategoryGroup<T>[] {
  const groups = new Map<string, CategoryGroup<T>>()
  const get = (id: string | null, kind: CategoryGroup<T>["kind"]) => {
    const key = id ?? ""
    let g = groups.get(key)
    if (!g) {
      g = {
        categoryId: id,
        kind,
        budget: id ? (opts.budgets.get(id) ?? null) : null,
        realized: 0n,
        planned: 0n,
        transactions: [],
      }
      groups.set(key, g)
    }
    return g
  }
  for (const t of txs) {
    const kind = t.type === "income" ? "income" : t.type === "expense" ? "expense" : "other"
    const g = get(kind === "other" ? null : t.categoryId, kind)
    g.transactions.push(t)
    if (kind !== "other") g.realized += BigInt(t.amount)
  }
  for (const [id] of opts.budgets) get(id, "expense")
  for (const p of opts.planned) {
    if (p.status !== "pending" || !p.categoryId) continue
    get(p.categoryId, p.sourceType === "income" ? "income" : "expense").planned += BigInt(p.amount)
  }
  const rank = { income: 0, expense: 1, other: 2 }
  const size = (g: CategoryGroup<T>) => [g.realized, g.budget ?? 0n, g.planned].reduce((a, b) => (a > b ? a : b))
  return [...groups.values()].sort((a, b) => rank[a.kind] - rank[b.kind] || Number(size(b) - size(a)))
}
