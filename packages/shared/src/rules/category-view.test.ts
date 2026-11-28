import { expect, test } from "bun:test"
import { groupTransactionsByCategory } from "./category-view"

test("kelompok per kategori dengan pagu, realisasi, dan rencana belum direalisasi", () => {
  const txs = [
    { id: "1", type: "expense", amount: "50000", categoryId: "MAKAN" },
    { id: "2", type: "expense", amount: "30000", categoryId: "MAKAN" },
    { id: "3", type: "income", amount: "1000", categoryId: "GAJI" },
    { id: "4", type: "transfer", amount: "999", categoryId: null },
  ]
  const groups = groupTransactionsByCategory(txs, {
    budgets: new Map([
      ["MAKAN", 100_000n],
      ["LISTRIK", 400_000n],
    ]),
    planned: [
      { categoryId: "GAJI", amount: "5000", sourceType: "income", status: "pending" },
      { categoryId: "LANGGANAN", amount: "186000", sourceType: "subscription", status: "pending" },
      { categoryId: "LANGGANAN", amount: "1", sourceType: "subscription", status: "skipped" },
    ],
  })
  expect(groups.map((g) => [g.categoryId, g.kind, g.budget, g.realized, g.planned, g.transactions.length])).toEqual([
    ["GAJI", "income", null, 1000n, 5000n, 1],
    ["LISTRIK", "expense", 400_000n, 0n, 0n, 0],
    ["LANGGANAN", "expense", null, 0n, 186_000n, 0],
    ["MAKAN", "expense", 100_000n, 80_000n, 0n, 2],
    [null, "other", null, 0n, 0n, 1],
  ])
})
