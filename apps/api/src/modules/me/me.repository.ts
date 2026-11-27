import { type Executor, users } from "@vynance/db"
import type { Me, UpdateMeInput } from "@vynance/shared"
import { eq } from "drizzle-orm"

// Profil pengguna. Tabel users bukan data buku, jadi difilter userId (CODING-GUIDELINES §6.4).
export class MeRepository {
  constructor(private readonly db: Executor) {}

  async findById(userId: string): Promise<Me | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1)
    return row ? toMe(row) : null
  }

  async markOnboarded(userId: string, at: Date): Promise<void> {
    await this.db.update(users).set({ onboardedAt: at }).where(eq(users.id, userId))
  }

  async update(userId: string, input: UpdateMeInput): Promise<void> {
    await this.db.update(users).set(input).where(eq(users.id, userId))
  }
}

function toMe(row: typeof users.$inferSelect): Me {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    locale: row.locale,
    theme: row.theme,
    privacyMode: row.privacyMode,
    lastBookId: row.lastBookId,
    onboardedAt: row.onboardedAt?.toISOString() ?? null,
  }
}
