// CSV untuk Excel/Google Sheets (FR-22, NFR-08). UTF-8 + BOM, baris CRLF.

/** Satu sel: formula spreadsheet dinetralkan (CSV injection) dan dikutip bila memuat pemisah/kutip/baris baru. */
export function csvCell(v: unknown, sep = ","): string {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return safe.includes(sep) || /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** Seluruh berkas. BOM supaya Excel membaca UTF-8. */
export function toCsv(header: string[], rows: unknown[][], sep = ","): string {
  const lines = [header, ...rows].map((r) => r.map((v) => csvCell(v, sep)).join(sep))
  return `﻿${lines.join("\r\n")}\r\n`
}
