import { activityLogs, bookMembers, type Executor, users } from "@vynance/db"
import { and, asc, count, desc, eq, isNull } from "drizzle-orm"

type MemberRow = { userId: string; name: string; email: string; joinedAt: Date }

const active = (bookId: string) =>
  and(eq(bookMembers.bookId, bookId), isNull(bookMembers.leftAt), isNull(bookMembers.deletedAt))

// book_members tabel global: selalu difilter bookId (CODING-GUIDELINES §6.4).
export class MembersRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<MemberRow[]> {
    return this.db
      .select({ userId: bookMembers.userId, name: users.name, email: users.email, joinedAt: bookMembers.joinedAt })
      .from(bookMembers)
      .innerJoin(users, eq(users.id, bookMembers.userId))
      .where(active(bookId))
      .orderBy(asc(bookMembers.joinedAt), asc(bookMembers.id))
  }

  async activeCount(bookId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count(bookMembers.id) })
      .from(bookMembers)
      .where(active(bookId))
    return Number(row?.n ?? 0)
  }

  async isActive(bookId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: bookMembers.id })
      .from(bookMembers)
      .where(and(active(bookId), eq(bookMembers.userId, userId)))
      .limit(1)
    return Boolean(row)
  }

  /** BR-53: akses hilang; catatan lama tetap atas namanya. */
  async leave(bookId: string, userId: string, at: Date): Promise<void> {
    await this.db
      .update(bookMembers)
      .set({ leftAt: at })
      .where(and(active(bookId), eq(bookMembers.userId, userId)))
  }

  activities(
    bookId: string,
    limit: number,
  ): Promise<
    {
      id: string
      action: string
      entityType: string
      summary: Record<string, string> | null
      createdAt: Date
      actorName: string | null
    }[]
  > {
    return this.db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        summary: activityLogs.summary,
        createdAt: activityLogs.createdAt,
        actorName: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(users.id, activityLogs.actorId))
      .where(eq(activityLogs.bookId, bookId))
      .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
      .limit(limit)
  }
}
