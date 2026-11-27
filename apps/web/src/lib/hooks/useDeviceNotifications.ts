import { useEffect, useRef, useState } from "react"

type Item = { id: string; readAt: string | null; title: string; body: string }

function permissionNow(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission
}

/**
 * Notifikasi perangkat saat aplikasi terbuka (PB-12 langkah 6). Hanya setelah izin eksplisit pengguna;
 * item yang sudah ada saat pertama dimuat tidak ditampilkan ulang. Teks tanpa nominal (aman mode privasi).
 * Web push saat aplikasi tertutup butuh service worker (PWA, #44).
 */
export function useDeviceNotifications(items: readonly Item[] | undefined): {
  permission: NotificationPermission | "unsupported"
  request: () => Promise<void>
} {
  const [permission, setPermission] = useState(permissionNow)
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!items) return
    if (seen.current === null) {
      seen.current = new Set(items.map((i) => i.id))
      return
    }
    for (const i of items) {
      if (seen.current.has(i.id)) continue
      seen.current.add(i.id)
      if (i.readAt === null && permissionNow() === "granted") {
        try {
          new Notification(i.title, { body: i.body, tag: i.id })
        } catch {
          // Beberapa browser seluler hanya mengizinkan notifikasi lewat service worker.
        }
      }
    }
  }, [items])

  const request = async () => {
    if (typeof Notification === "undefined") return
    setPermission(await Notification.requestPermission())
  }
  return { permission, request }
}
