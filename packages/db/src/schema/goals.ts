import { sql } from "drizzle-orm"
import { check, date, foreignKey, index, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, money, ref } from "./columns"
import { transactions, wallets } from "./money"

// Target tabungan (TSD §6, PB-07). Terkumpul = initial_amount + Σ setoran (TSD §6.4).

export const savingsGoals = mysqlTable(
  "savings_goals",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 60 }).notNull(),
    icon: varchar("icon", { length: 32 }).notNull(),
    targetAmount: money("target_amount").notNull(),
    initialAmount: money("initial_amount").notNull().default(sql`0`),
    targetDate: date("target_date", { mode: "string" }),
    walletId: ref("wallet_id").references(() => wallets.id),
    note: varchar("note", { length: 200 }),
    ...audit,
  },
  (t) => [
    index("savings_goals_book_idx").on(t.bookId, t.deletedAt),
    check("savings_goals_target_pos", sql`${t.targetAmount} > 0`),
    check("savings_goals_initial_nonneg", sql`${t.initialAmount} >= 0`),
  ],
)

export const goalContributions = mysqlTable(
  "goal_contributions",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    goalId: ref("goal_id").notNull(),
    amount: money("amount").notNull(),
    contributedOn: date("contributed_on", { mode: "string" }).notNull(),
    transactionId: ref("transaction_id"),
    ...audit,
  },
  (t) => [
    index("goal_contributions_goal_idx").on(t.bookId, t.goalId, t.contributedOn),
    foreignKey({ columns: [t.goalId], foreignColumns: [savingsGoals.id], name: "goal_contributions_goal_fk" }),
    foreignKey({
      columns: [t.transactionId],
      foreignColumns: [transactions.id],
      name: "goal_contributions_tx_fk",
    }),
    check("goal_contributions_amount_pos", sql`${t.amount} > 0`),
  ],
)
