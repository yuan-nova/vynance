import { useNavigate } from "@tanstack/react-router"
import { formatRelative, notificationText } from "@vynance/shared"
import { Button } from "@/components/Button"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { useNotifications, useReadAllNotifications } from "@/features/notifications"
import { useDeviceNotifications } from "@/lib/hooks/useDeviceNotifications"

/** Notifikasi buku aktif (PB-12 langkah 6): peringatan anggaran 90%/100% untuk semua anggota. */
export function NotificationsPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const q = useNotifications(bookId)
  const readAll = useReadAllNotifications(bookId)
  const items = q.data?.items.map((n) => ({ ...n, ...notificationText(n) }))
  const device = useDeviceNotifications(items)
  const now = new Date()

  return (
    <>
      <TopBar level={2} title="Notifikasi" backLabel="Kembali ke Beranda" onBack={() => void navigate({ to: "/" })} />
      {device.permission === "default" ? (
        <section className="card notify-perm">
          <p className="body">Tampilkan peringatan anggaran sebagai notifikasi perangkat saat Vynance terbuka?</p>
          <Button variant="soft" full icon="bell" onClick={() => void device.request()}>
            Izinkan notifikasi perangkat
          </Button>
        </section>
      ) : null}
      {q.isPending ? <Skeleton rows={3} /> : null}
      {q.isError ? (
        <ErrorState message="Notifikasi gagal dimuat." onRetry={() => void q.refetch()} retrying={q.isFetching} />
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Belum ada notifikasi"
          body="Kamu akan diberi tahu saat kategori anggaran mencapai 90% dan 100%."
        />
      ) : null}
      {items && items.length > 0 ? (
        <section className="section">
          {q.data && q.data.unread > 0 ? (
            <Button variant="ghost" full loading={readAll.isPending} onClick={() => readAll.mutate()}>
              Tandai semua sudah dibaca ({q.data.unread})
            </Button>
          ) : null}
          <ul className="plain-list card">
            {items.map((n) => (
              <li key={n.id} className={`activity-row${n.readAt ? "" : " notify-unread"}`}>
                <p className="row-title">{n.title}</p>
                <p className="body">{n.body}</p>
                <p className="row-sub">
                  {formatRelative(new Date(n.createdAt), now)}
                  {n.readAt ? "" : " · baru"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
