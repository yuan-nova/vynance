import { describe, expect, test } from "bun:test"
import { bookCodeFromBytes, checkBookCode, formatBookCode, normalizeBookCode } from "./book-code"

describe("kode buku (BR-48)", () => {
  test("format XXXX-XXXX", () => expect(formatBookCode("K7QM3XPA")).toBe("K7QM-3XPA"))
  test("normalisasi ketikan", () => expect(normalizeBookCode(" k7qm-3xpa ")).toBe("K7QM3XPA"))
  test("valid", () => expect(checkBookCode("K7QM-3XPA")).toEqual({ ok: true }))
  test("menolak I, L, O, U", () => {
    for (const bad of ["K7QM3XPI", "K7QM3XPL", "K7QM3XPO", "K7QM3XPU"]) expect(checkBookCode(bad).ok).toBe(false)
  })
  test("menolak panjang salah", () => expect(checkBookCode("K7QM3XP").ok).toBe(false))
  test("dari byte hanya memakai alfabet", () => {
    const code = bookCodeFromBytes(new Uint8Array([0, 31, 32, 255, 18, 21, 24, 27]))
    expect(code).toHaveLength(8)
    expect(checkBookCode(code).ok).toBe(true)
    expect(code).toBe("0Z0ZJNRV")
  })
})
