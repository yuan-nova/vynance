import { describe, expect, test } from "bun:test"
import { invitationStatus } from "./invitation"

const now = new Date("2026-11-27T10:00:00Z")
const later = new Date("2026-12-04T10:00:00Z")

describe("status undangan BR-50", () => {
  test("aktif sebelum kedaluwarsa", () => {
    expect(invitationStatus({ revokedAt: null, usedAt: null, expiresAt: later }, now)).toBe("active")
  })
  test("kedaluwarsa tepat di batas", () => {
    expect(invitationStatus({ revokedAt: null, usedAt: null, expiresAt: now }, now)).toBe("expired")
  })
  test("dipakai mengalahkan kedaluwarsa, dibatalkan mengalahkan semua", () => {
    expect(invitationStatus({ revokedAt: null, usedAt: now, expiresAt: now }, later)).toBe("used")
    expect(invitationStatus({ revokedAt: now, usedAt: now, expiresAt: later }, now)).toBe("revoked")
  })
})
