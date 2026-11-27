import { Pill } from "@/components/Pill"
import { Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useApiHealth } from "@/features/health"

/** Beranda sementara: status koneksi. Isi Beranda dibangun di tiket #16. */
export function HomePage() {
  const health = useApiHealth()
  const apiOk = health.isSuccess
  const dbOk = health.data?.db === "up"

  return (
    <>
      <TopBar level={1} title="Beranda" />
      {health.isPending ? (
        <Skeleton rows={2} height={44} />
      ) : (
        <section className="card" aria-live="polite">
          <div className="status-row">
            <span>API</span>
            <Pill tone={apiOk ? "inc" : "exp"}>{apiOk ? "Tersambung" : "Tidak tersambung"}</Pill>
          </div>
          <div className="status-row">
            <span>Database</span>
            <Pill tone={dbOk ? "inc" : "exp"}>{dbOk ? "Tersambung" : "Tidak tersambung"}</Pill>
          </div>
        </section>
      )}
    </>
  )
}
