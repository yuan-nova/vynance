import { describe, expect, test } from "bun:test"
import { newId } from "./id"
import { logger } from "./logger"

describe("newId", () => {
  test("26 karakter Crockford dan urut waktu", () => {
    const a = newId(1_700_000_000_000)
    const b = newId(1_700_000_000_001)
    expect(a).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
    expect(a.slice(0, 10) < b.slice(0, 10)).toBe(true)
  })
})

describe("logger.redact", () => {
  test("menyamarkan nominal, catatan, email", () => {
    expect(logger.redact({ amount: "5000", note: "makan", user: { email: "a@b.c" }, path: "/x" })).toEqual({
      amount: "[redacted]",
      note: "[redacted]",
      user: { email: "[redacted]" },
      path: "/x",
    })
  })
})
