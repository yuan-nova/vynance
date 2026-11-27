import {
  addMonths,
  assetTradeDelta,
  type CategoryKind,
  type CategoryUsage,
  type CreateTransactionInput,
  checkAssetSell,
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
import type { AssetsRepository } from "../investments/assets.repository"
import type { WalletsRepository } from "../wallets/wallets.repository"
import type { TransactionsRepository } from "./transactions.repository"

type Repos = {
  transactions: TransactionsRepository
  wallets: WalletsRepository
  categories: CategoriesRepository
  assets: AssetsRepository
  activity: ActivityRepository
}
type Deps = {
  transactions: Pick<
    TransactionsRepository,
    "findById" | "findByIdempotencyKey" | "categoryUsage" | "list" | "sumIncomeExpense" | "detail"
  >
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
  /** Dipanggil setelah commit untuk uang keluar (peringatan anggaran BR-11, #35). Tidak boleh melempar. */
  afterExpense?: (ctx: ServiceCtx, categoryId: string, txDate: string) => Promise<void>
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
      const { toWalletId, categoryId, assetId } = await this.resolveRefs(r, ctx.bookId, input)
      const inserted = await r.transactions.insert({
        id,
        bookId: ctx.bookId,
        type: input.type,
        amount: input.amount,
        txDate: input.txDate,
        walletId: input.walletId,
        toWalletId,
        categoryId,
        assetId,
        note: input.note || null,
        source: "manual",
        idempotencyKey: idempotencyKey ?? null,
        createdBy: ctx.userId,
      })
      if (inserted === "duplicate_key") return "duplicate" as const
      await this.applyAsset(r, ctx.bookId, input.type, assetId, input.amount)
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
    await this.notifyExpense(ctx, tx)
    return tx
  }

  private async notifyExpense(ctx: ServiceCtx, tx: { type: string; categoryId: string | null; txDate: string }) {
    if (tx.type === "expense" && tx.categoryId && this.d.afterExpense) {
      await this.d.afterExpense(ctx, tx.categoryId, tx.txDate)
    }
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
      // BR-34: balik dampak lama ke aset, lalu terapkan dampak baru (BR-33 dicek setelah dibalik).
      await this.revertAsset(r, ctx.bookId, current)
      const { toWalletId, categoryId, assetId } = await this.resolveRefs(r, ctx.bookId, input)
      await this.applyAsset(r, ctx.bookId, input.type, assetId, input.amount)
      await r.transactions.update(ctx.bookId, id, {
        type: input.type,
        amount: input.amount,
        txDate: input.txDate,
        walletId: input.walletId,
        toWalletId,
        categoryId,
        assetId,
        note: input.note || null,
        updatedBy: ctx.userId,
      })
      await this.log(r, ctx, "transaction.updated", id, input.amount, input.note)
    })
    const updated = await this.get(ctx, id)
    await this.notifyExpense(ctx, updated)
    return updated
  }

  /** FR-24: hapus lunak; bisa diurungkan. Saldo otomatis ikut karena dihitung dari transaksi aktif (BR-01). */
  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.transactions.findById(ctx.bookId, id)
      if (!current) throw new NotFound("TRANSACTION_NOT_FOUND")
      await this.revertAsset(r, ctx.bookId, current)
      await r.transactions.setDeleted(ctx.bookId, id, this.d.now(), ctx.userId)
      await this.log(r, ctx, "transaction.deleted", id, BigInt(current.amount), current.note ?? undefined)
    })
  }

  async restore(ctx: ServiceCtx, id: string): Promise<TransactionDetail> {
    await this.d.uow.withTransaction(async (r) => {
      const tx = await r.transactions.findAny(ctx.bookId, id)
      if (!tx) throw new NotFound("TRANSACTION_NOT_FOUND")
      if (tx.deleted) {
        await this.applyAsset(r, ctx.bookId, tx.type, tx.assetId, BigInt(tx.amount))
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
  ): Promise<{ toWalletId: string | null; categoryId: string | null; assetId: string | null }> {
    await this.assertWallet(r, bookId, input.walletId, "walletId")
    if (input.type === "transfer") {
      const rule = checkTransferWallets(input.walletId, input.toWalletId)
      if (!rule.ok) throw new BusinessError(rule.code, rule.field)
      await this.assertWallet(r, bookId, input.toWalletId, "toWalletId")
      return { toWalletId: input.toWalletId, categoryId: null, assetId: null }
    }
    if ("assetId" in input) {
      // BR-32: aset wajib milik buku ini.
      if (!(await r.assets.findById(bookId, input.assetId))) throw new BusinessError("ASSET_NOT_FOUND", "assetId")
      return { toWalletId: null, categoryId: null, assetId: input.assetId }
    }
    const [cat] = await r.categories.existActive(bookId, [input.categoryId])
    if (!cat) throw new BusinessError("CATEGORY_NOT_FOUND", "categoryId")
    const rule = checkCategoryKind(input.type, cat.kind)
    if (!rule.ok) throw new BusinessError(rule.code, rule.field)
    return { toWalletId: null, categoryId: cat.id, assetId: null }
  }

  /** Terapkan dampak beli/jual ke aset; jual dicek BR-33 terhadap nilai aset saat ini. */
  private async applyAsset(r: Repos, bookId: string, type: string, assetId: string | null, amount: bigint) {
    if (!assetId || (type !== "asset_buy" && type !== "asset_sell")) return
    const asset = await r.assets.findById(bookId, assetId)
    if (!asset) throw new BusinessError("ASSET_NOT_FOUND", "assetId")
    if (type === "asset_sell") {
      const rule = checkAssetSell(asset, amount)
      if (!rule.ok) throw new BusinessError(rule.code, rule.field)
    }
    const d = assetTradeDelta(type, amount)
    await r.assets.applyDelta(bookId, assetId, d.cost, d.value)
  }

  /** BR-34: balik dampak transaksi lama ke asetnya. */
  private async revertAsset(r: Repos, bookId: string, tx: { type: string; assetId: string | null; amount: string }) {
    if (!tx.assetId || (tx.type !== "asset_buy" && tx.type !== "asset_sell")) return
    const d = assetTradeDelta(tx.type, BigInt(tx.amount))
    await r.assets.applyDelta(bookId, tx.assetId, -d.cost, -d.value)
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
