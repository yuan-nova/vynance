import { bookMembers, bookSettings, books, type Executor, transactions } from "@vynance/db"
import type { Book, DeletedBook } from "@vynance/shared"
import { and, asc, count, desc, eq, gt, inArray, isNotNull, isNull } from "drizzle-orm"

type BookRow = { id: string; name: string; code: string; createdAt: Date; memberCount: number }

const activeMembers = (bookId: typeof books.id | string) =>
  and(eq(bookMembers.bookId, bookId), isNull(bookMembers.leftAt), isNull(bookMembers.deletedAt))

// books dan book_members adalah tabel global: query difilter userId keanggotaan (CODING-GUIDELINES §6.4).
export class BooksRepository {
  constructor(private readonly db: Executor) {}

  /** Buku aktif (belum dihapus) tempat pengguna menjadi anggota aktif. */
  async listForUser(userId: string): Promise<Book[]> {
    const mine = this.db
      .select({ bookId: bookMembers.bookId })
      .from(bookMembers)
      .where(and(eq(bookMembers.userId, userId), isNull(bookMembers.leftAt), isNull(bookMembers.deletedAt)))
    const rows = await this.db
      .select({
        id: books.id,
        name: books.name,
        code: books.code,
        createdAt: books.createdAt,
        memberCount: count(bookMembers.id),
      })
      .from(books)
      .innerJoin(bookMembers, activeMembers(books.id))
      .where(and(isNull(books.deletedAt), inArray(books.id, mine)))
      .groupBy(books.id)
      .orderBy(asc(books.createdAt), asc(books.id))
    return rows.map(toBook)
  }

  /** Buku bila pengguna anggota aktif dan buku belum dihapus; selain itu null (BR-52, TSD §5.2). */
  async findForMember(bookId: string, userId: string): Promise<Book | null> {
    const member = await this.isActiveMember(bookId, userId)
    if (!member) return null
    const [row] = await this.db
      .select({
        id: books.id,
        name: books.name,
        code: books.code,
        createdAt: books.createdAt,
        memberCount: count(bookMembers.id),
      })
      .from(books)
      .innerJoin(bookMembers, activeMembers(books.id))
      .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
      .groupBy(books.id)
    return row ? toBook(row) : null
  }

  async isActiveMember(bookId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: bookMembers.id })
      .from(bookMembers)
      .innerJoin(books, and(eq(books.id, bookMembers.bookId), isNull(books.deletedAt)))
      .where(and(activeMembers(bookId), eq(bookMembers.userId, userId)))
      .limit(1)
    return Boolean(row)
  }

  /** Insert buku. Mengembalikan "duplicate_code" bila kode bentrok (indeks unik books_code_uq). */
  async insert(v: { id: string; code: string; name: string; createdBy: string }): Promise<"ok" | "duplicate_code"> {
    try {
      await this.db.insert(books).values(v)
      return "ok"
    } catch (e: unknown) {
      if (isDuplicate(e, "books_code_uq")) return "duplicate_code"
      throw e
    }
  }

  async addMember(v: { id: string; bookId: string; userId: string; createdBy: string }): Promise<void> {
    await this.db.insert(bookMembers).values(v)
  }

  async insertSettings(bookId: string, createdBy: string): Promise<void> {
    await this.db.insert(bookSettings).values({ bookId, createdBy })
  }

  /** BR-52: sembunyikan dari semua anggota; bisa dipulihkan sampai `purgeAfter`. */
  async softDelete(bookId: string, at: Date, purgeAfter: Date): Promise<void> {
    await this.db
      .update(books)
      .set({ deletedAt: at, purgeAfter })
      .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
  }

  /** Buku terhapus yang masih dalam masa pulih, tempat pengguna anggota aktif. */
  async listDeletedForUser(userId: string, now: Date): Promise<DeletedBook[]> {
    const rows = await this.db
      .select({
        id: books.id,
        name: books.name,
        code: books.code,
        deletedAt: books.deletedAt,
        purgeAfter: books.purgeAfter,
      })
      .from(books)
      .innerJoin(bookMembers, and(activeMembers(books.id), eq(bookMembers.userId, userId)))
      .where(and(isNotNull(books.deletedAt), gt(books.purgeAfter, now)))
      .orderBy(desc(books.deletedAt))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      deletedAt: r.deletedAt?.toISOString() ?? "",
      purgeAfter: r.purgeAfter?.toISOString() ?? "",
    }))
  }

  /** Pulihkan bila pengguna anggota aktif dan masa pulih belum lewat; selain itu false. */
  async restore(bookId: string, userId: string, now: Date): Promise<boolean> {
    const [member] = await this.db
      .select({ id: bookMembers.id })
      .from(bookMembers)
      .innerJoin(books, eq(books.id, bookMembers.bookId))
      .where(
        and(
          activeMembers(bookId),
          eq(bookMembers.userId, userId),
          isNotNull(books.deletedAt),
          gt(books.purgeAfter, now),
        ),
      )
      .limit(1)
    if (!member) return false
    await this.db.update(books).set({ deletedAt: null, purgeAfter: null }).where(eq(books.id, bookId))
    return true
  }

  async transactionCount(bookId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count(transactions.id) })
      .from(transactions)
      .where(and(eq(transactions.bookId, bookId), isNull(transactions.deletedAt)))
    return Number(row?.n ?? 0)
  }

  async rename(bookId: string, name: string): Promise<void> {
    await this.db
      .update(books)
      .set({ name })
      .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
  }
}

function toBook(r: BookRow): Book {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    memberCount: Number(r.memberCount),
    createdAt: r.createdAt.toISOString(),
  }
}

function isDuplicate(e: unknown, index: string): boolean {
  const cause = e instanceof Error && "cause" in e ? e.cause : e
  if (!(cause instanceof Error)) return false
  const errno = "errno" in cause ? cause.errno : undefined
  return errno === 1062 && cause.message.includes(index)
}
