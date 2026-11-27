import { useQueryClient } from "@tanstack/react-query"
import { Outlet } from "@tanstack/react-router"
import { notificationText } from "@vynance/shared"
import { useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { Button } from "@/components/Button"
import { PullIndicator } from "@/components/PullIndicator"
import { Sheet } from "@/components/Sheet"
import { OfflineBanner } from "@/components/States"
import { useActiveBook } from "@/features/books"
import { useNotifications } from "@/features/notifications"
import { AddTransactionForm, ScanFlow, useOutboxCount, useOutboxSync } from "@/features/transactions"
import { useBookRealtime } from "@/lib/hooks/useBookRealtime"
import { useDeviceNotifications } from "@/lib/hooks/useDeviceNotifications"
import { usePullToRefresh } from "@/lib/hooks/usePullToRefresh"
import { qk } from "@/lib/query-keys"
import { showSnackbar } from "@/lib/snackbar"

/** Shell layar tab: konten + bottom nav + sheet Catat transaksi dan Scan struk (ADR 0001, PB-03). */
export function TabsLayout() {
  const book = useActiveBook()
  const qc = useQueryClient()
  const notes = useNotifications(book?.id ?? "")
  useDeviceNotifications(notes.data?.items.map((n) => ({ ...n, ...notificationText(n) })))
  // Realtime antar anggota (NFR-03): perubahan dari perangkat lain meng-invalidate data buku.
  useBookRealtime(book?.id ?? null, (keys) => {
    if (!book) return
    void qc.invalidateQueries({ queryKey: qk.book(book.id) })
    // Nama buku, anggota, atau buku dihapus memengaruhi daftar buku dan guard.
    if (keys.includes("book") || keys.includes("members") || keys.includes("leave")) {
      void qc.invalidateQueries({ queryKey: qk.books() })
    }
  })
  // Tarik untuk muat ulang: ambil ulang semua data buku aktif + profil (FR-150).
  const pull = usePullToRefresh(() =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.me() }),
      book ? qc.invalidateQueries({ queryKey: qk.book(book.id) }) : null,
    ]),
  )
  // Antrean offline (NFR-04): kirim saat online, beri tahu hasilnya.
  const pending = useOutboxCount()
  useOutboxSync((sent, rejected) =>
    showSnackbar(
      rejected > 0
        ? `${sent} transaksi tersinkron, ${rejected} ditolak server. Periksa daftar transaksi.`
        : `${sent} transaksi offline tersinkron`,
      rejected > 0 ? { tone: "error" } : undefined,
    ),
  )
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
      <OfflineBanner pending={pending} />
      <PullIndicator state={pull} />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav onAdd={() => open("add")} onScan={() => open("scan")} />
      <Sheet open={sheet === "add"} title="Catat transaksi" onClose={close}>
        {book ? (
          <AddTransactionForm
            key={openCount}
            bookId={book.id}
            onSaved={(o) => {
              close()
              showSnackbar(o?.queued ? "Disimpan di perangkat, akan disinkronkan saat online" : "Transaksi dicatat")
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
        {book ? (
          <ScanFlow
            key={openCount}
            bookId={book.id}
            onSaved={(n) => {
              close()
              showSnackbar(`${n} transaksi dicatat`)
            }}
          />
        ) : null}
      </Sheet>
    </div>
  )
}
