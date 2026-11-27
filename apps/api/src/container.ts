import { db } from "./db/client"
import { HealthRepository } from "./modules/health/health.repository"
import { HealthService } from "./modules/health/health.service"

// Composition root: satu-satunya tempat membuat instance repository dan service (CODING-GUIDELINES §3.1 butir 6).
const healthRepository = new HealthRepository(db)

export const container = {
  healthService: new HealthService(healthRepository),
}
