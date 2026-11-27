import { describe, expect, test } from "bun:test"
import { educationPlan, futureCost } from "./education"

describe("dana pendidikan PB-09", () => {
  test("biaya masa depan dengan inflasi 12%", () => {
    expect(futureCost(150_000_000n, 1200, 0)).toBe(150_000_000n)
    expect(futureCost(150_000_000n, 1200, 1)).toBe(168_000_000n)
    // 150 jt × 1,12^2 = 188,16 jt
    expect(futureCost(150_000_000n, 1200, 2)).toBe(188_160_000n)
  })

  test("anak umur 3: semua jenjang akan datang, setoran TK dihitung dari bulan tersisa", () => {
    const plan = educationPlan({ birthYear: 2023, savings: 0n, inflationBp: 1200, today: "2026-11-27" })
    expect(plan.map((p) => p.status)).toEqual(["upcoming", "upcoming", "upcoming", "upcoming", "upcoming"])
    const tk = plan[0]
    // TK mulai Juli 2027, 1 tahun lagi: 5 jt × 1,12 = 5,6 jt; 8 bulan tersisa.
    expect(tk?.futureCost).toBe(5_600_000n)
    expect(tk?.monthsLeft).toBe(8)
    expect(tk?.monthly).toBe(700_000n)
  })

  test("tabungan dibagi berurutan, bukan dipakai ulang tiap jenjang (temuan no. 9)", () => {
    const plan = educationPlan({ birthYear: 2023, savings: 10_000_000n, inflationBp: 1200, today: "2026-11-27" })
    expect(plan[0]?.allocated).toBe(5_600_000n)
    expect(plan[0]?.monthly).toBe(0n)
    expect(plan[1]?.allocated).toBe(4_400_000n)
    expect(plan[2]?.allocated).toBe(0n)
    const total = plan.reduce((s, p) => s + p.allocated, 0n)
    expect(total).toBe(10_000_000n)
  })

  test("status jenjang sesuai umur", () => {
    const plan = educationPlan({ birthYear: 2013, savings: 0n, inflationBp: 1200, today: "2026-11-27" })
    // Umur 13: TK & SD selesai, SMP berjalan.
    expect(plan.map((p) => p.status)).toEqual(["done", "done", "ongoing", "upcoming", "upcoming"])
    expect(plan[2]?.monthly).toBeNull()
  })
})
