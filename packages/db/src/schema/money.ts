import { sql } from "drizzle-orm"
import {
  char,
  check,
  date,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, money, month, ref, timestamp, timestamps, units } from "./columns"

// Rekening dan transaksi (TSD §6.2). Saldo tidak disimpan (BR-01).

export const wallets = mysqlTable(
  "wallets",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 40 }).notNull(),
    type: mysqlEnum("type", ["bank", "ewallet", "cash", "credit_card", "paylater", "rdn"]).notNull(),
    icon: varchar("icon", { length: 32 }).notNull(),
    openingBalance: money("opening_balance").notNull().default(sql`0`),
    creditLimit: money("credit_limit"),
    archivedAt: timestamp("archived_at"),
    ...audit,
  },
  (t) => [index("wallets_book_idx").on(t.bookId, t.deletedAt)],
)

// FK category_id, asset_id, subscription_id ditambahkan saat tabelnya dibuat (#9, #31, #29).
export const transactions = mysqlTable(
  "transactions",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    type: mysqlEnum("type", ["income", "expense", "transfer", "asset_buy", "asset_sell"]).notNull(),
    amount: money("amount").notNull(),
    txDate: date("tx_date", { mode: "string" }).notNull(),
    walletId: ref("wallet_id")
      .notNull()
      .references(() => wallets.id),
    toWalletId: ref("to_wallet_id").references(() => wallets.id),
    categoryId: ref("category_id"),
    assetId: ref("asset_id"),
    note: varchar("note", { length: 200 }),
    source: mysqlEnum("source", ["manual", "subscription", "scan"]).notNull().default("manual"),
    subscriptionId: ref("subscription_id"),
    subscriptionPeriod: month("subscription_period"),
    idempotencyKey: varchar("idempotency_key", { length: 64 }),
    updatedBy: ref("updated_by"),
    ...audit,
  },
  (t) => [
    index("tx_book_date_idx").on(t.bookId, t.txDate, t.id),
    index("tx_book_wallet_date_idx").on(t.bookId, t.walletId, t.txDate),
    index("tx_book_to_wallet_idx").on(t.bookId, t.toWalletId),
    index("tx_book_category_date_idx").on(t.bookId, t.categoryId, t.txDate),
    uniqueIndex("tx_book_idem_uq").on(t.bookId, t.idempotencyKey),
    uniqueIndex("tx_subscription_period_uq").on(t.subscriptionId, t.subscriptionPeriod),
    foreignKey({ name: "tx_category_fk", columns: [t.categoryId], foreignColumns: [categories.id] }),
    foreignKey({ name: "tx_subscription_fk", columns: [t.subscriptionId], foreignColumns: [subscriptions.id] }),
    foreignKey({ name: "tx_asset_fk", columns: [t.assetId], foreignColumns: [assets.id] }),
    check("tx_amount_positive", sql`${t.amount} > 0`),
    check(
      "tx_transfer_wallets",
      sql`${t.type} <> 'transfer' OR (${t.toWalletId} IS NOT NULL AND ${t.toWalletId} <> ${t.walletId})`,
    ),
  ],
)

export const categories = mysqlTable(
  "categories",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 40 }).notNull(),
    kind: mysqlEnum("kind", ["income", "expense"]).notNull(),
    budgetGroup: mysqlEnum("budget_group", ["needs", "wants", "savings"]),
    icon: varchar("icon", { length: 32 }).notNull(),
    monthlyBudget: money("monthly_budget"),
    sortOrder: int("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at"),
    ...audit,
  },
  (t) => [index("categories_book_kind_order_idx").on(t.bookId, t.kind, t.sortOrder)],
)

export const investmentTypes = mysqlTable(
  "investment_types",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 40 }).notNull(),
    icon: varchar("icon", { length: 32 }).notNull(),
    targetValue: money("target_value"),
    sortOrder: int("sort_order").notNull().default(0),
    ...audit,
  },
  (t) => [index("investment_types_book_idx").on(t.bookId, t.sortOrder)],
)

/** Aset investasi (PB-06). Modal dan nilai berubah lewat beli/jual (#32) dan pembaruan nilai manual. */
export const assets = mysqlTable(
  "assets",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    investmentTypeId: ref("investment_type_id")
      .notNull()
      .references(() => investmentTypes.id),
    name: varchar("name", { length: 60 }).notNull(),
    units: units("units").notNull().default("0"),
    costBasis: money("cost_basis").notNull().default(sql`0`),
    currentValue: money("current_value").notNull().default(sql`0`),
    valueUpdatedAt: timestamp("value_updated_at"),
    ...audit,
  },
  (t) => [
    index("assets_book_idx").on(t.bookId, t.deletedAt),
    check("assets_cost_nonneg", sql`${t.costBasis} >= 0`),
    check("assets_value_nonneg", sql`${t.currentValue} >= 0`),
  ],
)

// Rencana bulanan (PB-04). Tabel anak ikut menyimpan book_id supaya setiap query bisa difilter buku (BR-45).
export const monthlyPlans = mysqlTable(
  "monthly_plans",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    month: month("month").notNull(),
    spendingCap: money("spending_cap"),
    defaultWalletId: ref("default_wallet_id").references(() => wallets.id),
    method: mysqlEnum("method", ["custom", "50_30_20", "60_20_20", "70_10_20", "fixed"]).notNull().default("custom"),
    version: int("version").notNull().default(1),
    updatedBy: ref("updated_by"),
    ...audit,
  },
  (t) => [uniqueIndex("monthly_plans_book_month_uq").on(t.bookId, t.month)],
)

export const planIncomes = mysqlTable(
  "plan_incomes",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    planId: ref("plan_id")
      .notNull()
      .references(() => monthlyPlans.id),
    name: varchar("name", { length: 60 }).notNull(),
    amount: money("amount").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    ...audit,
  },
  (t) => [index("plan_incomes_plan_idx").on(t.bookId, t.planId)],
)

export const planAllocations = mysqlTable(
  "plan_allocations",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    planId: ref("plan_id")
      .notNull()
      .references(() => monthlyPlans.id),
    kind: mysqlEnum("kind", ["expense", "investment"]).notNull(),
    categoryId: ref("category_id").references(() => categories.id),
    investmentTypeId: ref("investment_type_id").references(() => investmentTypes.id),
    mode: mysqlEnum("mode", ["amount", "percent"]).notNull().default("amount"),
    amount: money("amount").notNull().default(sql`0`),
    percentBp: int("percent_bp").notNull().default(0),
    carriedOver: money("carried_over").notNull().default(sql`0`),
    ...audit,
  },
  (t) => [
    index("plan_alloc_plan_idx").on(t.bookId, t.planId),
    index("plan_alloc_category_idx").on(t.bookId, t.categoryId),
    check(
      "plan_alloc_target",
      sql`(${t.kind} = 'expense' AND ${t.categoryId} IS NOT NULL AND ${t.investmentTypeId} IS NULL) OR (${t.kind} = 'investment' AND ${t.investmentTypeId} IS NOT NULL AND ${t.categoryId} IS NULL)`,
    ),
  ],
)

// Langganan (TSD §6, PB-05). amount_idr disimpan saat disimpan supaya BR-40 tidak bergantung kurs harian.
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 60 }).notNull(),
    serviceKey: varchar("service_key", { length: 32 }),
    currency: char("currency", { length: 3 }).notNull().default("IDR"),
    originalAmount: units("original_amount").notNull(),
    /** Kurs manual (IDR per 1 unit). null = kurs otomatis dari reference_rates saat disimpan. */
    fxRate: units("fx_rate"),
    amountIdr: money("amount_idr").notNull(),
    cycle: mysqlEnum("cycle", ["monthly", "yearly"]).notNull(),
    billingDay: int("billing_day").notNull(),
    billingMonth: int("billing_month"),
    walletId: ref("wallet_id")
      .notNull()
      .references(() => wallets.id),
    categoryId: ref("category_id").references(() => categories.id),
    startDate: date("start_date", { mode: "string" }).notNull(),
    pausedAt: timestamp("paused_at"),
    /** Bulan terakhir pengingat H-3 terkirim; mencegah pengingat ganda (#30). */
    remindedPeriod: month("reminded_period"),
    ...audit,
  },
  (t) => [
    index("subscriptions_book_idx").on(t.bookId, t.deletedAt),
    check("subscriptions_day", sql`${t.billingDay} between 1 and 31`),
    check("subscriptions_month", sql`${t.billingMonth} is null or ${t.billingMonth} between 1 and 12`),
    check("subscriptions_amount_pos", sql`${t.amountIdr} > 0`),
  ],
)

/** Kurs dan harga emas global (bukan data buku). Nilai terbaru per (kind, currency) dipakai. */
export const referenceRates = mysqlTable(
  "reference_rates",
  {
    id: id().primaryKey(),
    kind: mysqlEnum("kind", ["gold_gram", "fx"]).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    value: units("value").notNull(),
    fetchedAt: timestamp("fetched_at").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("reference_rates_kind_currency_idx").on(t.kind, t.currency, t.fetchedAt)],
)
