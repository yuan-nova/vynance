import { z } from "zod"

// Tanggal bisnis memakai zona Asia/Jakarta (UTC+7, tanpa DST). Waktu "sekarang" selalu dikirim sebagai parameter.

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const

export const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const

export const DAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const

/** Bulan "YYYY-MM". */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Format bulan YYYY-MM")
export type Month = string

type Ymd = { year: number; month: number; day: number }

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function parseDateOnly(s: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

/** Tanggal "YYYY-MM-DD" (kolom DATE). */
export const dateOnlySchema = z.string().refine((s) => parseDateOnly(s) !== null, "Tanggal tidak valid (YYYY-MM-DD)")
export type DateOnly = string

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

function jakartaParts(instant: Date): Ymd & { hour: number; minute: number } {
  const d = new Date(instant.getTime() + JAKARTA_OFFSET_MS)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  }
}

function splitMonth(month: Month): { year: number; month: number } {
  return { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) }
}

/** Bulan Asia/Jakarta dari sebuah waktu. */
export function monthOf(instant: Date): Month {
  const p = jakartaParts(instant)
  return `${p.year}-${pad(p.month)}`
}

/** Tanggal Asia/Jakarta "YYYY-MM-DD" dari sebuah waktu. */
export function dateOnlyOf(instant: Date): DateOnly {
  const p = jakartaParts(instant)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

export function monthOfDate(date: DateOnly): Month {
  return date.slice(0, 7)
}

export function addMonths(month: Month, delta: number): Month {
  const p = splitMonth(month)
  const idx = p.year * 12 + (p.month - 1) + delta
  return `${Math.floor(idx / 12)}-${pad((((idx % 12) + 12) % 12) + 1)}`
}

/** Rentang UTC [start, end) untuk satu bulan Asia/Jakarta. */
export function monthRangeUtc(month: Month): { start: Date; end: Date } {
  const p = splitMonth(month)
  return {
    start: new Date(Date.UTC(p.year, p.month - 1, 1) - JAKARTA_OFFSET_MS),
    end: new Date(Date.UTC(p.year, p.month, 1) - JAKARTA_OFFSET_MS),
  }
}

/** Tanggal pertama dan terakhir (inklusif) sebuah bulan, untuk kolom DATE. */
export function monthDateRange(month: Month): { from: DateOnly; to: DateOnly } {
  const p = splitMonth(month)
  return { from: `${month}-01`, to: `${month}-${pad(daysInMonth(p.year, p.month))}` }
}

/** "November 2026" */
export function formatMonth(month: Month): string {
  const p = splitMonth(month)
  return `${MONTH_NAMES_ID[p.month - 1]} ${p.year}`
}

/** "26 Nov 2026" */
export function formatDate(date: DateOnly): string {
  const p = parseDateOnly(date)
  if (!p) return date
  return `${p.day} ${MONTH_SHORT_ID[p.month - 1]} ${p.year}`
}

/** "26 Nov" */
export function formatDateShort(date: DateOnly): string {
  const p = parseDateOnly(date)
  if (!p) return date
  return `${p.day} ${MONTH_SHORT_ID[p.month - 1]}`
}

/** "Kamis, 26 November 2026" */
export function formatDateLong(date: DateOnly): string {
  const p = parseDateOnly(date)
  if (!p) return date
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
  return `${DAY_NAMES_ID[weekday]}, ${p.day} ${MONTH_NAMES_ID[p.month - 1]} ${p.year}`
}

/** Jam "14.30" WIB. */
export function formatTime(instant: Date): string {
  const p = jakartaParts(instant)
  return `${pad(p.hour)}.${pad(p.minute)}`
}
