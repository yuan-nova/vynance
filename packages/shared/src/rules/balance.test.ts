import { describe, expect, test } from "bun:test"
import { limitUsageBp, txEffect, walletBalances, wealthSummary } from "./balance"

describe("txEffect (PB-02)", () => {
  test("masuk +, keluar −, beli aset −, jual aset +", () => {
    expect(txEffect("income", "from", 100n)).toBe(100n)
    expect(txEffect("expense", "from", 100n)).toBe(-100n)
    expect(txEffect("asset_buy", "from", 100n)).toBe(-100n)
    expect(txEffect("asset_sell", "from", 100n)).toBe(100n)
  })
  test("transfer: sumber −, tujuan +", () => {
    expect(txEffect("transfer", "from", 100n)).toBe(-100n)
    expect(txEffect("transfer", "to", 100n)).toBe(100n)
    expect(txEffect("expense", "to", 100n)).toBe(0n)
  })
})

describe("BR-01 saldo rekening", () => {
  test("saldo awal + Σ efek", () => {
    const b = walletBalances(
      [
        { id: "bca", openingBalance: 10_000_000n },
        { id: "tunai", openingBalance: 500_000n },
      ],
      [
        { walletId: "bca", type: "income", direction: "from", total: 8_000_000n },
        { walletId: "bca", type: "expense", direction: "from", total: 1_250_000n },
        { walletId: "bca", type: "transfer", direction: "from", total: 300_000n },
        { walletId: "tunai", type: "transfer", direction: "to", total: 300_000n },
        { walletId: "lain", type: "income", direction: "from", total: 1n },
      ],
    )
    expect(b.get("bca")).toBe(16_450_000n)
    expect(b.get("tunai")).toBe(800_000n)
    expect(b.has("lain")).toBe(false)
  })
})

describe("BR-02…BR-04 ringkasan", () => {
  test("PayLater dan kartu kredit adalah utang, bukan kas (BR-03)", () => {
    const s = wealthSummary(
      [
        { type: "bank", balance: 28_640_000n },
        { type: "ewallet", balance: 1_240_000n },
        { type: "cash", balance: 850_000n },
        { type: "rdn", balance: 2_450_000n },
        { type: "credit_card", balance: -6_200_000n },
        { type: "paylater", balance: -2_250_000n },
      ],
      15_000_000n,
    )
    expect(s.cash).toBe(33_180_000n)
    expect(s.debt).toBe(-8_450_000n)
    expect(s.netWorth).toBe(33_180_000n + 15_000_000n - 8_450_000n)
  })
})

describe("BR-05 pemakaian limit", () => {
  test("41% dari Rp15 jt", () => expect(limitUsageBp(-6_200_000n, 15_000_000n)).toBe(4133))
  test("lebih bayar = 0", () => expect(limitUsageBp(100n, 5_000_000n)).toBe(0))
  test("tanpa limit = null", () => expect(limitUsageBp(-1n, null)).toBeNull())
})
