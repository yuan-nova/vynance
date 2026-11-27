import {
  type CreateWalletInput,
  isDebtWallet,
  limitUsageBp,
  moneyToJson,
  type ServiceCtx,
  type UpdateWalletInput,
  WALLET_TYPE_ICON,
  type Wallet,
  type WalletList,
  walletBalances,
  wealthSummary,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { WalletsRepository } from "./wallets.repository"

type Row = NonNullable<Awaited<ReturnType<WalletsRepository["findById"]>>>
type Repos = { wallets: WalletsRepository; activity: ActivityRepository }
type Deps = {
  wallets: Pick<WalletsRepository, "list" | "findById" | "txSums">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

function toWallet(row: Row, balance: bigint): Wallet {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    openingBalance: moneyToJson(row.openingBalance),
    creditLimit: row.creditLimit === null ? null : moneyToJson(row.creditLimit),
    balance: moneyToJson(balance),
    limitUsageBp: isDebtWallet(row.type) ? limitUsageBp(balance, row.creditLimit) : null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  }
}

export class WalletsService {
  constructor(private readonly d: Deps) {}

  /** Daftar rekening + saldo terhitung + ringkasan kas/utang (BR-01…BR-03, BR-05). */
  async list(ctx: ServiceCtx): Promise<WalletList> {
    const [rows, sums] = await Promise.all([this.d.wallets.list(ctx.bookId), this.d.wallets.txSums(ctx.bookId)])
    const balances = walletBalances(rows, sums)
    const items = rows.map((r) => ({ row: r, balance: balances.get(r.id) ?? r.openingBalance }))
    const active = items.filter((i) => i.row.archivedAt === null)
    // Rekening arsip tetap dihitung: arsip tidak boleh mengubah total kekayaan (BR-35).
    const summary = wealthSummary(items.map((i) => ({ type: i.row.type, balance: i.balance })))
    return {
      wallets: items.map((i) => toWallet(i.row, i.balance)),
      summary: {
        cash: moneyToJson(summary.cash),
        debt: moneyToJson(summary.debt),
        walletCount: active.filter((i) => !isDebtWallet(i.row.type)).length,
        debtCount: active.filter((i) => isDebtWallet(i.row.type)).length,
      },
    }
  }

  async get(ctx: ServiceCtx, id: string): Promise<Wallet> {
    const row = await this.d.wallets.findById(ctx.bookId, id)
    if (!row) throw new NotFound("WALLET_NOT_FOUND")
    const balance = walletBalances([row], await this.d.wallets.txSums(ctx.bookId, id)).get(id) ?? row.openingBalance
    return toWallet(row, balance)
  }

  async create(ctx: ServiceCtx, input: CreateWalletInput): Promise<Wallet> {
    const id = this.d.newId()
    await this.d.uow.withTransaction(async (r) => {
      await r.wallets.insert({
        id,
        bookId: ctx.bookId,
        name: input.name,
        type: input.type,
        icon: WALLET_TYPE_ICON[input.type],
        openingBalance: input.openingBalance,
        creditLimit: isDebtWallet(input.type) ? (input.creditLimit ?? null) : null,
        createdBy: ctx.userId,
      })
      await this.log(r, ctx, "wallet.created", id, input.name)
    })
    return this.get(ctx, id)
  }

  async update(ctx: ServiceCtx, id: string, input: UpdateWalletInput): Promise<Wallet> {
    const current = await this.d.wallets.findById(ctx.bookId, id)
    if (!current) throw new NotFound("WALLET_NOT_FOUND")
    const type = input.type ?? current.type
    if (!isDebtWallet(type) && input.creditLimit != null)
      throw new BusinessError("WALLET_LIMIT_NOT_ALLOWED", "creditLimit")
    await this.d.uow.withTransaction(async (r) => {
      await r.wallets.update(ctx.bookId, id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.type !== undefined ? { type: input.type, icon: WALLET_TYPE_ICON[input.type] } : {}),
        ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
        // Pindah ke tipe non-utang menghapus limit.
        ...(!isDebtWallet(type)
          ? { creditLimit: null }
          : input.creditLimit !== undefined
            ? { creditLimit: input.creditLimit }
            : {}),
      })
      await this.log(r, ctx, "wallet.updated", id, input.name ?? current.name)
    })
    return this.get(ctx, id)
  }

  /** BR-35: rekening yang sudah dipakai diarsipkan, bukan dihapus. Tersembunyi dari pilihan transaksi baru. */
  async setArchived(ctx: ServiceCtx, id: string, archived: boolean): Promise<Wallet> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.wallets.findById(ctx.bookId, id)
      if (!current) throw new NotFound("WALLET_NOT_FOUND")
      await r.wallets.setArchived(ctx.bookId, id, archived ? this.d.now() : null)
      await this.log(r, ctx, archived ? "wallet.archived" : "wallet.unarchived", id, current.name)
    })
    return this.get(ctx, id)
  }

  /** Hapus hanya bila belum ada transaksi; selain itu arsipkan (BR-35). */
  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.wallets.findById(ctx.bookId, id)
      if (!current) throw new NotFound("WALLET_NOT_FOUND")
      if (await r.wallets.hasTransactions(ctx.bookId, id)) {
        throw new BusinessError("WALLET_HAS_TRANSACTIONS", undefined, 409)
      }
      await r.wallets.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "wallet.deleted", id, current.name)
    })
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, name: string): Promise<void> {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "wallet",
      entityId: id,
      summary: { name },
    })
  }
}
