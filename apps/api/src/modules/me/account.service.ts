import type { DeleteAccountInput, DeletionPreview, UserCtx } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { AccountRepository } from "./account.repository"
import type { MeRepository } from "./me.repository"

type Repos = { account: AccountRepository; me: MeRepository }
type Deps = {
  account: Pick<AccountRepository, "memberBooks" | "otherMemberCounts" | "transactionCounts" | "bookData">
  me: Pick<MeRepository, "findById">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  now: () => Date
}

type ExportBook = Awaited<ReturnType<AccountRepository["bookData"]>> & {
  id: string
  name: string
  code: string
}

/** Rupiah bigint → string agar aman di JSON (CODING-GUIDELINES §6.8). */
function jsonSafe(_key: string, v: unknown): unknown {
  return typeof v === "bigint" ? v.toString() : v
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v)
  // Netralkan formula spreadsheet (CSV injection) dan kutip bila perlu.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** Hak subjek data UU PDP (NFR-08, TSD §10): ekspor semua data dan hapus akun. */
export class AccountService {
  constructor(private readonly d: Deps) {}

  private async collect(ctx: UserCtx): Promise<{ email: string; name: string; books: ExportBook[] }> {
    const me = await this.d.me.findById(ctx.userId)
    if (!me) throw new NotFound()
    const list = await this.d.account.memberBooks(ctx.userId)
    const books = await Promise.all(
      list.map(async (b) => ({ id: b.id, name: b.name, code: b.code, ...(await this.d.account.bookData(b.id)) })),
    )
    return { email: me.email, name: me.name, books }
  }

  /** JSON lengkap: profil + seluruh data setiap buku tempat ia anggota aktif. */
  async exportJson(ctx: UserCtx): Promise<string> {
    const me = await this.d.me.findById(ctx.userId)
    const { books } = await this.collect(ctx)
    return JSON.stringify({ exportedAt: this.d.now().toISOString(), profile: me, books }, jsonSafe, 2)
  }

  /** CSV transaksi semua buku (satu baris per transaksi), nama rekening/kategori sudah dibaca. */
  async exportCsv(ctx: UserCtx): Promise<string> {
    const { books } = await this.collect(ctx)
    const header = [
      "buku",
      "kode_buku",
      "tanggal",
      "jenis",
      "jumlah",
      "rekening",
      "rekening_tujuan",
      "kategori",
      "catatan",
    ]
    const lines = [header.join(",")]
    for (const b of books) {
      const wallet = new Map(b.wallets.map((w) => [w.id, w.name]))
      const cat = new Map(b.categories.map((c) => [c.id, c.name]))
      for (const t of b.transactions) {
        lines.push(
          [
            b.name,
            b.code,
            t.txDate,
            t.type,
            t.amount.toString(),
            wallet.get(t.walletId) ?? "",
            t.toWalletId ? (wallet.get(t.toWalletId) ?? "") : "",
            t.categoryId ? (cat.get(t.categoryId) ?? "") : "",
            t.note,
          ]
            .map(csvCell)
            .join(","),
        )
      }
    }
    // BOM supaya Excel membaca UTF-8.
    return `﻿${lines.join("\r\n")}\r\n`
  }

  /** Akibat hapus akun per buku (BR-51): buku tanpa anggota lain ikut dihapus. */
  async deletionPreview(ctx: UserCtx): Promise<DeletionPreview> {
    const list = await this.d.account.memberBooks(ctx.userId)
    const ids = list.map((b) => b.id)
    const [others, txs] = await Promise.all([
      this.d.account.otherMemberCounts(ctx.userId, ids),
      this.d.account.transactionCounts(ids),
    ])
    return {
      books: list.map((b) => {
        const otherMembers = others.get(b.id) ?? 0
        return {
          id: b.id,
          name: b.name,
          code: b.code,
          otherMembers,
          transactionCount: txs.get(b.id) ?? 0,
          willBeDeleted: otherMembers === 0,
        }
      }),
    }
  }

  /**
   * Hapus akun: keluar dari semua buku; buku yang tinggal ia sendiri ikut dihapus (BR-51, BR-53).
   * Data pribadi (identitas, sesi, akun login) dihapus; catatan di buku bersama tetap untuk anggota lain.
   */
  async deleteAccount(ctx: UserCtx, input: DeleteAccountInput): Promise<void> {
    const me = await this.d.me.findById(ctx.userId)
    if (!me) throw new NotFound()
    if (input.confirmEmail.trim().toLowerCase() !== me.email.toLowerCase()) {
      throw new BusinessError("ACCOUNT_CONFIRM_MISMATCH", "confirmEmail")
    }
    const preview = await this.deletionPreview(ctx)
    const now = this.d.now()
    await this.d.uow.withTransaction(async (r) => {
      for (const b of preview.books) {
        await r.account.leaveBook(b.id, ctx.userId, now)
        if (b.willBeDeleted) await r.account.deleteBook(b.id, now)
      }
      await r.account.anonymizeUser(ctx.userId, me.email)
    })
  }
}
