import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { transactions, users } from "@vynance/db"
import type { Wallet, WalletList } from "@vynance/shared"
import { makeBookRepos } from "../../db/book-repos"
import { cleanupUsers, testDb } from "../../db/test-fixtures"
import { UnitOfWork } from "../../db/unit-of-work"
import { generateBookCode } from "../../lib/book-code"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { BooksRepository } from "../books/books.repository"
import { BooksService } from "../books/books.service"
import { WalletsRepository } from "./wallets.repository"
import { WalletsService } from "./wallets.service"

// Integrasi ke MySQL dev: saldo BR-01, utang BR-03, hapus BR-35, isolasi buku.
const db = testDb
const U = "01JTESTWALLETUSERAAAAAAAAA"
const V = "01JTESTWALLETUSERBBBBBBBBB"

const booksService = new BooksService({
  books: new BooksRepository(db),
  uow: new UnitOfWork(db, makeBookRepos),
  newId: () => newId(),
  newCode: generateBookCode,
})
const walletsService = new WalletsService({
  wallets: new WalletsRepository(db),
  uow: new UnitOfWork(db, (exec) => ({ wallets: new WalletsRepository(exec), activity: new ActivityRepository(exec) })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (userId: string) => testApp(userId, { booksService, walletsService })

async function json<T>(res: Response): Promise<T> {
  return ((await res.json()) as { data: T }).data
}

function post(userId: string, path: string, body: unknown): Promise<Response> {
  return Promise.resolve(
    app(userId).request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
}

async function cleanup(): Promise<void> {
  await cleanupUsers([U, V])
}

let bookId = ""
let otherBookId = ""

describe("rekening", () => {
  beforeAll(async () => {
    await cleanup()
    await db.insert(users).values([
      { id: U, name: "U", email: "u-wallet-test@contoh.id" },
      { id: V, name: "V", email: "v-wallet-test@contoh.id" },
    ])
    bookId = (await booksService.create({ userId: U }, { name: "Uji" })).id
    otherBookId = (await booksService.create({ userId: V }, { name: "Lain" })).id
  })
  afterAll(async () => {
    await cleanup()
  })

  test("saldo = awal + Σ efek; kartu kredit dihitung utang (BR-01, BR-03, BR-05)", async () => {
    const bca = await json<Wallet>(
      await post(U, `/api/v1/books/${bookId}/wallets`, { name: "BCA", type: "bank", openingBalance: "10000000" }),
    )
    const tunai = await json<Wallet>(await post(U, `/api/v1/books/${bookId}/wallets`, { name: "Tunai", type: "cash" }))
    const kk = await json<Wallet>(
      await post(U, `/api/v1/books/${bookId}/wallets`, { name: "KK", type: "credit_card", creditLimit: "15000000" }),
    )
    const tx = (type: "income" | "expense" | "transfer", walletId: string, amount: bigint, toWalletId?: string) => ({
      id: newId(),
      bookId,
      type,
      amount,
      txDate: "2026-11-27",
      walletId,
      toWalletId: toWalletId ?? null,
      createdBy: U,
    })
    await db
      .insert(transactions)
      .values([
        tx("income", bca.id, 8_000_000n),
        tx("expense", bca.id, 1_250_000n),
        tx("transfer", bca.id, 300_000n, tunai.id),
        tx("expense", kk.id, 6_200_000n),
      ])
    const list = await json<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))
    const byId = new Map(list.wallets.map((w) => [w.id, w]))
    expect(byId.get(bca.id)?.balance).toBe("16450000")
    expect(byId.get(tunai.id)?.balance).toBe("300000")
    expect(byId.get(kk.id)?.balance).toBe("-6200000")
    expect(byId.get(kk.id)?.limitUsageBp).toBe(4133)
    // + rekening bawaan buku (BR-46): Dompet Tunai, Bank (kas, saldo 0) dan Kartu Kredit (utang, saldo 0)
    expect(list.summary).toMatchObject({ cash: "16750000", debt: "-6200000", walletCount: 4, debtCount: 2 })
  })

  test("limit untuk rekening bank ditolak 422 field creditLimit", async () => {
    const res = await post(U, `/api/v1/books/${bookId}/wallets`, { name: "X", type: "bank", creditLimit: "1000" })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { field: string } }).error.field).toBe("creditLimit")
  })

  test("hapus: tanpa transaksi boleh; dengan transaksi 409 (BR-35)", async () => {
    const empty = await json<Wallet>(
      await post(U, `/api/v1/books/${bookId}/wallets`, { name: "Kosong", type: "ewallet" }),
    )
    expect((await app(U).request(`/api/v1/books/${bookId}/wallets/${empty.id}`, { method: "DELETE" })).status).toBe(204)
    const list = await json<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))
    const used = list.wallets.find((w) => w.name === "BCA")
    const res = await app(U).request(`/api/v1/books/${bookId}/wallets/${used?.id}`, { method: "DELETE" })
    expect(res.status).toBe(409)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("WALLET_HAS_TRANSACTIONS")
  })

  test("rekening buku lain tidak terbaca dan tidak bisa diubah", async () => {
    const mine = await json<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))
    const first = mine.wallets[0]
    expect(first).toBeDefined()
    // V bukan anggota buku U → 404 di bookAccess
    expect((await app(V).request(`/api/v1/books/${bookId}/wallets`)).status).toBe(404)
    // V memakai bukunya sendiri dengan ID rekening U → 404 di repository
    expect((await app(V).request(`/api/v1/books/${otherBookId}/wallets/${first?.id}`)).status).toBe(404)
    const repo = new WalletsRepository(db)
    expect(await repo.findById(otherBookId, first?.id ?? "")).toBeNull()
    expect((await repo.txSums(otherBookId)).length).toBe(0)
  })

  test("ubah tipe ke non-utang menghapus limit", async () => {
    const pl = await json<Wallet>(
      await post(U, `/api/v1/books/${bookId}/wallets`, { name: "PL", type: "paylater", creditLimit: "5000000" }),
    )
    const res = await app(U).request(`/api/v1/books/${bookId}/wallets/${pl.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "ewallet" }),
    })
    const w = await json<Wallet>(res)
    expect(w.creditLimit).toBeNull()
    expect(w.icon).toBe("wallet")
  })

  test("arsip: total kekayaan tetap, bisa diaktifkan lagi (BR-35)", async () => {
    const before = await json<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))
    const target = before.wallets.find((w) => w.archivedAt === null && BigInt(w.balance) !== 0n)
    expect(target).toBeDefined()
    const res = await post(U, `/api/v1/books/${bookId}/wallets/${target?.id}/archive`, {})
    expect(res.status).toBe(200)
    expect((await json<Wallet>(res)).archivedAt).not.toBeNull()
    const after = await json<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))
    expect(after.summary.cash).toBe(before.summary.cash)
    expect(after.summary.debt).toBe(before.summary.debt)
    expect(after.wallets.find((w) => w.id === target?.id)?.balance).toBe(target?.balance)

    const back = await post(U, `/api/v1/books/${bookId}/wallets/${target?.id}/unarchive`, {})
    expect((await json<Wallet>(back)).archivedAt).toBeNull()
    expect((await post(V, `/api/v1/books/${otherBookId}/wallets/${target?.id}/archive`, {})).status).toBe(404)
  })
})
