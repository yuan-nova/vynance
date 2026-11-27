import { describe, expect, test } from "bun:test"
import type { DemoTransaction } from "../types"
import { demoImportKey, demoToImport, demoTotals } from "./demo"

const rows: DemoTransaction[] = [
  { id: "a1", type: "expense", amount: "25000", txDate: "2026-11-27", categoryName: "Makan & Minum", note: "Bakso" },
  { id: "a2", type: "income", amount: "5000000", txDate: "2026-11-25", categoryName: "Gaji", note: null },
  { id: "a3", type: "expense", amount: "10000", txDate: "2026-10-01", categoryName: "Kategori Hilang", note: null },
]
const book = {
  walletId: "W1",
  categories: [
    { id: "C-food", name: "makan & minum", kind: "expense" as const },
    { id: "C-fun", name: "Hiburan", kind: "expense" as const },
    { id: "C-pay", name: "Gaji", kind: "income" as const },
  ],
}

describe("impor mode demo FR-151", () => {
  test("kategori dicocokkan dengan nama, cadangan Hiburan bila tidak ada", () => {
    const out = demoToImport(rows, book).items
    expect(out.map((o) => ("categoryId" in o.input ? o.input.categoryId : null))).toEqual(["C-food", "C-pay", "C-fun"])
    expect(out.every((o) => o.input.walletId === "W1")).toBe(true)
    expect(out[0]?.input.amount).toBe(25_000n)
  })

  test("kunci impor stabil per transaksi demo, jadi impor ulang tidak ganda", () => {
    const a = demoToImport(rows, book).items.map((o) => o.key)
    const b = demoToImport(rows, book).items.map((o) => o.key)
    expect(a).toEqual(b)
    expect(new Set(a).size).toBe(rows.length)
    expect(demoImportKey("01HX-abc")).toBe("demo_01HX-abc")
  })

  test("tanpa kategori sejenis di buku, transaksi dilewati tapi tidak hilang", () => {
    const r = demoToImport(rows, { walletId: "W1", categories: book.categories.filter((c) => c.kind === "expense") })
    expect(r.items.map((i) => i.demoId)).toEqual(["a1", "a3"])
    expect(r.skipped.map((s) => s.id)).toEqual(["a2"])
  })

  test("total bulan berjalan", () => {
    expect(demoTotals(rows, "2026-11")).toEqual({ income: 5_000_000n, expense: 25_000n })
  })
})
