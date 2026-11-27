// Tambah Cepat (PB-03): pecah teks OCR struk/mutasi menjadi baris transaksi. Deterministik dan bisa diuji.

export type ScanDocType = "receipt" | "bank_statement" | "ewallet" | "unknown"
export type ScanRow = {
  txDate: string | null
  amount: bigint
  direction: "in" | "out"
  note: string
  categoryName: string | null
}

const RECEIPT_HINTS = /\b(total|tunai|kembali|kembalian|subtotal|ppn|kasir|struk|qty|harga)\b/i
const STATEMENT_HINTS = /\b(mutasi|saldo|db|cr|debet|kredit|transfer|trf|bi-fast)\b/i
const EWALLET_HINTS = /\b(gopay|ovo|dana|shopeepay|linkaja|qris)\b/i

/** Kata kunci → nama kategori bawaan (PB-03 langkah 3, BR-46). Urutan penting: yang lebih spesifik dulu. */
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [
    /gofood|grabfood|shopeefood|kfc|mcd|mcdonald|starbucks|janji jiwa|kopi|resto|warung|bakso|solaria|hokben|pizza/i,
    "Makan & Minum",
  ],
  [
    /indomaret|alfamart|alfamidi|superindo|hypermart|transmart|giant|lotte|hero|ranch market|lawson|family ?mart|circle ?k/i,
    "Belanja Bulanan",
  ],
  [
    /gojek|goride|gocar|grab|maxim|krl|commuter|transjakarta|mrt|lrt|pertamina|spbu|shell|bensin|parkir|tol\b|e-?toll/i,
    "Transportasi",
  ],
  [/\bpln\b|token listrik|listrik|pdam|air minum/i, "Listrik & Air"],
  [/netflix|spotify|youtube|disney|vidio|icloud|google one|chatgpt|indihome|biznet|first media/i, "Langganan"],
  [/apotek|kimia farma|guardian|century|klinik|rumah sakit|\brs\b|dokter|bpjs/i, "Kesehatan"],
  [/sekolah|spp|kursus|buku|gramedia|ruangguru/i, "Pendidikan"],
  [/zakat|infaq|infak|sedekah|baznas|dompet dhuafa/i, "Zakat & Infaq"],
  [/bioskop|cgv|xxi|cinepolis|tiket\.com|traveloka|steam|playstation/i, "Hiburan"],
  [/gaji|payroll|salary/i, "Gaji"],
]

export function guessCategory(text: string): string | null {
  for (const [re, name] of CATEGORY_KEYWORDS) if (re.test(text)) return name
  return null
}

export function detectDocType(text: string): ScanDocType {
  if (EWALLET_HINTS.test(text) && !RECEIPT_HINTS.test(text)) return "ewallet"
  if (RECEIPT_HINTS.test(text)) return "receipt"
  if (STATEMENT_HINTS.test(text)) return "bank_statement"
  return "unknown"
}

/** "54.300", "54,300", "Rp 1.250.000,00", "54300" → bigint rupiah; desimal ,00/.00 dibuang. */
export function parseRupiah(s: string): bigint | null {
  const m = s.replace(/rp\.?/gi, "").match(/\d[\d.,]*/)
  if (!m) return null
  let n = m[0]
  n = n.replace(/[.,]\d{2}$/, (frac) => (n.length - frac.length >= 4 || /[.,]/.test(n.slice(0, -3)) ? "" : frac))
  const digits = n.replace(/[.,]/g, "")
  if (!digits || digits.length > 13) return null
  return BigInt(digits)
}

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  mei: "05",
  may: "05",
  jun: "06",
  jul: "07",
  agu: "08",
  agt: "08",
  aug: "08",
  sep: "09",
  okt: "10",
  oct: "10",
  nov: "11",
  des: "12",
  dec: "12",
}

/** Tanggal pertama di teks: dd/mm/yyyy, dd-mm-yy, dd.mm.yyyy, atau "27 Nov 2026". */
export function parseDate(text: string): string | null {
  const num = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/)
  if (num) {
    const [, d = "", m = "", y = ""] = num
    const year = y.length === 2 ? `20${y}` : y
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    }
  }
  const word = text.match(/\b(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})\b/)
  if (word) {
    const [, d = "", mon = "", y = ""] = word
    const m = MONTHS[mon.toLowerCase()]
    if (m) return `${y}-${m}-${d.padStart(2, "0")}`
  }
  return null
}

const TOTAL_LINE = /\b(grand\s*total|total\s*belanja|total\s*bayar|total|jumlah|tagihan)\b/i
const NOT_TOTAL = /\b(sub\s*total|total\s*item|total\s*qty|total\s*disc|hemat)\b/i

function merchantOf(lines: string[]): string {
  const known = lines.find((l) => guessCategory(l))
  return (known ?? lines[0] ?? "Struk").trim().slice(0, 60)
}

/** Struk: satu baris uang keluar = total belanja, catatan = nama toko, kategori dari kata kunci. */
export function parseReceipt(text: string): ScanRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const totals = lines
    .filter((l) => TOTAL_LINE.test(l) && !NOT_TOTAL.test(l))
    .map((l) => parseRupiah(l.replace(TOTAL_LINE, "")))
    .filter((v): v is bigint => v !== null && v > 0n)
  const amount = totals.length ? totals.reduce((a, b) => (b > a ? b : a)) : null
  if (amount === null) return []
  const merchant = merchantOf(lines)
  return [{ txDate: parseDate(text), amount, direction: "out", note: merchant, categoryName: guessCategory(text) }]
}

const STATEMENT_LINE =
  /^(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?)\s+(.+?)\s+([+-]?\s?(?:rp\.?\s?)?[\d.,]+)\s*(db|cr|d|k)?$/i

/** Mutasi/e-wallet: satu baris per transaksi bertanggal; arah dari DB/CR atau tanda +/−. */
export function parseStatement(text: string, year: string): ScanRow[] {
  const rows: ScanRow[] = []
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.trim().match(STATEMENT_LINE)
    if (!m) continue
    const [, date = "", desc = "", amt = "", flag = ""] = m
    const amount = parseRupiah(amt)
    if (!amount || amount <= 0n) continue
    const parts = date.split(/[/.-]/)
    const fullDate = parseDate(parts.length === 2 ? `${date}/${year}` : date)
    const inbound = /^(cr|k)$/i.test(flag) || amt.trim().startsWith("+")
    rows.push({
      txDate: fullDate,
      amount,
      direction: inbound ? "in" : "out",
      note: desc.trim().slice(0, 60),
      categoryName: guessCategory(desc),
    })
  }
  return rows
}

/** Kenali dokumen lalu pecah ke baris (PB-03 langkah 2–3). */
export function parseScanText(text: string, fallbackYear: string): { docType: ScanDocType; rows: ScanRow[] } {
  const docType = detectDocType(text)
  const rows = docType === "receipt" ? parseReceipt(text) : parseStatement(text, fallbackYear)
  return { docType, rows: rows.length || docType !== "unknown" ? rows : parseReceipt(text) }
}
