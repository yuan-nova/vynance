import {
  computeZakat,
  DEFAULT_GOLD_PRICE_PER_GRAM,
  dateOnlyOf,
  haulDate,
  moneyToJson,
  type ServiceCtx,
  type Transaction,
  type ZakatPaymentInput,
  type ZakatSummary,
} from "@vynance/shared"
import { BusinessError } from "../../lib/errors"
import type { CategoriesService } from "../categories/categories.service"
import type { InvestmentsService } from "../investments/investments.service"
import type { TransactionsService } from "../transactions/transactions.service"
import type { WalletsService } from "../wallets/wallets.service"
import type { ZakatRepository } from "./zakat.repository"

export const ZAKAT_CATEGORY = "Zakat & Infaq"
const GOLD_TTL_MS = 6 * 60 * 60 * 1000

type Deps = {
  zakat: Pick<ZakatRepository, "latestGold" | "insertGold" | "haulStart" | "setHaulStart">
  wallets: Pick<WalletsService, "list">
  investments: Pick<InvestmentsService, "totalValue">
  categories: Pick<CategoriesService, "list">
  transactions: Pick<TransactionsService, "create">
  newId: () => string
  now: () => Date
  /** Ambil harga emas live per gram (rupiah). null bila sumber tidak dikonfigurasi. */
  fetchGoldPrice?: () => Promise<bigint | null>
}

/** Zakat maal (PB-08, FR-110, BR-42). */
export class ZakatService {
  constructor(private readonly d: Deps) {}

  async summary(ctx: ServiceCtx, manualGoldPrice?: bigint): Promise<ZakatSummary> {
    const [wallets, investments, gold, haulStart, cats] = await Promise.all([
      this.d.wallets.list(ctx),
      this.d.investments.totalValue(ctx),
      this.d.zakat.latestGold(),
      this.d.zakat.haulStart(ctx.bookId),
      this.d.categories.list(ctx, { kind: "expense" }),
    ])
    // Harga emas: isian manual → cache live terakhir → bawaan (PB-08 langkah 1).
    const goldPrice = manualGoldPrice ?? (gold ? BigInt(gold.value.split(".")[0] ?? "0") : DEFAULT_GOLD_PRICE_PER_GRAM)
    const goldSource = manualGoldPrice ? "manual" : gold ? "live" : "default"
    const cash = BigInt(wallets.summary.cash)
    const debtDue = -BigInt(wallets.summary.debt)
    const r = computeZakat({ cash, investments, debtDue, goldPricePerGram: goldPrice })
    const due = haulStart ? haulDate(haulStart) : null
    return {
      goldPrice: moneyToJson(goldPrice),
      goldSource,
      goldFetchedAt: goldSource === "live" && gold ? gold.fetchedAt.toISOString() : null,
      cash: moneyToJson(cash),
      investments: moneyToJson(investments),
      debtDue: moneyToJson(debtDue),
      wealth: moneyToJson(r.wealth),
      nisab: moneyToJson(r.nisab),
      obligatory: r.obligatory,
      zakat: moneyToJson(r.zakat),
      haulStart,
      haulDate: due,
      haulReached: due !== null && due <= dateOnlyOf(this.d.now()),
      categoryId: cats.find((c) => c.name === ZAKAT_CATEGORY && !c.archivedAt)?.id ?? null,
    }
  }

  /** Catat pembayaran sebagai uang keluar kategori Zakat & Infaq, lalu mulai haul baru dari tanggal bayar. */
  async pay(ctx: ServiceCtx, input: ZakatPaymentInput, idempotencyKey?: string): Promise<Transaction> {
    const cats = await this.d.categories.list(ctx, { kind: "expense" })
    const cat = cats.find((c) => c.name === ZAKAT_CATEGORY && !c.archivedAt)
    if (!cat) throw new BusinessError("CATEGORY_NOT_FOUND", "categoryId")
    const tx = await this.d.transactions.create(
      ctx,
      {
        type: "expense",
        amount: input.amount,
        txDate: input.txDate,
        walletId: input.walletId,
        categoryId: cat.id,
        note: "Zakat maal",
      },
      idempotencyKey,
    )
    await this.d.zakat.setHaulStart(ctx.bookId, input.txDate)
    return tx
  }

  async setHaulStart(ctx: ServiceCtx, start: string | null): Promise<void> {
    await this.d.zakat.setHaulStart(ctx.bookId, start)
  }

  /** Job worker tiap 6 jam (TSD §9): simpan harga emas live ke reference_rates. */
  async refreshGold(now: Date): Promise<number> {
    const last = await this.d.zakat.latestGold()
    if (last && now.getTime() - last.fetchedAt.getTime() < GOLD_TTL_MS) return 0
    const price = await this.d.fetchGoldPrice?.()
    if (!price || price <= 0n) return 0
    await this.d.zakat.insertGold({ id: this.d.newId(), value: price, fetchedAt: now })
    return 1
  }
}
