import { useEffect, useRef } from "react"

/**
 * Satu koneksi SSE per buku aktif (TSD §8.1, NFR-03). `onInvalidate` dipanggil dengan kunci sumber daya
 * yang berubah. Koneksi ditutup saat buku berganti atau layout dilepas (logout). EventSource menyambung
 * ulang sendiri bila jaringan putus.
 */
export function useBookRealtime(bookId: string | null, onInvalidate: (keys: string[]) => void): void {
  const handler = useRef(onInvalidate)
  handler.current = onInvalidate

  useEffect(() => {
    if (!bookId || typeof EventSource === "undefined") return
    const source = new EventSource(`/api/v1/books/${bookId}/events`)
    const onMessage = (e: MessageEvent<string>) => {
      try {
        const data = JSON.parse(e.data) as { keys?: unknown }
        const keys = Array.isArray(data.keys) ? data.keys.filter((k): k is string => typeof k === "string") : []
        handler.current(keys)
      } catch {
        handler.current([])
      }
    }
    source.addEventListener("invalidate", onMessage)
    return () => {
      source.removeEventListener("invalidate", onMessage)
      source.close()
    }
  }, [bookId])
}
