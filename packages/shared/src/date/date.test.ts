import { describe, expect, test } from "bun:test"
import {
  addMonths,
  dateOnlyOf,
  dateOnlySchema,
  formatDate,
  formatDateLong,
  formatDateShort,
  formatDateWeekdayShort,
  formatMonth,
  formatRelative,
  formatTime,
  monthDateRange,
  monthOf,
  monthRangeUtc,
  monthSchema,
} from "./date"

describe("monthOf (Asia/Jakarta)", () => {
  test("pergantian bulan tengah malam WIB", () => {
    expect(monthOf(new Date("2026-11-30T16:59:59.999Z"))).toBe("2026-11")
    expect(monthOf(new Date("2026-11-30T17:00:00Z"))).toBe("2026-12")
  })
  test("pergantian tahun", () => expect(monthOf(new Date("2026-12-31T17:00:00Z"))).toBe("2027-01"))
  test("dateOnlyOf", () => expect(dateOnlyOf(new Date("2026-11-26T18:00:00Z"))).toBe("2026-11-27"))
})

describe("rentang bulan", () => {
  test("monthRangeUtc", () => {
    const r = monthRangeUtc("2026-11")
    expect(r.start.toISOString()).toBe("2026-10-31T17:00:00.000Z")
    expect(r.end.toISOString()).toBe("2026-11-30T17:00:00.000Z")
  })
  test("monthDateRange Februari kabisat", () => {
    expect(monthDateRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" })
  })
  test("addMonths", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01")
    expect(addMonths("2026-01", -1)).toBe("2025-12")
    expect(addMonths("2026-06", -6)).toBe("2025-12")
  })
})

describe("format", () => {
  test("bulan", () => expect(formatMonth("2026-11")).toBe("November 2026"))
  test("tanggal", () => {
    expect(formatDate("2026-11-26")).toBe("26 Nov 2026")
    expect(formatDateShort("2026-11-26")).toBe("26 Nov")
    expect(formatDateLong("2026-11-26")).toBe("Kamis, 26 November 2026")
    expect(formatDateWeekdayShort("2026-11-26")).toBe("Kamis, 26 Nov")
  })
  test("jam WIB", () => expect(formatTime(new Date("2026-11-26T07:30:00Z"))).toBe("14.30"))
})

describe("skema", () => {
  test("monthSchema", () => {
    expect(monthSchema.safeParse("2026-11").success).toBe(true)
    expect(monthSchema.safeParse("2026-13").success).toBe(false)
  })
  test("dateOnlySchema", () => {
    expect(dateOnlySchema.safeParse("2026-02-29").success).toBe(false)
    expect(dateOnlySchema.safeParse("2028-02-29").success).toBe(true)
  })
})

test("formatRelative", () => {
  const now = new Date("2026-11-27T10:00:00Z")
  expect(formatRelative(new Date("2026-11-27T09:59:40Z"), now)).toBe("baru saja")
  expect(formatRelative(new Date("2026-11-27T09:50:00Z"), now)).toBe("10 mnt lalu")
  expect(formatRelative(new Date("2026-11-27T07:00:00Z"), now)).toBe("3 jam lalu")
  expect(formatRelative(new Date("2026-11-23T03:00:00Z"), now)).toBe(formatDateShort("2026-11-23"))
})
