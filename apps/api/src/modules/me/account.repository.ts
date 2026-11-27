import {
  accounts,
  bookMembers,
  books,
  categories,
  type Executor,
  goalContributions,
  monthlyPlans,
  planAllocations,
  planIncomes,
  savingsGoals,
  sessions,
  transactions,
  users,
  verifications,
  wallets,
} from "@vynance/db"
import { and, asc, count, eq, inArray, isNull, like, ne } from "drizzle-orm"

// Ekspor dan hapus akun (NFR-08). Data buku selalu difilter book_id milik buku tempat pengguna anggota aktif.
export class AccountRepository {
  constructor(private readonly db: Executor) {}

  /** Buku aktif tempat pengguna menjadi anggota. */
  memberBooks(userId: string): Promise<{ id: string; name: string; code: string; createdAt: Date }[]> {
    return this.db
      .select({ id: books.id, name: books.name, code: books.code, createdAt: books.createdAt })
      .from(bookMembers)
      .innerJoin(books, eq(books.id, bookMembers.bookId))
      .where(and(eq(bookMembers.userId, userId), isNull(bookMembers.leftAt), isNull(books.deletedAt)))
      .orderBy(asc(books.createdAt))
  }

  /** Jumlah anggota aktif lain per buku. */
  async otherMemberCounts(userId: string, bookIds: string[]): Promise<Map<string, number>> {
    if (!bookIds.length) return new Map()
    const rows = await this.db
      .select({ bookId: bookMembers.bookId, n: count(bookMembers.id) })
      .from(bookMembers)
      .where(and(inArray(bookMembers.bookId, bookIds), ne(bookMembers.userId, userId), isNull(bookMembers.leftAt)))
      .groupBy(bookMembers.bookId)
    return new Map(rows.map((r) => [r.bookId, r.n]))
  }

  async transactionCounts(bookIds: string[]): Promise<Map<string, number>> {
    if (!bookIds.length) return new Map()
    const rows = await this.db
      .select({ bookId: transactions.bookId, n: count(transactions.id) })
      .from(transactions)
      .where(and(inArray(transactions.bookId, bookIds), isNull(transactions.deletedAt)))
      .groupBy(transactions.bookId)
    return new Map(rows.map((r) => [r.bookId, r.n]))
  }

  /** Semua data satu buku untuk ekspor (tanpa baris terhapus). */
  async bookData(bookId: string) {
    const [w, c, t, p, g] = await Promise.all([
      this.db
        .select({
          id: wallets.id,
          name: wallets.name,
          type: wallets.type,
          openingBalance: wallets.openingBalance,
          creditLimit: wallets.creditLimit,
          archivedAt: wallets.archivedAt,
        })
        .from(wallets)
        .where(and(eq(wallets.bookId, bookId), isNull(wallets.deletedAt))),
      this.db
        .select({
          id: categories.id,
          name: categories.name,
          kind: categories.kind,
          budgetGroup: categories.budgetGroup,
          monthlyBudget: categories.monthlyBudget,
          archivedAt: categories.archivedAt,
        })
        .from(categories)
        .where(and(eq(categories.bookId, bookId), isNull(categories.deletedAt))),
      this.db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          txDate: transactions.txDate,
          walletId: transactions.walletId,
          toWalletId: transactions.toWalletId,
          categoryId: transactions.categoryId,
          note: transactions.note,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(and(eq(transactions.bookId, bookId), isNull(transactions.deletedAt)))
        .orderBy(asc(transactions.txDate), asc(transactions.id)),
      this.db
        .select({
          id: monthlyPlans.id,
          month: monthlyPlans.month,
          spendingCap: monthlyPlans.spendingCap,
          method: monthlyPlans.method,
        })
        .from(monthlyPlans)
        .where(and(eq(monthlyPlans.bookId, bookId), isNull(monthlyPlans.deletedAt))),
      this.db
        .select({
          id: savingsGoals.id,
          name: savingsGoals.name,
          targetAmount: savingsGoals.targetAmount,
          initialAmount: savingsGoals.initialAmount,
          targetDate: savingsGoals.targetDate,
          note: savingsGoals.note,
        })
        .from(savingsGoals)
        .where(and(eq(savingsGoals.bookId, bookId), isNull(savingsGoals.deletedAt))),
    ])
    const [incomes, allocations, contributions] = await Promise.all([
      this.db
        .select({ planId: planIncomes.planId, name: planIncomes.name, amount: planIncomes.amount })
        .from(planIncomes)
        .where(and(eq(planIncomes.bookId, bookId), isNull(planIncomes.deletedAt))),
      this.db
        .select({
          planId: planAllocations.planId,
          kind: planAllocations.kind,
          categoryId: planAllocations.categoryId,
          investmentTypeId: planAllocations.investmentTypeId,
          mode: planAllocations.mode,
          amount: planAllocations.amount,
          percentBp: planAllocations.percentBp,
        })
        .from(planAllocations)
        .where(and(eq(planAllocations.bookId, bookId), isNull(planAllocations.deletedAt))),
      this.db
        .select({
          goalId: goalContributions.goalId,
          amount: goalContributions.amount,
          contributedOn: goalContributions.contributedOn,
        })
        .from(goalContributions)
        .where(and(eq(goalContributions.bookId, bookId), isNull(goalContributions.deletedAt))),
    ])
    return {
      wallets: w,
      categories: c,
      transactions: t,
      plans: p.map((plan) => ({
        ...plan,
        incomes: incomes.filter((i) => i.planId === plan.id),
        allocations: allocations.filter((a) => a.planId === plan.id),
      })),
      goals: g.map((goal) => ({ ...goal, contributions: contributions.filter((x) => x.goalId === goal.id) })),
    }
  }

  /** Keluar dari buku (BR-53): akses hilang, catatan lama tetap atas namanya. */
  async leaveBook(bookId: string, userId: string, at: Date): Promise<void> {
    await this.db
      .update(bookMembers)
      .set({ leftAt: at })
      .where(and(eq(bookMembers.bookId, bookId), eq(bookMembers.userId, userId), isNull(bookMembers.leftAt)))
  }

  /** Hapus buku yang tinggal ia sendiri. Tidak ada anggota tersisa untuk memulihkan → dibersihkan segera. */
  async deleteBook(bookId: string, at: Date): Promise<void> {
    await this.db
      .update(books)
      .set({ deletedAt: at, purgeAfter: at })
      .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
  }

  /** Hapus data pribadi: sesi, akun login, identitas. Baris users dipertahankan (anonim) demi FK created_by. */
  async anonymizeUser(userId: string, email: string): Promise<void> {
    // Kode OTP tertunda menyimpan email di identifier.
    const escaped = email.replace(/[\\%_]/g, (ch) => `\\${ch}`)
    await this.db.delete(verifications).where(like(verifications.identifier, `%${escaped}`))
    await this.db.delete(sessions).where(eq(sessions.userId, userId))
    await this.db.delete(accounts).where(eq(accounts.userId, userId))
    await this.db
      .update(users)
      .set({
        name: "Pengguna terhapus",
        email: `deleted-${userId.toLowerCase()}@deleted.invalid`,
        emailVerified: false,
        image: null,
        lastBookId: null,
        privacyMode: false,
      })
      .where(eq(users.id, userId))
  }
}
