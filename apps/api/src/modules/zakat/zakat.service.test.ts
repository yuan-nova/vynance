import { describe, expect, test } from "bun:test"
import type { ServiceCtx } from "@vynance/shared"
import { ZakatService } from "./zakat.service"

const ctx = { bookId: "B", userId: "U" } as ServiceCtx

function make(o: { gold?: { value: string; fetchedAt: Date } | null; haul?: string | null; fetched?: bigint | null }) {
  const calls: { created: unknown[]; haul: (string | null)[]; gold: bigint[] } = { created: [], haul: [], gold: [] }
  const svc = new ZakatService({
    zakat: {
      latestGold: async () => o.gold ?? null,
      insertGold: async (v) => void calls.gold.push(v.value),
      haulStart: async () => o.haul ?? null,
      setHaulStart: async (_b, s) => void calls.haul.push(s),
    },
    wallets: {
      list: async () => ({
        wallets: [],
        summary: { cash: "42300000", debt: "-8450000", walletCount: 3, debtCount: 1 },
      }),
    },
    investments: { totalValue: async () => 152_600_000n },
    categories: {
      list: async () => [{ id: "CZ", name: "Zakat & Infaq", kind: "expense", archivedAt: null }] as never,
    },
    transactions: {
      create: async (_c, input) => {
        calls.created.push(input)
        return { id: "T" } as never
      },
    },
    newId: () => "N",
    now: () => new Date("2026-11-28T03:00:00Z"),
    fetchGoldPrice: async () => o.fetched ?? null,
  })
  return { svc, calls }
}

describe("zakat maal (PB-08)", () => {
  test("ringkasan sesuai desain dengan harga emas bawaan", async () => {
    const s = await make({}).svc.summary(ctx)
    expect(s).toMatchObject({
      goldSource: "default",
      goldPrice: "1580000",
      debtDue: "8450000",
      wealth: "186450000",
      nisab: "134300000",
      obligatory: true,
      zakat: "4661250",
      categoryId: "CZ",
      haulDate: null,
    })
  })

  test("harga manual mengalahkan cache; haul tercapai dihitung", async () => {
    const { svc } = make({ gold: { value: "2000000.000000", fetchedAt: new Date() }, haul: "2025-11-30" })
    expect((await svc.summary(ctx)).goldPrice).toBe("2000000")
    const s = await svc.summary(ctx, 3_000_000n)
    expect(s).toMatchObject({
      goldSource: "manual",
      obligatory: false,
      zakat: "0",
      haulDate: "2026-11-19",
      haulReached: true,
    })
  })

  test("catat pembayaran → uang keluar Zakat & Infaq, haul baru dari tanggal bayar", async () => {
    const { svc, calls } = make({})
    await svc.pay(ctx, { amount: 4_661_250n, walletId: "W", txDate: "2026-11-28" })
    expect(calls.created[0]).toMatchObject({ type: "expense", categoryId: "CZ", amount: 4_661_250n })
    expect(calls.haul).toEqual(["2026-11-28"])
  })

  test("job harga emas: lewati bila masih segar, simpan bila basi", async () => {
    const fresh = make({ gold: { value: "1", fetchedAt: new Date("2026-11-28T01:00:00Z") }, fetched: 1_600_000n })
    expect(await fresh.svc.refreshGold(new Date("2026-11-28T03:00:00Z"))).toBe(0)
    const stale = make({ gold: { value: "1", fetchedAt: new Date("2026-11-27T01:00:00Z") }, fetched: 1_600_000n })
    expect(await stale.svc.refreshGold(new Date("2026-11-28T03:00:00Z"))).toBe(1)
    expect(stale.calls.gold).toEqual([1_600_000n])
  })
})
