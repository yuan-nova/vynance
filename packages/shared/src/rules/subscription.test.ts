import { describe, expect, test } from "bun:test"
import {
  billingDate,
  isBilledInMonth,
  isDueToday,
  monthlyCost,
  monthlyTotal,
  nextBillingDate,
  toIdr,
} from "./subscription"
import { recognizeService } from "./subscription-services"

describe("langganan BR-40, PB-05", () => {
  test("BR-40: bulanan apa adanya, tahunan ÷ 12 (contoh design/11 Asuransi Mobil)", () => {
    expect(monthlyCost({ cycle: "monthly", amountIdr: 86_900n })).toBe(86_900n)
    expect(monthlyCost({ cycle: "yearly", amountIdr: 5_400_000n })).toBe(450_000n)
    expect(
      monthlyTotal([
        { cycle: "monthly", amountIdr: 86_900n },
        { cycle: "monthly", amountIdr: 385_000n },
        { cycle: "monthly", amountIdr: 26_900n },
        { cycle: "monthly", amountIdr: 318_000n },
        { cycle: "monthly", amountIdr: 186_000n },
        { cycle: "yearly", amountIdr: 5_400_000n },
      ]),
    ).toBe(1_452_800n)
  })

  test("tanggal 31 di bulan pendek → tanggal terakhir", () => {
    expect(billingDate("2026-02", 31)).toBe("2026-02-28")
    expect(billingDate("2028-02", 31)).toBe("2028-02-29")
    expect(billingDate("2026-04", 31)).toBe("2026-04-30")
    expect(billingDate("2026-12", 3)).toBe("2026-12-03")
  })

  test("tahunan hanya di bulan tagihannya", () => {
    expect(isBilledInMonth({ cycle: "yearly", billingMonth: 3 }, "2026-03")).toBe(true)
    expect(isBilledInMonth({ cycle: "yearly", billingMonth: 3 }, "2026-04")).toBe(false)
  })

  test("jatuh tempo dan tagihan berikutnya", () => {
    const s = { cycle: "monthly" as const, billingDay: 3, billingMonth: null, startDate: "2026-01-01" }
    expect(nextBillingDate(s, "2026-11-27")).toBe("2026-12-03")
    expect(isDueToday(s, "2026-11-27")).toBe(true)
    expect(isDueToday(s, "2026-11-02")).toBe(false)
    expect(isDueToday({ ...s, startDate: "2026-11-10" }, "2026-11-27")).toBe(false)
    expect(nextBillingDate({ cycle: "yearly", billingDay: 31, billingMonth: 2 }, "2026-11-27")).toBe("2027-02-28")
  })

  test("konversi kurs (contoh ChatGPT Plus US$20 × 15.900)", () => {
    expect(toIdr("20", "15900")).toBe(318_000n)
    expect(toIdr("9.99", "15900.5")).toBe(158_846n)
    expect(toIdr("1500", "105")).toBe(157_500n)
  })

  test("pengenalan layanan", () => {
    expect(recognizeService("Spotify Family")?.key).toBe("spotify")
    expect(recognizeService("netflix premium")?.key).toBe("netflix")
    expect(recognizeService("Langganan koran")).toBeNull()
  })
})
