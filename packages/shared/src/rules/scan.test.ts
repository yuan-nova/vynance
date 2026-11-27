import { describe, expect, test } from "bun:test"
import { detectDocType, guessCategory, parseDate, parseRupiah, parseScanText } from "./scan"

const INDOMARET = `INDOMARET
JL. MELATI NO 12 JAKARTA
27.11.2026-08:15 2.0.25 KSR01
INDOMIE GORENG      5 x 3.100   15.500
SUSU UHT 1L         1 x 18.900  18.900
ROTI TAWAR          1 x 15.900  15.900
SUBTOTAL                        50.300
TOTAL BELANJA                   50.300
TUNAI                          100.000
KEMBALIAN                       49.700`

const MUTASI = `MUTASI REKENING
25/11 TRF BI-FAST GAJI PT MAJU 15.000.000 CR
26/11 PLN PREPAID TOKEN 202.500 DB
27/11 GOJEK GORIDE 24.000 DB`

describe("scan struk/mutasi PB-03", () => {
  test("struk Indomaret contoh menjadi transaksi Belanja Bulanan", () => {
    const r = parseScanText(INDOMARET, "2026")
    expect(r.docType).toBe("receipt")
    expect(r.rows).toEqual([
      { txDate: "2026-11-27", amount: 50_300n, direction: "out", note: "INDOMARET", categoryName: "Belanja Bulanan" },
    ])
  })

  test("mutasi bank dipecah per baris dengan arah DB/CR", () => {
    const r = parseScanText(MUTASI, "2026")
    expect(r.docType).toBe("bank_statement")
    expect(r.rows.map((x) => [x.txDate, x.amount, x.direction, x.categoryName])).toEqual([
      ["2026-11-25", 15_000_000n, "in", "Gaji"],
      ["2026-11-26", 202_500n, "out", "Listrik & Air"],
      ["2026-11-27", 24_000n, "out", "Transportasi"],
    ])
  })

  test("angka, tanggal, kategori, jenis dokumen", () => {
    expect(parseRupiah("Rp 1.250.000,00")).toBe(1_250_000n)
    expect(parseRupiah("54,300")).toBe(54_300n)
    expect(parseRupiah("tanpa angka")).toBeNull()
    expect(parseDate("Tgl 27 Nov 2026")).toBe("2026-11-27")
    expect(parseDate("01-02-26")).toBe("2026-02-01")
    expect(guessCategory("NETFLIX.COM")).toBe("Langganan")
    expect(guessCategory("Toko kelontong")).toBeNull()
    expect(detectDocType("Riwayat GoPay QRIS")).toBe("ewallet")
  })
})
