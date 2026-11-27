import { describe, expect, test } from "bun:test"
import { changeBp, ratio, topSlices } from "./charts"

describe("grafik Beranda FR-52", () => {
  test("donut maksimal 5 irisan + Lainnya, urut terbesar, nol dibuang", () => {
    const items = ["A", "B", "C", "D", "E", "F", "G"].map((name, i) => ({ name, amount: BigInt((i + 1) * 100) }))
    items.push({ name: "Nol", amount: 0n })
    expect(topSlices(items).map((s) => [s.name, s.amount])).toEqual([
      ["G", 700n],
      ["F", 600n],
      ["E", 500n],
      ["D", 400n],
      ["C", 300n],
      ["Lainnya", 300n],
    ])
    expect(topSlices(items.slice(0, 3))).toHaveLength(3)
  })

  test("perubahan bulan ini vs lalu dan rasio batang", () => {
    expect(changeBp(120n, 100n)).toBe(2000)
    expect(changeBp(80n, 100n)).toBe(-2000)
    expect(changeBp(5n, 0n)).toBeNull()
    expect(ratio(50n, 200n)).toBe(0.25)
    expect(ratio(10n, 0n)).toBe(0)
  })
})
