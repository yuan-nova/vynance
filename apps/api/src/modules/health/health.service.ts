import type { Health } from "@vynance/shared"
import type { HealthRepository } from "./health.repository"

export class HealthService {
  constructor(private readonly repo: HealthRepository) {}

  async check(now: Date): Promise<Health> {
    const dbUp = await this.repo.ping()
    return { status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down", time: now.toISOString() }
  }
}
