import { type Executor, investmentTypes } from "@vynance/db"

// Jenis investasi (TSD §6.2). Daftar dan CRUD lengkap di #31; di sini insert untuk data bawaan.
export class InvestmentTypesRepository {
  constructor(private readonly db: Executor) {}

  async insertMany(
    rows: { id: string; bookId: string; name: string; icon: string; sortOrder: number; createdBy: string }[],
  ): Promise<void> {
    if (rows.length) await this.db.insert(investmentTypes).values(rows)
  }
}
