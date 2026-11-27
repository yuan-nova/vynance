import { type CreateTransactionInput, moneyToJson, type OutboxItem, type OutboxSendResult } from "@vynance/shared"

/**
 * Antrean tulis offline untuk transaksi baru (NFR-04, TSD §8).
 * Tiap item membawa Idempotency-Key dari form, jadi kiriman ulang tidak pernah membuat transaksi ganda:
 * server mengembalikan transaksi yang sama untuk kunci yang sama.
 */

type KeyValue = Pick<Storage, "getItem" | "setItem">

const STORAGE_KEY = "vynance.outbox.v1"
const listeners = new Set<() => void>()

function defaultStore(): KeyValue | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

export function readOutbox(store: KeyValue | null = defaultStore()): OutboxItem[] {
  try {
    const raw = store?.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : []
  } catch {
    return []
  }
}

/** Mengembalikan false bila penyimpanan perangkat penuh atau diblokir. */
function writeOutbox(items: OutboxItem[], store: KeyValue | null): boolean {
  let ok = store !== null
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    ok = false
  }
  for (const l of listeners) l()
  return ok
}

export function subscribeOutbox(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function enqueueTransaction(
  bookId: string,
  input: CreateTransactionInput,
  key: string,
  now: Date,
  store: KeyValue | null = defaultStore(),
): void {
  const items = readOutbox(store).filter((i) => i.key !== key)
  items.push({ key, bookId, input: { ...input, amount: moneyToJson(input.amount) }, queuedAt: now.toISOString() })
  // Jangan pernah diam-diam kehilangan transaksi: bila tidak bisa disimpan, form menampilkan error.
  if (!writeOutbox(items, store)) throw new Error("Tidak bisa menyimpan di perangkat. Coba lagi saat online.")
}

/**
 * Kirim antrean berurutan. Berhenti di kegagalan jaringan pertama supaya urutan terjaga.
 * Mengembalikan ID buku yang datanya berubah.
 */
export async function flushOutbox(
  send: (item: OutboxItem) => Promise<OutboxSendResult>,
  store: KeyValue | null = defaultStore(),
): Promise<{ sent: number; rejected: number; books: string[] }> {
  let sent = 0
  let rejected = 0
  const books = new Set<string>()
  for (const item of readOutbox(store)) {
    const r = await send(item)
    if (r === "retry") break
    if (r === "sent") {
      sent++
      books.add(item.bookId)
    } else rejected++
    writeOutbox(
      readOutbox(store).filter((i) => i.key !== item.key),
      store,
    )
  }
  return { sent, rejected, books: [...books] }
}

/** Kegagalan jaringan (fetch melempar TypeError), bukan respons error dari server. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError
}
