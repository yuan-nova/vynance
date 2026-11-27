import { bookInvitations, bookMembers, books, type Executor, users } from "@vynance/db"
import { and, desc, eq, isNull } from "drizzle-orm"
import { alias } from "drizzle-orm/mysql-core"

type InvitationRow = {
  id: string
  bookId: string
  createdAt: Date
  expiresAt: Date
  usedAt: Date | null
  revokedAt: Date | null
  createdByName: string | null
  usedByName: string | null
}

const creator = alias(users, "creator")
const user = alias(users, "used_user")

const cols = {
  id: bookInvitations.id,
  bookId: bookInvitations.bookId,
  createdAt: bookInvitations.createdAt,
  expiresAt: bookInvitations.expiresAt,
  usedAt: bookInvitations.usedAt,
  revokedAt: bookInvitations.revokedAt,
  createdByName: creator.name,
  usedByName: user.name,
}

// book_invitations tabel global: query buku difilter bookId; pencarian token lewat hash unik (TSD §5.4).
export class InvitationsRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string, limit = 20): Promise<InvitationRow[]> {
    return this.db
      .select(cols)
      .from(bookInvitations)
      .leftJoin(creator, eq(creator.id, bookInvitations.createdBy))
      .leftJoin(user, eq(user.id, bookInvitations.usedBy))
      .where(and(eq(bookInvitations.bookId, bookId), isNull(bookInvitations.deletedAt)))
      .orderBy(desc(bookInvitations.createdAt))
      .limit(limit)
  }

  async findById(bookId: string, id: string): Promise<InvitationRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(bookInvitations)
      .leftJoin(creator, eq(creator.id, bookInvitations.createdBy))
      .leftJoin(user, eq(user.id, bookInvitations.usedBy))
      .where(and(eq(bookInvitations.bookId, bookId), eq(bookInvitations.id, id), isNull(bookInvitations.deletedAt)))
      .limit(1)
    return row ?? null
  }

  /** Undangan + buku dari hash token. Buku terhapus tidak dikembalikan. */
  async findByTokenHash(tokenHash: string): Promise<(InvitationRow & { bookName: string; bookCode: string }) | null> {
    const [row] = await this.db
      .select({ ...cols, bookName: books.name, bookCode: books.code })
      .from(bookInvitations)
      .innerJoin(books, and(eq(books.id, bookInvitations.bookId), isNull(books.deletedAt)))
      .leftJoin(creator, eq(creator.id, bookInvitations.createdBy))
      .leftJoin(user, eq(user.id, bookInvitations.usedBy))
      .where(and(eq(bookInvitations.tokenHash, tokenHash), isNull(bookInvitations.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: {
    id: string
    bookId: string
    tokenHash: string
    expiresAt: Date
    createdBy: string
  }): Promise<void> {
    await this.db.insert(bookInvitations).values(v)
  }

  async revoke(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(bookInvitations)
      .set({ revokedAt: at })
      .where(and(eq(bookInvitations.bookId, bookId), eq(bookInvitations.id, id), isNull(bookInvitations.revokedAt)))
  }

  /** Tandai dipakai hanya bila masih aktif (cegah dua orang memakai token sama). */
  async markUsed(id: string, userId: string, at: Date): Promise<boolean> {
    const [res] = await this.db
      .update(bookInvitations)
      .set({ usedAt: at, usedBy: userId })
      .where(and(eq(bookInvitations.id, id), isNull(bookInvitations.usedAt), isNull(bookInvitations.revokedAt)))
    return res.affectedRows === 1
  }

  /** Keanggotaan pengguna di buku, aktif atau pernah keluar. */
  async membership(bookId: string, userId: string): Promise<{ id: string; leftAt: Date | null } | null> {
    const [row] = await this.db
      .select({ id: bookMembers.id, leftAt: bookMembers.leftAt })
      .from(bookMembers)
      .where(and(eq(bookMembers.bookId, bookId), eq(bookMembers.userId, userId), isNull(bookMembers.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async addMember(v: { id: string; bookId: string; userId: string; createdBy: string }): Promise<void> {
    await this.db.insert(bookMembers).values(v)
  }

  /** Aktifkan ulang anggota yang pernah keluar (TSD §5.4). */
  async rejoin(memberId: string, at: Date): Promise<void> {
    await this.db.update(bookMembers).set({ leftAt: null, joinedAt: at }).where(eq(bookMembers.id, memberId))
  }
}
