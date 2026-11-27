// Pub/sub event buku di memori (TSD §8.1). Satu instance api cukup; bila lebih, ganti dengan Redis pub/sub.

type BookEvent = { type: "invalidate"; keys: string[]; actorId: string }
type Listener = (e: BookEvent) => void

export class BookEvents {
  private readonly listeners = new Map<string, Set<Listener>>()

  subscribe(bookId: string, fn: Listener): () => void {
    let set = this.listeners.get(bookId)
    if (!set) {
      set = new Set()
      this.listeners.set(bookId, set)
    }
    set.add(fn)
    return () => {
      set.delete(fn)
      if (set.size === 0) this.listeners.delete(bookId)
    }
  }

  publish(bookId: string, e: BookEvent): void {
    for (const fn of this.listeners.get(bookId) ?? []) {
      try {
        fn(e)
      } catch {
        // Koneksi yang rusak tidak boleh menggagalkan permintaan penulis.
      }
    }
  }

  /** Jumlah koneksi aktif per buku (untuk test). */
  count(bookId: string): number {
    return this.listeners.get(bookId)?.size ?? 0
  }
}

export const bookEvents = new BookEvents()
