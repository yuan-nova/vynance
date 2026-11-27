import { describe, expect, test } from "bun:test"
import { notificationText, reachedThresholds } from "./notification"

describe("peringatan anggaran BR-11", () => {
  test("ambang 90% dan 100%", () => {
    expect(reachedThresholds(1_000n, 899n)).toEqual([])
    expect(reachedThresholds(1_000n, 900n)).toEqual([9000])
    expect(reachedThresholds(1_000n, 1_000n)).toEqual([9000, 10_000])
    expect(reachedThresholds(0n, 500n)).toEqual([])
  })

  test("teks tanpa nominal", () => {
    const t = notificationText({
      kind: "budget_alert",
      data: { category: "Makan", month: "2026-11", threshold: "9000", pct: "95" },
    })
    expect(t.title).toBe("Anggaran Makan hampir habis")
    expect(t.body).toBe("Pengeluaran Makan sudah 95% dari anggaran November 2026.")
    expect(`${t.title}${t.body}`).not.toMatch(/Rp/)
  })
})
