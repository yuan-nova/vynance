import { logger } from "./lib/logger"
import type { MaintenanceService } from "./modules/maintenance/maintenance.service"

// Daftar job worker (TSD §9). Dirakit dari service di container; worker tidak menyentuh db langsung.

type Job = { name: string; run: (now: Date) => Promise<number> }

export function createJobs(s: { maintenanceService: MaintenanceService }): Job[] {
  return [
    { name: "purge-deleted-books", run: (now) => s.maintenanceService.purgeDeletedBooks(now) },
    { name: "clean-invitations", run: (now) => s.maintenanceService.cleanInvitations(now) },
  ]
}

/** Jalankan semua job sekali. Satu job gagal tidak menghentikan job lain. Log tanpa data pribadi. */
export async function runJobsOnce(jobs: Job[], now = new Date()): Promise<{ name: string; ok: boolean }[]> {
  const results: { name: string; ok: boolean }[] = []
  for (const job of jobs) {
    const started = performance.now()
    try {
      const count = await job.run(now)
      logger.info("job selesai", { job: job.name, count, ms: Math.round(performance.now() - started) })
      results.push({ name: job.name, ok: true })
    } catch (e) {
      logger.error("job gagal", { job: job.name, err: e instanceof Error ? e.name : "unknown" })
      results.push({ name: job.name, ok: false })
    }
  }
  return results
}
