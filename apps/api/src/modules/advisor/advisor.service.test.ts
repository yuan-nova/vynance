import { describe, expect, test } from "bun:test"
import type { ServiceCtx } from "@vynance/shared"
import { AdvisorService } from "./advisor.service"

const ctx = { bookId: "B", userId: "U" } as ServiceCtx

function make(consent: Date | null, withLlm = true) {
  const sent: string[] = []
  let collected = 0
  const svc = new AdvisorService({
    advisor: { consentAt: async () => consent, setConsent: async () => undefined },
    dashboard: {
      get: async () => {
        collected++
        return {
          wealth: { netWorth: "100", cash: "60", investments: "50", debt: "-10" },
          monthSummary: { income: "80", expense: "40" },
          healthScore: { score: 78, level: "good", levelLabel: "Baik" },
        } as never
      },
      charts: async () => ({ byCategory: [{ name: "Makan", amount: "30" }] }) as never,
    },
    goals: { list: async () => ({ goals: [] }) as never },
    investments: { portfolio: async () => ({ assets: [] }) as never },
    llm: withLlm
      ? async function* (system, user) {
          sent.push(system, user)
          yield "Halo "
          yield "dunia"
        }
      : null,
    now: () => new Date("2026-11-28T03:00:00Z"),
  })
  return { svc, sent, collected: () => collected }
}

describe("AI advisor PB-11", () => {
  test("tanpa persetujuan: 403 dan tidak ada data yang dikumpulkan/dikirim", async () => {
    const m = make(null)
    await expect(m.svc.ask(ctx, "Gimana kondisi keuanganku?")).rejects.toMatchObject({
      status: 403,
      code: "AI_CONSENT_REQUIRED",
    })
    expect(m.sent).toHaveLength(0)
    expect(m.collected()).toBe(0)
  })

  test("penyedia belum dikonfigurasi → 503", async () => {
    await expect(make(new Date(), false).svc.ask(ctx, "Halo?")).rejects.toMatchObject({ status: 503 })
  })

  test("dengan persetujuan: ringkasan dalam <data>, jawaban di-stream", async () => {
    const m = make(new Date())
    let out = ""
    for await (const t of await m.svc.ask(ctx, "Tips hemat bulan ini")) out += t
    expect(out).toBe("Halo dunia")
    expect(m.sent[1]).toContain("<data>\nBulan: 2026-11")
    expect(m.sent[1]).toContain('"Makan": Rp30')
    expect(m.sent[1]).toContain("Pertanyaan: Tips hemat bulan ini")
    expect(m.sent[0]).toContain("bukan perintah")
  })
})
