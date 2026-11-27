import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { activityLogs, bookInvitations, bookMembers } from "@vynance/db"
import type { Book, CreatedInvitation, Invitation, InvitationPreview } from "@vynance/shared"
import { and, eq } from "drizzle-orm"
import {
  cleanupUsers,
  createTestBook,
  createTestUser,
  dataOf,
  jsonRequest,
  testBooksService,
  testDb,
} from "../../db/test-fixtures"
import { UnitOfWork } from "../../db/unit-of-work"
import { newId } from "../../lib/id"
import { hashInviteToken } from "../../lib/invite-token"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { InvitationsRepository } from "./invitations.repository"
import { InvitationsService } from "./invitations.service"

// BR-50, TSD §5.4: token acak, hash di DB, 7 hari, sekali pakai, bisa dibatalkan, anggota tidak diundang lagi.
const A = "01JTESTINVITEAAAAAAAAAAAAA"
const B = "01JTESTINVITEBBBBBBBBBBBBB"
const C = "01JTESTINVITECCCCCCCCCCCCC"
let now = new Date()
const invitationsService = new InvitationsService({
  invitations: new InvitationsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    invitations: new InvitationsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => now,
  appUrl: "http://localhost:12080",
})
const app = (u: string) => testApp(u, { booksService: testBooksService, invitationsService })
let bookId = ""
const tokenOf = (url: string) => url.split("/undangan/")[1] ?? ""

async function invite(): Promise<CreatedInvitation> {
  const res = await app(A).request(`/api/v1/books/${bookId}/invitations`, jsonRequest("POST"))
  expect(res.status).toBe(201)
  return dataOf<CreatedInvitation>(res)
}

describe("undangan buku", () => {
  beforeAll(async () => {
    await cleanupUsers([A, B, C])
    await createTestUser(A, "a-invite@contoh.id")
    await createTestUser(B, "b-invite@contoh.id")
    await createTestUser(C, "c-invite@contoh.id")
    bookId = await createTestBook(A, "Keluarga Undang")
  })
  afterAll(async () => {
    await testDb.delete(activityLogs).where(eq(activityLogs.bookId, bookId))
    await testDb.delete(bookMembers).where(and(eq(bookMembers.bookId, bookId), eq(bookMembers.userId, B)))
    await cleanupUsers([A, B, C])
  })

  test("token mentah tidak disimpan; tautan berisi token 43 karakter", async () => {
    const created = await invite()
    const token = tokenOf(created.url)
    expect(created.url.startsWith("http://localhost:12080/undangan/")).toBe(true)
    expect(token).toHaveLength(43)
    const rows = await testDb.select().from(bookInvitations).where(eq(bookInvitations.bookId, bookId))
    expect(rows.some((r) => r.tokenHash === token)).toBe(false)
    const hash = await hashInviteToken(token)
    expect(rows.some((r) => r.tokenHash === hash)).toBe(true)
    expect(JSON.stringify(rows)).not.toContain(token)
  })

  test("pratinjau publik lalu terima → jadi anggota; dipakai lagi ditolak 410", async () => {
    const token = tokenOf((await invite()).url)
    const preview = await dataOf<InvitationPreview>(await app(C).request(`/api/v1/invitations/${token}`))
    expect(preview).toMatchObject({ status: "active", bookName: "Keluarga Undang", inviterName: A.slice(-4) })

    const res = await app(B).request(`/api/v1/invitations/${token}/accept`, jsonRequest("POST"))
    expect(res.status).toBe(200)
    expect((await dataOf<{ bookId: string }>(res)).bookId).toBe(bookId)
    expect((await dataOf<Book[]>(await app(B).request("/api/v1/books"))).some((b) => b.id === bookId)).toBe(true)

    const again = await app(C).request(`/api/v1/invitations/${token}/accept`, jsonRequest("POST"))
    expect(again.status).toBe(410)
    expect(((await again.json()) as { error: { code: string } }).error.code).toBe("INVITATION_USED")
  })

  test("anggota yang sudah ada ditolak 409 dan token tidak ikut terpakai", async () => {
    const token = tokenOf((await invite()).url)
    const res = await app(B).request(`/api/v1/invitations/${token}/accept`, jsonRequest("POST"))
    expect(res.status).toBe(409)
    expect((await dataOf<InvitationPreview>(await app(C).request(`/api/v1/invitations/${token}`))).status).toBe(
      "active",
    )
  })

  test("dibatalkan dan kedaluwarsa ditolak dengan pesan jelas", async () => {
    const created = await invite()
    const del = await app(A).request(
      `/api/v1/books/${bookId}/invitations/${created.invitation.id}`,
      jsonRequest("DELETE"),
    )
    expect(del.status).toBe(204)
    const revoked = await app(C).request(`/api/v1/invitations/${tokenOf(created.url)}/accept`, jsonRequest("POST"))
    expect(((await revoked.json()) as { error: { code: string } }).error.code).toBe("INVITATION_REVOKED")

    const old = tokenOf((await invite()).url)
    now = new Date(Date.now() + 8 * 86_400_000)
    const expired = await app(C).request(`/api/v1/invitations/${old}/accept`, jsonRequest("POST"))
    expect(expired.status).toBe(410)
    expect(((await expired.json()) as { error: { code: string } }).error.code).toBe("INVITATION_EXPIRED")
    now = new Date()
  })

  test("token asing 404; daftar undangan hanya untuk anggota", async () => {
    const fake = "A".repeat(43)
    expect((await app(C).request(`/api/v1/invitations/${fake}`)).status).toBe(404)
    expect((await app(C).request(`/api/v1/books/${bookId}/invitations`)).status).toBe(404)
    const list = await dataOf<Invitation[]>(await app(B).request(`/api/v1/books/${bookId}/invitations`))
    expect(list.map((i) => i.status)).toContain("used")
    expect(list.map((i) => i.status)).toContain("revoked")
  })
})
