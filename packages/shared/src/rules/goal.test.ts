import { describe, expect, test } from "bun:test"
import { goalProgress, monthsBetween } from "./goal"

const base = {
  targetAmount: 54_000_000n,
  collected: 30_000_000n,
  targetDate: "2027-12-31",
  createdOn: "2026-01-10",
  recentContributions: [
    { month: "2026-09", amount: 2_000_000n },
    { month: "2026-10", amount: 2_000_000n },
    { month: "2026-11", amount: 2_000_000n },
  ],
  today: "2026-11-27",
}

describe("target tabungan BR-20 dan BR-21", () => {
  test("monthsBetween", () => {
    expect(monthsBetween("2026-11", "2027-12")).toBe(13)
    expect(monthsBetween("2026-11", "2026-10")).toBe(-1)
  })

  test("BR-20 contoh design/09: Dana Darurat Rp1.846.200/bln", () => {
    const p = goalProgress(base)
    expect(p.monthsLeft).toBe(13)
    expect(p.remaining).toBe(24_000_000n)
    expect(p.monthlyNeeded).toBe(1_846_200n)
    expect(p.percentBp).toBe(5555)
    expect(p.status).toBe("onTrack")
  })

  test("BR-21 Perlu perhatian hanya bila laju 3 bulan < kebutuhan (contoh Umroh)", () => {
    const p = goalProgress({
      ...base,
      targetAmount: 70_000_000n,
      collected: 18_500_000n,
      targetDate: "2028-10-01",
      recentContributions: [
        { month: "2026-09", amount: 1_200_000n },
        { month: "2026-10", amount: 1_200_000n },
        { month: "2026-11", amount: 1_200_000n },
      ],
    })
    expect(p.monthlyNeeded).toBe(2_239_100n)
    expect(p.pace).toBe(1_200_000n)
    expect(p.status).toBe("attention")
  })

  test("setoran di luar 3 bulan terakhir tidak dihitung", () => {
    const p = goalProgress({ ...base, recentContributions: [{ month: "2026-08", amount: 99_000_000n }] })
    expect(p.pace).toBe(0n)
    expect(p.status).toBe("attention")
  })

  test("target baru bulan ini tidak langsung Perlu perhatian", () => {
    expect(goalProgress({ ...base, createdOn: "2026-11-20", recentContributions: [] }).status).toBe("onTrack")
  })

  test("target umur 2 bulan: laju dibagi 2, bukan 3", () => {
    const p = goalProgress({
      ...base,
      createdOn: "2026-10-05",
      recentContributions: [{ month: "2026-11", amount: 3_000_000n }],
    })
    expect(p.pace).toBe(1_500_000n)
  })

  test("Tercapai mengalahkan tenggat", () => {
    const p = goalProgress({ ...base, collected: 60_000_000n, targetDate: "2026-01-01" })
    expect(p.status).toBe("achieved")
    expect(p.percentBp).toBe(10_000)
    expect(p.remaining).toBe(0n)
  })

  test("Lewat tenggat", () => {
    expect(goalProgress({ ...base, targetDate: "2026-11-26" }).status).toBe("overdue")
  })

  test("tanpa tanggal target: Sesuai jalur, tanpa setoran/bulan", () => {
    const p = goalProgress({ ...base, targetDate: null })
    expect(p.status).toBe("onTrack")
    expect(p.monthlyNeeded).toBeNull()
  })

  test("bulan target = bulan ini: seluruh sisa dibutuhkan bulan ini", () => {
    expect(goalProgress({ ...base, targetDate: "2026-11-30" }).monthlyNeeded).toBe(24_000_000n)
  })
})
