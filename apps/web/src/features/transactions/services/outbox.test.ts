import { describe, expect, test } from "bun:test"
import type { OutboxItem, OutboxSendResult } from "@vynance/shared"
import { enqueueTransaction, flushOutbox, readOutbox } from "./outbox"

function memoryStore() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

const input = {
  type: "expense" as const,
  amount: 50_000n,
  txDate: "2026-11-28",
  walletId: "01M8DKFPZHBPP348SDBKSZZVV1",
  categoryId: "01M8DKFPZHBPP348SDBKSZZVV2",
  note: null,
}
const now = new Date("2026-11-28T03:00:00Z")

describe("antrean offline NFR-04", () => {
  test("simpan offline lalu terkirim tepat sekali saat online", async () => {
    const store = memoryStore()
    enqueueTransaction("b1", input, "key-aaaa-0001", now, store)
    // Simpan ganda dengan kunci yang sama tidak menambah antrean.
    enqueueTransaction("b1", input, "key-aaaa-0001", now, store)
    expect(readOutbox(store)).toHaveLength(1)
    expect(readOutbox(store)[0]?.input.amount).toBe("50000")

    const serverKeys = new Set<string>()
    const send = async (i: OutboxItem): Promise<OutboxSendResult> => {
      serverKeys.add(i.key)
      return "sent"
    }
    const r1 = await flushOutbox(send, store)
    const r2 = await flushOutbox(send, store)
    expect(r1).toEqual({ sent: 1, rejected: 0, books: ["b1"] })
    expect(r2.sent).toBe(0)
    expect(serverKeys.size).toBe(1)
    expect(readOutbox(store)).toHaveLength(0)
  })

  test("jaringan putus di tengah: berhenti, sisa antrean tetap urut", async () => {
    const store = memoryStore()
    enqueueTransaction("b1", input, "key-aaaa-0001", now, store)
    enqueueTransaction("b1", input, "key-aaaa-0002", now, store)
    enqueueTransaction("b2", input, "key-aaaa-0003", now, store)
    let n = 0
    const r = await flushOutbox(async () => (++n === 2 ? "retry" : "sent"), store)
    expect(r.sent).toBe(1)
    expect(readOutbox(store).map((i) => i.key)).toEqual(["key-aaaa-0002", "key-aaaa-0003"])
  })

  test("ditolak server (mis. kategori dihapus) dibuang dari antrean", async () => {
    const store = memoryStore()
    enqueueTransaction("b1", input, "key-aaaa-0001", now, store)
    const r = await flushOutbox(async () => "rejected", store)
    expect(r).toEqual({ sent: 0, rejected: 1, books: [] })
    expect(readOutbox(store)).toHaveLength(0)
  })
})
