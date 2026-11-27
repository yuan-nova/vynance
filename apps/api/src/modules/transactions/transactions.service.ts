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
  transactions: Pick<TransactionsRepository, "findById" | "findByIdempotencyKey" | "categoryUsage">
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
      await this.assertWallet(r, ctx.bookId, input.walletId, "walletId")
      let toWalletId: string | null = null
      let categoryId: string | null = null
      if (input.type === "transfer") {
        const rule = checkTransferWallets(input.walletId, input.toWalletId)
        if (!rule.ok) throw new BusinessError(rule.code, rule.field)
        await this.assertWallet(r, ctx.bookId, input.toWalletId, "toWalletId")
        toWalletId = input.toWalletId
      } else {
        const [cat] = await r.categories.existActive(ctx.bookId, [input.categoryId])
        if (!cat) throw new BusinessError("CATEGORY_NOT_FOUND", "categoryId")
        const rule = checkCategoryKind(input.type, cat.kind)
        if (!rule.ok) throw new BusinessError(rule.code, rule.field)
        categoryId = cat.id
      }
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

  /** Kategori sering dipakai dalam 3 bulan terakhir (zona Asia/Jakarta). */
  categoryUsage(ctx: ServiceCtx, kind: CategoryKind): Promise<CategoryUsage> {
    const since = `${addMonths(monthOf(this.d.now()), -3)}-01`
    return this.d.transactions.categoryUsage(ctx.bookId, kind, since)
  }

  private async assertWallet(r: Repos, bookId: string, walletId: string, field: string): Promise<void> {
    const w = await r.wallets.findById(bookId, walletId)
    if (!w) throw new BusinessError("WALLET_NOT_FOUND", field)
    if (w.archivedAt) throw new BusinessError("WALLET_ARCHIVED", field)
  }
}
