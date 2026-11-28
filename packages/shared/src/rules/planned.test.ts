import { describe, expect, test } from "bun:test"
import { plannedIdempotencyKey, plannedItemsFor } from "./planned"

const inc = { id: "I1", name: "Gaji", monthlyAmount: 10_000_000n, categoryId: "C1", createdMonth: "2026-10" }
const sub = {
  id: "S1",
  name: "Netflix",
  amountIdr: 186_000n,
  cycle: "monthly" as const,
  billingDay: 31,
  billingMonth: null,
  startDate: "2026-11-10",
  walletId: "W1",
  categoryId: null,
}

describe("plannedItemsFor", () => {
  test("penghasilan rutin dan langganan bulan itu, urut tanggal", () => {
    const items = plannedItemsFor("2026-11", { incomes: [inc], subscriptions: [sub] }, [])
    expect(items.map((i) => [i.sourceType, i.dueDate, i.status])).toEqual([
      ["income", "2026-11-01", "pending"],
      ["subscription", "2026-11-30", "pending"],
    ])
  })
  test("sebelum sumber dibuat / langganan mulai tidak ada rencana", () => {
    expect(plannedItemsFor("2026-09", { incomes: [inc], subscriptions: [] }, [])).toEqual([])
    const late = { ...sub, startDate: "2026-11-30", billingDay: 5 }
    expect(plannedItemsFor("2026-11", { incomes: [], subscriptions: [late] }, [])).toEqual([])
  })
  test("langganan tahunan hanya di bulan tagihannya", () => {
    const y = { ...sub, cycle: "yearly" as const, billingMonth: 12, startDate: "2026-01-01" }
    expect(plannedItemsFor("2026-11", { incomes: [], subscriptions: [y] }, [])).toHaveLength(0)
    expect(plannedItemsFor("2026-12", { incomes: [], subscriptions: [y] }, [])).toHaveLength(1)
  })
  test("status: direalisasi, dilewati, dan kembali belum bila transaksinya dihapus", () => {
    const base = { sourceType: "income" as const, sourceId: "I1", transactionId: "T1" }
    const st = (r: Parameters<typeof plannedItemsFor>[2]) =>
      plannedItemsFor("2026-11", { incomes: [inc], subscriptions: [] }, r)[0]
    expect(st([{ ...base, status: "realized", transactionAlive: true }])).toMatchObject({
      status: "realized",
      transactionId: "T1",
    })
    expect(st([{ ...base, status: "realized", transactionAlive: false }])?.status).toBe("pending")
    expect(st([{ ...base, status: "skipped", transactionId: null, transactionAlive: false }])?.status).toBe("skipped")
  })
})

test("plannedIdempotencyKey lolos format Idempotency-Key dan beda per percobaan", () => {
  const k = plannedIdempotencyKey("subscription", "01JABCDEFGHJKMNPQRSTVWXYZ0", "2026-11", 0)
  expect(k).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
  expect(k).not.toBe(plannedIdempotencyKey("subscription", "01JABCDEFGHJKMNPQRSTVWXYZ0", "2026-11", 1))
})
