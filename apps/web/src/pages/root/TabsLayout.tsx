import { Outlet } from "@tanstack/react-router"
import { useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { Button } from "@/components/Button"
import { Sheet } from "@/components/Sheet"
import { OfflineBanner } from "@/components/States"
import { useActiveBook } from "@/features/books"
import { AddTransactionForm } from "@/features/transactions"
import { showSnackbar } from "@/lib/snackbar"

/** Shell layar tab: konten + bottom nav + sheet Catat transaksi (ADR 0001). Scan struk di #36. */
export function TabsLayout() {
  const book = useActiveBook()
  const [sheet, setSheet] = useState<"add" | "scan" | null>(null)
  // Kunci sheet baru tiap dibuka supaya form dan Idempotency-Key selalu baru.
  const [openCount, setOpenCount] = useState(0)
  const close = () => setSheet(null)
  const open = (s: "add" | "scan") => {
    setOpenCount((n) => n + 1)
    setSheet(s)
  }
  return (
    <div className="app-shell">
      <OfflineBanner />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav onAdd={() => open("add")} onScan={() => open("scan")} />
      <Sheet open={sheet === "add"} title="Catat transaksi" onClose={close}>
        {book ? (
          <AddTransactionForm
            key={openCount}
            bookId={book.id}
            onSaved={() => {
              close()
              showSnackbar("Transaksi dicatat")
            }}
          />
        ) : null}
        <button type="button" className="link-row" onClick={() => open("scan")}>
          Scan struk
        </button>
      </Sheet>
      <Sheet
        open={sheet === "scan"}
        title="Scan struk"
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
