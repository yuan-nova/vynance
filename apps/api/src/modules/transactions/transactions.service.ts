import {
  addMonths,
  type CategoryKind,
  type CategoryUsage,
  type CreateTransactionInput,
  checkCategoryKind,
  checkTransferWallets,
  formatMoney,
  monthOf,
  type ServiceCtx,
  type Transaction,
  type TransactionDetail,
  type TransactionListQuery,
  type TransactionPage,
  type TransactionSummary,
  type UpdateTransactionInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { CategoriesRepository } from "../categories/categories.repository"
import type { WalletsRepository } from "../wallets/wallets.repository"
import type { TransactionsRepository } from "./transactions.repository"

type Repos = {
  transactions: TransactionsRepository
  wallets: WalletsRepository
  categories: CategoriesRepository
  activity: ActivityRepository
}
type Deps = {
  transactions: Pick<
    TransactionsRepository,
    "findById" | "findByIdempotencyKey" | "categoryUsage" | "list" | "sumIncomeExpense" | "detail" | "sumAssetNet"
  >
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

export class TransactionsService {
  constructor(private readonly d: Deps) {}

  /**
   * Catat transaksi (PB-02, FR-20). Idempotency-Key sama → transaksi yang sudah ada dikembalikan (TSD §7.1).
   * Rekening dan kategori wajib milik buku yang sama (BR-45, TSD §6.3).
   */
  async create(ctx: ServiceCtx, input: CreateTransactionInput, idempotencyKey?: string): Promise<Transaction> {
    if (idempotencyKey) {
      const existing = await this.d.transactions.findByIdempotencyKey(ctx.bookId, idempotencyKey)
      if (existing) return existing
    }
    const id = this.d.newId()
    const result = await this.d.uow.withTransaction(async (r) => {
      const { toWalletId, categoryId } = await this.resolveRefs(r, ctx.bookId, input)
      const inserted = await r.transactions.insert({
        id,
        bookId: ctx.bookId,
        type: input.type,
        amount: input.amount,
        txDate: input.txDate,
        walletId: input.walletId,
        toWalletId,
        categoryId,
        note: input.note || null,
        source: "manual",
        idempotencyKey: idempotencyKey ?? null,
        createdBy: ctx.userId,
      })
      if (inserted === "duplicate_key") return "duplicate" as const
      await r.activity.record({
        id: this.d.newId(),
        bookId: ctx.bookId,
        actorId: ctx.userId,
        action: "transaction.created",
        entityType: "transaction",
        entityId: id,
        // Ringkasan untuk aktivitas buku, hanya dibaca anggota buku (FR-04).
        summary: { type: input.type, amount: formatMoney(input.amount), note: input.note ?? "" },
      })
      return "created" as const
    })
    if (result === "duplicate" && idempotencyKey) {
      const existing = await this.d.transactions.findByIdempotencyKey(ctx.bookId, idempotencyKey)
      if (existing) return existing
    }
    const tx = await this.d.transactions.findById(ctx.bookId, id)
    if (!tx) throw new NotFound("TRANSACTION_NOT_FOUND")
    return tx
  }

  async get(ctx: ServiceCtx, id: string): Promise<TransactionDetail> {
    const tx = await this.d.transactions.detail(ctx.bookId, id)
    if (!tx) throw new NotFound("TRANSACTION_NOT_FOUND")
    return tx
  }

  /** FR-20: ubah isi transaksi; pengubah dicatat (updated_by). */
  async update(ctx: ServiceCtx, id: string, input: UpdateTransactionInput): Promise<TransactionDetail> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.transactions.findById(ctx.bookId, id)
      if (!current) throw new NotFound("TRANSACTION_NOT_FOUND")
      // Beli/jual aset punya dampak ke aset (BR-34); diubah lewat #32.
      if (current.type === "asset_buy" || current.type === "asset_sell")
        throw new BusinessError("TRANSACTION_ASSET_EDIT")
      const { toWalletId, categoryId } = await this.resolveRefs(r, ctx.bookId, input)
      await r.transactions.update(ctx.bookId, id, {
        type: input.type,
        amount: input.amount,
        txDate: input.txDate,
        walletId: input.walletId,
        toWalletId,
        categoryId,
        note: input.note || null,
        updatedBy: ctx.userId,
      })
      await this.log(r, ctx, "transaction.updated", id, input.amount, input.note)
    })
    return this.get(ctx, id)
  }

  /** FR-24: hapus lunak; bisa diurungkan. Saldo otomatis ikut karena dihitung dari transaksi aktif (BR-01). */
  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.transactions.findById(ctx.bookId, id)
      if (!current) throw new NotFound("TRANSACTION_NOT_FOUND")
      if (current.type === "asset_buy" || current.type === "asset_sell")
        throw new BusinessError("TRANSACTION_ASSET_EDIT")
      await r.transactions.setDeleted(ctx.bookId, id, this.d.now(), ctx.userId)
      await this.log(r, ctx, "transaction.deleted", id, BigInt(current.amount), current.note ?? undefined)
    })
  }

  async restore(ctx: ServiceCtx, id: string): Promise<TransactionDetail> {
    await this.d.uow.withTransaction(async (r) => {
      const tx = await r.transactions.findAny(ctx.bookId, id)
      if (!tx) throw new NotFound("TRANSACTION_NOT_FOUND")
      if (tx.deleted) {
        await r.transactions.setDeleted(ctx.bookId, id, null, ctx.userId)
        await this.log(r, ctx, "transaction.restored", id, BigInt(tx.amount), tx.note ?? undefined)
      }
    })
    return this.get(ctx, id)
  }

  /** FR-21: daftar dengan filter + cursor. */
  async list(ctx: ServiceCtx, q: TransactionListQuery): Promise<TransactionPage> {
    const { items, hasMore } = await this.d.transactions.list(ctx.bookId, q)
    const last = items[items.length - 1]
    return { data: items, nextCursor: hasMore && last ? `${last.txDate}.${last.id}` : null }
  }

  async summary(ctx: ServiceCtx, from: string, to: string): Promise<TransactionSummary> {
    const s = await this.d.transactions.sumIncomeExpense(ctx.bookId, from, to)
    return { income: s.income.toString(), expense: s.expense.toString() }
  }

  /** Pilar investasi skor kesehatan (BRD §8.2): nilai aset bersih sampai akhir bulan yang dipilih. */
  async getHealthInputs(ctx: ServiceCtx, to: string): Promise<{ investments: bigint }> {
    return { investments: await this.d.transactions.sumAssetNet(ctx.bookId, to) }
  }

  /** Kategori sering dipakai dalam 3 bulan terakhir (zona Asia/Jakarta). */
  categoryUsage(ctx: ServiceCtx, kind: CategoryKind): Promise<CategoryUsage> {
    const since = `${addMonths(monthOf(this.d.now()), -3)}-01`
    return this.d.transactions.categoryUsage(ctx.bookId, kind, since)
  }

  /** Rekening/kategori wajib milik buku ini dan aktif; aturan BR-31 dan jenis kategori (TSD §6.3). */
  private async resolveRefs(
    r: Repos,
    bookId: string,
    input: CreateTransactionInput,
  ): Promise<{ toWalletId: string | null; categoryId: string | null }> {
    await this.assertWallet(r, bookId, input.walletId, "walletId")
    if (input.type === "transfer") {
      const rule = checkTransferWallets(input.walletId, input.toWalletId)
      if (!rule.ok) throw new BusinessError(rule.code, rule.field)
      await this.assertWallet(r, bookId, input.toWalletId, "toWalletId")
      return { toWalletId: input.toWalletId, categoryId: null }
    }
    const [cat] = await r.categories.existActive(bookId, [input.categoryId])
    if (!cat) throw new BusinessError("CATEGORY_NOT_FOUND", "categoryId")
    const rule = checkCategoryKind(input.type, cat.kind)
    if (!rule.ok) throw new BusinessError(rule.code, rule.field)
    return { toWalletId: null, categoryId: cat.id }
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, amount: bigint, note?: string): Promise<void> {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "transaction",
      entityId: id,
      summary: { amount: formatMoney(amount), note: note ?? "" },
    })
  }

  private async assertWallet(r: Repos, bookId: string, walletId: string, field: string): Promise<void> {
    const w = await r.wallets.findById(bookId, walletId)
    if (!w) throw new BusinessError("WALLET_NOT_FOUND", field)
    if (w.archivedAt) throw new BusinessError("WALLET_ARCHIVED", field)
  }
}
