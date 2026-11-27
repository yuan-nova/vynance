import { describe, expect, test } from "bun:test"
import { pickActiveBook } from "./active-book"

describe("pickActiveBook (DS-NAV-04, BR-54)", () => {
  const books = [{ id: "a" }, { id: "b" }]
  test("buku terakhir", () => expect(pickActiveBook(books, "b")?.id).toBe("b"))
  test("buku terakhir sudah bukan anggota → buku pertama", () => expect(pickActiveBook(books, "x")?.id).toBe("a"))
  test("tanpa buku → null", () => expect(pickActiveBook([], "a")).toBeNull())
})
