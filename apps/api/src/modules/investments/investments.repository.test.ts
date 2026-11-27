import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Asset, InvestmentType, Portfolio } from "@vynance/shared"
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
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { AssetsRepository } from "./assets.repository"
import { InvestmentTypesRepository } from "./investment-types.repository"
import { InvestmentsService } from "./investments.service"

// PB-06: jenis + target, aset, untung/rugi, progres; isolasi buku.
const U = "01JTESTINVESTAAAAAAAAAAAAA"
const V = "01JTESTINVESTBBBBBBBBBBBBB"
const svc = new InvestmentsService({
  types: new InvestmentTypesRepository(testDb),
  assets: new AssetsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    types: new InvestmentTypesRepository(exec),
    assets: new AssetsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, investmentsService: svc })
let bookId = ""
let otherBook = ""
const url = (p: string) => `/api/v1/books/${bookId}${p}`

describe("investasi (PB-06)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-invest@contoh.id")
    await createTestUser(V, "v-invest@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
  })
  afterAll(() => cleanupUsers([U, V]))

  test("target jenis, aset, untung/rugi, progres", async () => {
    const types = await dataOf<InvestmentType[]>(await app(U).request(url("/investment-types")))
    const emas = types.find((t) => t.name === "Emas")
    const upd = await app(U).request(
      url(`/investment-types/${emas?.id}`),
      jsonRequest("PUT", { name: "Emas", icon: "coins", targetValue: "100000000" }),
    )
    expect(upd.status).toBe(200)

    const res = await app(U).request(
      url("/assets"),
      jsonRequest("POST", {
        name: "Emas Antam",
        investmentTypeId: emas?.id,
        units: "30",
        costBasis: "42820000",
        currentValue: "48000000",
      }),
    )
    expect(res.status).toBe(201)
    const asset = await dataOf<Asset>(res)
    expect(asset.gain).toBe("5180000")
    expect(asset.gainBp).toBe(1209)

    const p = await dataOf<Portfolio>(await app(U).request(url("/investments")))
    expect(p.totals).toEqual({ cost: "42820000", value: "48000000", gain: "5180000", gainBp: 1209 })
    expect(p.types.find((t) => t.id === emas?.id)?.progressBp).toBe(4800)

    // Nilai kini diperbarui manual.
    const valued = await dataOf<Asset>(
      await app(U).request(url(`/assets/${asset.id}`), jsonRequest("PATCH", { currentValue: "40000000" })),
    )
    expect(valued.gain).toBe("-2820000")
    expect(valued.valueUpdatedAt).not.toBeNull()

    // Jenis yang punya aset tidak bisa dihapus.
    expect((await app(U).request(url(`/investment-types/${emas?.id}`), jsonRequest("DELETE"))).status).toBe(409)
  })

  test("jenis dari buku lain ditolak; buku lain 404", async () => {
    const foreignType = (await new InvestmentTypesRepository(testDb).list(otherBook))[0]?.id
    const res = await app(U).request(
      url("/assets"),
      jsonRequest("POST", { name: "X", investmentTypeId: foreignType, costBasis: "1", currentValue: "1" }),
    )
    expect(res.status).toBe(422)
    expect((await app(V).request(url("/investments"))).status).toBe(404)
  })

  test("tambah jenis baru lalu hapus asetnya", async () => {
    const t = await dataOf<InvestmentType>(
      await app(U).request(url("/investment-types"), jsonRequest("POST", { name: "Kripto", targetValue: null })),
    )
    const a = await dataOf<Asset>(
      await app(U).request(
        url("/assets"),
        jsonRequest("POST", { name: "BTC", investmentTypeId: t.id, costBasis: "1000", currentValue: "1200" }),
      ),
    )
    expect((await app(U).request(url(`/assets/${a.id}`), jsonRequest("DELETE"))).status).toBe(204)
    expect((await app(U).request(url(`/investment-types/${t.id}`), jsonRequest("DELETE"))).status).toBe(204)
  })
})
