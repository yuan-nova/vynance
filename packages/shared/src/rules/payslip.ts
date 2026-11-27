import { parseRupiah } from "./scan"

// Slip gaji (PB-10, FR-140): baca teks PDF slip menjadi periode, bruto, potongan, neto. Deterministik dan bisa diuji.

export type ParsedPayslip = {
  period: string | null
  gross: bigint | null
  deductions: bigint | null
  net: bigint | null
}

const MONTH_WORDS: [RegExp, string][] = [
  [/^jan/, "01"],
  [/^feb|^peb/, "02"],
  [/^mar/, "03"],
  [/^apr/, "04"],
  [/^mei|^may/, "05"],
  [/^jun/, "06"],
  [/^jul/, "07"],
  [/^agu|^agt|^aug/, "08"],
  [/^sep/, "09"],
  [/^okt|^oct/, "10"],
  [/^nov|^nop/, "11"],
  [/^des|^dec/, "12"],
]

const PERIOD_LABEL = /\b(periode|period|bulan|month|masa\s*kerja|pay\s*period)\b/i
const GROSS =
  /\b(gaji\s*kotor|penghasilan\s*(bruto|kotor)|total\s*(pendapatan|penghasilan|penerimaan|earnings?)|gross(\s*pay|\s*salary)?|bruto)\b/i
const DEDUCTIONS = /\b(total\s*(potongan|deductions?)|jumlah\s*potongan|potongan)\b/i
const NET =
  /\b(gaji\s*bersih|take\s*home\s*pay|thp|penerimaan\s*bersih|penghasilan\s*bersih|net\s*(pay|salary)|netto|jumlah\s*diterima|total\s*diterima)\b/i

function monthOfWord(w: string): string | null {
  const lw = w.toLowerCase()
  for (const [re, m] of MONTH_WORDS) if (re.test(lw)) return m
  return null
}

/** Periode "YYYY-MM" dari "Periode: Oktober 2026", "Bulan 10/2026", atau "Oct-2026". */
export function parsePeriod(text: string): string | null {
  const lines = text.split(/\r?\n/)
  const ordered = [...lines.filter((l) => PERIOD_LABEL.test(l)), ...lines]
  for (const line of ordered) {
    const word = line.match(/\b([A-Za-z]{3,9})[\s.-]+(\d{4})\b/)
    if (word) {
      const m = monthOfWord(word[1] ?? "")
      if (m) return `${word[2]}-${m}`
    }
    const num = line.match(/\b(\d{1,2})[/.-](\d{4})\b/)
    if (num && Number(num[1]) >= 1 && Number(num[1]) <= 12) return `${num[2]}-${(num[1] ?? "").padStart(2, "0")}`
  }
  return null
}

/** Nominal terakhir di baris berlabel (kolom nilai biasanya paling kanan). */
function amountOn(lines: string[], label: RegExp, exclude?: RegExp): bigint | null {
  for (const line of lines) {
    if (!label.test(line) || exclude?.test(line)) continue
    const tail = line.replace(label, " ")
    const found = [...tail.matchAll(/(rp\.?\s*)?\d{1,3}([.,]\d{3})+([.,]\d{2})?|\d{4,}/gi)].map((m) => m[0])
    const last = found.at(-1)
    const v = last ? parseRupiah(last) : null
    if (v !== null && v > 0n) return v
  }
  return null
}

/**
 * Baca slip gaji. Neto yang tidak tertulis dihitung bruto − potongan; potongan yang tidak tertulis dihitung bruto − neto.
 * Hasil selalu ditinjau pengguna sebelum disimpan.
 */
export function parsePayslip(text: string): ParsedPayslip {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const gross = amountOn(lines, GROSS)
  const net = amountOn(lines, NET)
  let deductions = amountOn(lines, DEDUCTIONS, NET)
  if (deductions === null && gross !== null && net !== null && gross >= net) deductions = gross - net
  return {
    period: parsePeriod(text),
    gross,
    deductions,
    net: net ?? (gross !== null && deductions !== null && gross >= deductions ? gross - deductions : null),
  }
}

/** Tren 12 slip terakhir (urut periode naik) dengan % perubahan neto dari slip sebelumnya, dalam basis poin. */
export function payslipTrend<T extends { period: string; net: bigint }>(
  rows: readonly T[],
): (T & { changeBp: number | null })[] {
  const sorted = [...rows].sort((a, b) => a.period.localeCompare(b.period)).slice(-12)
  return sorted.map((r, i) => {
    const prev = sorted[i - 1]
    const changeBp = prev && prev.net > 0n ? Number(((r.net - prev.net) * 10_000n) / prev.net) : null
    return { ...r, changeBp }
  })
}
