import { bookCodeFromBytes } from "@vynance/shared"
import { eq } from "drizzle-orm"
import { createDb } from "./client"
import { bookMembers, bookSettings, books, users } from "./schema"

// Seed data development. Dijalankan: bun run db:seed. Menolak jalan di produksi.
// Masuk dengan email demo@vynance.local (kode OTP tampil di log api).

type Db = ReturnType<typeof createDb>
type Seeder = { name: string; run: (db: Db) => Promise<void> }

const DEMO_USER = "01JSEEDDEM0VSER00000000000"
const DEMO_BOOK = "01JSEEDDEM0B00K00000000000"

const SEEDERS: Seeder[] = [
  {
    name: "pengguna contoh + buku Keluarga Contoh",
    run: async (db) => {
      const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.id, DEMO_USER))
      if (exists) return
      await db.insert(users).values({ id: DEMO_USER, name: "Demo", email: "demo@vynance.local", emailVerified: true })
      const code = bookCodeFromBytes(crypto.getRandomValues(new Uint8Array(8)))
      await db.insert(books).values({ id: DEMO_BOOK, code, name: "Keluarga Contoh", createdBy: DEMO_USER })
      await db
        .insert(bookMembers)
        .values({ id: "01JSEEDDEM0MEMBER000000000", bookId: DEMO_BOOK, userId: DEMO_USER, createdBy: DEMO_USER })
      await db.insert(bookSettings).values({ bookId: DEMO_BOOK, createdBy: DEMO_USER })
    },
  },
]

const nodeEnv = Bun.env.NODE_ENV ?? "development"
if (nodeEnv === "production") {
  console.error("db:seed dilarang di produksi")
  process.exit(1)
}

const db = createDb(Bun.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance")
for (const s of SEEDERS) {
  await s.run(db)
  console.log(`seed: ${s.name}`)
}
console.log(`seed selesai (${SEEDERS.length} seeder)`)
await db.$client.end()
