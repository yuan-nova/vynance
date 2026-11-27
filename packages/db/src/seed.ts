import { createDb } from "./client"

// Seed data development. Dijalankan: bun run db:seed. Menolak jalan di produksi.
// Seeder tiap fitur (pengguna contoh, buku contoh) ditambahkan ke SEEDERS saat tabelnya dibuat.

type Seeder = { name: string; run: (db: ReturnType<typeof createDb>) => Promise<void> }

const SEEDERS: Seeder[] = []

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
