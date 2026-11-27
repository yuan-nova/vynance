import { describe, expect, test } from "bun:test"
import type { Me } from "@vynance/shared"
import { NotFound } from "../../lib/errors"
import { testApp } from "../../testing/test-app"
import type { BooksService } from "../books/books.service"
import { MeService } from "./me.service"

const me: Me = {
  id: "01JAAAAAAAAAAAAAAAAAAAAAAA",
  name: "Sari",
  email: "sari@contoh.id",
  image: null,
  locale: "id",
  theme: "system",
  privacyMode: false,
  lastBookId: null,
}

function build(sessionUserId: string | null) {
  let stored = { ...me }
  const repo = {
    findById: async (id: string) => (id === stored.id ? stored : null),
    update: async (_id: string, input: Partial<Me>) => {
      stored = { ...stored, ...input }
    },
  }
  const booksService = {
    assertMember: async () => {
      throw new NotFound("BOOK_NOT_FOUND")
    },
  } as unknown as BooksService
  return testApp(sessionUserId, { meService: new MeService(repo, booksService), booksService })
}

describe("/me", () => {
  test("tanpa sesi → 401", async () => {
    const res = await build(null).request("/api/v1/me")
    expect(res.status).toBe(401)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("UNAUTHORIZED")
  })

  test("dengan sesi → profil", async () => {
    const res = await build(me.id).request("/api/v1/me")
    expect(res.status).toBe(200)
    expect(((await res.json()) as { data: Me }).data.email).toBe(me.email)
  })

  test("PATCH mengubah privasi dan tema", async () => {
    const res = await build(me.id).request("/api/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ privacyMode: true, theme: "dark" }),
    })
    const body = (await res.json()) as { data: Me }
    expect(body.data.privacyMode).toBe(true)
    expect(body.data.theme).toBe("dark")
  })

  test("PATCH lastBookId buku orang lain → 404", async () => {
    const res = await build(me.id).request("/api/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lastBookId: "01JBBBBBBBBBBBBBBBBBBBBBBB" }),
    })
    expect(res.status).toBe(404)
  })

  test("PATCH tema tidak dikenal → 422 field theme", async () => {
    const res = await build(me.id).request("/api/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: "ungu" }),
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { field: string } }).error.field).toBe("theme")
  })
})
