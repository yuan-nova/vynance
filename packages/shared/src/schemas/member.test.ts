import { describe, expect, test } from "bun:test"
import { activityText } from "./member"

describe("activityText", () => {
  const tx = {
    action: "transaction.created",
    actorName: "Budi",
    summary: { type: "expense", amount: "Rp24.000", note: "GoRide" },
  }

  test("kalimat transaksi sesuai design/17", () => {
    expect(activityText(tx)).toBe('Budi mencatat uang keluar "GoRide" Rp24.000')
  })

  test("mode privasi menyamarkan nominal (BR-44)", () => {
    expect(activityText(tx, true)).toBe('Budi mencatat uang keluar "GoRide" Rp ••••••')
    expect(
      activityText(
        { action: "goal.contributed", actorName: "Rina", summary: { name: "Umroh", amount: "500000" } },
        true,
      ),
    ).toBe("Rina menyetor ke target Umroh Rp ••••••")
  })

  test("aksi tak dikenal tetap punya kalimat; nama kosong → Anggota", () => {
    expect(activityText({ action: "x.y", actorName: "", summary: {} })).toBe("Anggota memperbarui data buku")
  })
})
