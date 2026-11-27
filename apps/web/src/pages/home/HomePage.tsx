import { useApiHealth } from "@/features/health"

export function HomePage() {
  const health = useApiHealth()
  const apiOk = health.isSuccess
  const dbOk = health.data?.db === "up"

  return (
    <>
      <h1 className="title">Vynance</h1>
      <p className="muted">Kerangka aplikasi berjalan. Fitur dibangun lewat tiket development.</p>
      <section className="card" style={{ marginTop: 24 }} aria-live="polite">
        <div className="status-row">
          <span>API</span>
          <span className={`pill ${apiOk ? "pill-ok" : "pill-bad"}`}>
            {health.isPending ? "Memeriksa…" : apiOk ? "Tersambung" : "Tidak tersambung"}
          </span>
        </div>
        <div className="status-row">
          <span>Database</span>
          <span className={`pill ${dbOk ? "pill-ok" : "pill-bad"}`}>
            {health.isPending ? "Memeriksa…" : dbOk ? "Tersambung" : "Tidak tersambung"}
          </span>
        </div>
      </section>
    </>
  )
}
