import { z } from "zod"
import { MONEY_PRIVACY_MASK } from "../money/money"

// Anggota buku dan log aktivitas (FR-04, BR-49, BR-51, BR-53).

/** Anggota aktif. Tanpa label peran: semua anggota punya hak sama (BR-49). */
export const memberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  joinedAt: z.string(),
  isMe: z.boolean(),
})
export type Member = z.infer<typeof memberSchema>

export const activitySchema = z.object({
  id: z.string(),
  action: z.string(),
  actorName: z.string(),
  entityType: z.string(),
  summary: z.record(z.string(), z.string()),
  createdAt: z.string(),
})
export type Activity = z.infer<typeof activitySchema>

export const activityQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }).strict()

const TX_VERB: Record<string, string> = { income: "uang masuk", expense: "uang keluar", transfer: "transfer" }

/**
 * Kalimat aktivitas untuk layar Buku. `privacy` menyamarkan nominal (BR-44).
 * Aksi yang belum dikenal tetap tampil dengan kalimat umum, tidak pernah kosong.
 */
export function activityText(a: Pick<Activity, "action" | "actorName" | "summary">, privacy = false): string {
  const who = a.actorName || "Anggota"
  const s = a.summary
  const amount = s.amount ? (privacy ? MONEY_PRIVACY_MASK : s.amount) : ""
  const name = s.name ? ` ${s.name}` : ""
  const note = s.note ? ` "${s.note}"` : ""
  switch (a.action) {
    case "transaction.created":
      return `${who} mencatat ${TX_VERB[s.type ?? ""] ?? "transaksi"}${note} ${amount}`.trim()
    case "transaction.updated":
      return `${who} mengubah transaksi${note} ${amount}`.trim()
    case "transaction.deleted":
      return `${who} menghapus transaksi${note} ${amount}`.trim()
    case "transaction.restored":
      return `${who} mengurungkan hapus transaksi${note}`
    case "wallet.created":
      return `${who} menambah rekening${name}`
    case "wallet.updated":
      return `${who} mengubah rekening${name}`
    case "wallet.archived":
      return `${who} mengarsipkan rekening${name}`
    case "wallet.unarchived":
      return `${who} mengaktifkan lagi rekening${name}`
    case "wallet.deleted":
      return `${who} menghapus rekening${name}`
    case "category.created":
      return `${who} menambah kategori${name}`
    case "category.updated":
      return `${who} mengubah kategori${name}`
    case "category.deleted":
      return `${who} menghapus kategori${name}`
    case "category.restored":
      return `${who} memulihkan kategori${name}`
    case "plan.saved":
      return `${who} memperbarui rencana bulanan`
    case "goal.created":
      return `${who} membuat target${name}`
    case "goal.updated":
      return `${who} mengubah target${name}`
    case "goal.deleted":
      return `${who} menghapus target${name}`
    case "goal.contributed":
      return `${who} menyetor ke target${name}${s.amount ? ` ${privacy ? MONEY_PRIVACY_MASK : `Rp${Number(s.amount).toLocaleString("id-ID")}`}` : ""}`
    case "book.created":
      return `${who} membuat buku${name}`
    case "book.renamed":
      return `${who} mengganti nama buku menjadi${name}`
    case "book.restored":
      return `${who} memulihkan buku`
    case "invitation.created":
      return `${who} membuat tautan undangan`
    case "invitation.revoked":
      return `${who} membatalkan tautan undangan`
    case "member.joined":
      return `${who} bergabung ke buku`
    case "member.left":
      return `${who} keluar dari buku`
    case "member.removed":
      return `${who} mengeluarkan${name} dari buku`
    case "onboarding.opening_balances":
      return `${who} mengisi saldo awal rekening`
    default:
      return `${who} memperbarui data buku`
  }
}
