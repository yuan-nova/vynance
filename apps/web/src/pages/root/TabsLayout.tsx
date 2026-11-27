import { Outlet } from "@tanstack/react-router"
import { useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { Button } from "@/components/Button"
import { Sheet } from "@/components/Sheet"
import { OfflineBanner } from "@/components/States"

/** Shell layar tab: konten + bottom nav. Sheet Catat transaksi diisi di tiket #11, Scan di #36. */
export function TabsLayout() {
  const [sheet, setSheet] = useState<"add" | "scan" | null>(null)
  const close = () => setSheet(null)
  return (
    <div className="app-shell">
      <OfflineBanner />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav onAdd={() => setSheet("add")} onScan={() => setSheet("scan")} />
      <Sheet
        open={sheet !== null}
        title={sheet === "scan" ? "Scan struk" : "Catat transaksi"}
        onClose={close}
        footer={
          <Button variant="ghost" full onClick={close}>
            Tutup
          </Button>
        }
      >
        <p className="body">Segera hadir.</p>
      </Sheet>
    </div>
  )
}
