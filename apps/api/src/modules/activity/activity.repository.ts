import { activityLogs, type Executor } from "@vynance/db"

// Log aktivitas buku (FR-04). Ringkasan tidak memuat nominal mentah kecuali untuk tampilan anggota buku.
export class ActivityRepository {
  constructor(private readonly db: Executor) {}

  async record(v: {
    id: string
    bookId: string
    actorId: string
    action: string
    entityType: string
    entityId?: string
    summary?: Record<string, string>
  }): Promise<void> {
    await this.db.insert(activityLogs).values(v)
  }
}
