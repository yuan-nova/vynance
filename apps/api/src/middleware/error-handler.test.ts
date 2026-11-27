import { describe, expect, test } from "bun:test"
import { safePath } from "./error-handler"

describe("safePath", () => {
  test("token undangan disamarkan di log", () => {
    const token = "lAe3GkpnCKy3ExGpM7OYt9pSs_xR8_t03_Oq4Fwuryk"
    expect(safePath(`/api/v1/invitations/${token}/accept`)).toBe("/api/v1/invitations/[token]/accept")
    expect(safePath("/api/v1/books/01ABC/wallets")).toBe("/api/v1/books/01ABC/wallets")
  })
})
