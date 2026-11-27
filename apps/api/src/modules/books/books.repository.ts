import { bookMembers, bookSettings, books, type Executor } from "@vynance/db"
import type { Book } from "@vynance/shared"
import { and, asc, count, eq, inArray, isNull } from "drizzle-orm"

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
