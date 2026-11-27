import { sql } from "drizzle-orm"
import { check, date, index, mysqlEnum, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, money, month, ref, timestamp } from "./columns"

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
    ...audit,
  },
  (t) => [
    index("tx_book_date_idx").on(t.bookId, t.txDate, t.id),
    index("tx_book_wallet_date_idx").on(t.bookId, t.walletId, t.txDate),
    index("tx_book_to_wallet_idx").on(t.bookId, t.toWalletId),
    index("tx_book_category_date_idx").on(t.bookId, t.categoryId, t.txDate),
    uniqueIndex("tx_book_idem_uq").on(t.bookId, t.idempotencyKey),
    uniqueIndex("tx_subscription_period_uq").on(t.subscriptionId, t.subscriptionPeriod),
    check("tx_amount_positive", sql`${t.amount} > 0`),
    check(
      "tx_transfer_wallets",
      sql`${t.type} <> 'transfer' OR (${t.toWalletId} IS NOT NULL AND ${t.toWalletId} <> ${t.walletId})`,
    ),
  ],
)
