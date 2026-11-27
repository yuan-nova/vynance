import { describe, expect, test } from "bun:test"
import { parsePayslip, parsePeriod, payslipTrend } from "./payslip"

const SAMPLE = `PT Contoh Sejahtera
SLIP GAJI KARYAWAN
Nama : Budi Santoso
Periode : Oktober 2026
PENDAPATAN
Gaji Pokok Rp 10.000.000
Tunjangan Transport Rp 1.500.000
Tunjangan Makan Rp 1.000.000
Total Pendapatan Rp 12.500.000
POTONGAN
BPJS Kesehatan Rp 100.000
BPJS Ketenagakerjaan Rp 200.000
PPh 21 Rp 450.000
Total Potongan Rp 750.000
Gaji Bersih (Take Home Pay) Rp 11.750.000`

describe("slip gaji PB-10", () => {
  test("slip contoh terbaca benar", () => {
    expect(parsePayslip(SAMPLE)).toEqual({
      period: "2026-10",
      gross: 12_500_000n,
      deductions: 750_000n,
      net: 11_750_000n,
    })
  })

  test("format Inggris dengan desimal dan periode angka", () => {
    const t = "Pay Period: 09/2026\nGross Pay 15,000,000.00\nTotal Deductions 1,250,000.00\nNet Pay 13,750,000.00"
    expect(parsePayslip(t)).toEqual({ period: "2026-09", gross: 15_000_000n, deductions: 1_250_000n, net: 13_750_000n })
  })

  test("potongan dihitung dari bruto − neto bila tidak tertulis", () => {
    const t = "Bulan Nov 2026\nGaji Kotor 8.000.000\nTake Home Pay 7.600.000"
    expect(parsePayslip(t)).toEqual({ period: "2026-11", gross: 8_000_000n, deductions: 400_000n, net: 7_600_000n })
  })

  test("periode dari kata bulan", () => {
    expect(parsePeriod("Periode Agustus 2026")).toBe("2026-08")
    expect(parsePeriod("tanpa periode")).toBeNull()
  })

  test("tren: urut periode, maksimal 12, % perubahan neto", () => {
    // 14 slip: Jan 2025 – Feb 2026, neto naik 100 rb tiap bulan, urutan input dibalik.
    const rows = Array.from({ length: 14 }, (_, i) => {
      const y = i < 12 ? 2025 : 2026
      return { period: `${y}-${String((i % 12) + 1).padStart(2, "0")}`, net: 10_000_000n + BigInt(i) * 100_000n }
    }).reverse()
    const t = payslipTrend(rows)
    expect(t).toHaveLength(12)
    expect(t[0]?.period).toBe("2025-03")
    expect(t[0]?.changeBp).toBeNull()
    // 10.200.000 → 10.300.000 = +0,98%
    expect(t[1]?.changeBp).toBe(98)
  })
})
