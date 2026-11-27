import { describe, expect, test } from "bun:test"
import { formatMoney, formatMoneyShort, moneySchema, parseMoney, positiveMoneySchema } from "./money"

describe("formatMoney", () => {
  test("nol", () => expect(formatMoney(0n)).toBe("Rp0"))
  test("ribuan", () => expect(formatMoney(1_250_000n)).toBe("Rp1.250.000"))
  test("negatif memakai U+2212", () => expect(formatMoney(-287_500n)).toBe("−Rp287.500"))
  test("13 digit", () => expect(formatMoney(1_234_567_890_123n)).toBe("Rp1.234.567.890.123"))
  test("tanda masuk/keluar", () => {
    expect(formatMoney(5000n, "income")).toBe("+Rp5.000")
    expect(formatMoney(5000n, "expense")).toBe("−Rp5.000")
    expect(formatMoney(-5000n, "none")).toBe("Rp5.000")
  })
})

describe("formatMoneyShort", () => {
  test("juta", () => expect(formatMoneyShort(42_350_000n)).toBe("Rp42,3 jt"))
  test("miliar", () => expect(formatMoneyShort(1_234_000_000n)).toBe("Rp1,2 M"))
  test("ribu bulat", () => expect(formatMoneyShort(250_000n)).toBe("Rp250 rb"))
  test("kecil", () => expect(formatMoneyShort(999n)).toBe("Rp999"))
  test("negatif", () => expect(formatMoneyShort(-1_500_000n)).toBe("−Rp1,5 jt"))
  test("nol", () => expect(formatMoneyShort(0n)).toBe("Rp0"))
})

describe("parseMoney", () => {
  test("angka polos", () => expect(parseMoney("1500000")).toBe(1_500_000n))
  test("titik ribuan dan Rp", () => expect(parseMoney("Rp 1.500.000")).toBe(1_500_000n))
  test("singkatan", () => {
    expect(parseMoney("1,5jt")).toBe(1_500_000n)
    expect(parseMoney("250rb")).toBe(250_000n)
    expect(parseMoney("2 jt")).toBe(2_000_000n)
  })
  test("13 digit", () => expect(parseMoney("1234567890123")).toBe(1_234_567_890_123n))
  test("negatif", () => expect(parseMoney("-5000")).toBe(-5000n))
  test("tidak valid", () => {
    expect(parseMoney("")).toBeNull()
    expect(parseMoney("abc")).toBeNull()
    expect(parseMoney("1,5")).toBeNull()
    expect(parseMoney("1.50")).toBeNull()
  })
})

describe("moneySchema", () => {
  test("string → bigint", () => expect(moneySchema.parse("287500")).toBe(287_500n))
  test("menolak desimal", () => expect(moneySchema.safeParse("1.5").success).toBe(false))
  test("positif", () => {
    expect(positiveMoneySchema.safeParse("0").success).toBe(false)
    expect(positiveMoneySchema.parse("1")).toBe(1n)
  })
})
