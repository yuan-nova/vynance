import { container } from "@vynance/api/container"
import { createJobs, runJobsOnce } from "@vynance/api/jobs"

// Worker job terjadwal (TSD §9). Proses terpisah dari api; semua job idempoten.
// Jadwal sederhana: jalankan saat start lalu tiap WORKER_INTERVAL_MS (bawaan 1 jam).

const interval = Number(Bun.env.WORKER_INTERVAL_MS ?? 3_600_000)
const jobs = createJobs(container)

let running = false
async function tick(): Promise<void> {
  // Jangan tumpuk putaran bila putaran sebelumnya belum selesai.
  if (running) return
  running = true
  try {
    await runJobsOnce(jobs)
  } finally {
    running = false
  }
}

await tick()
setInterval(() => void tick(), interval)
