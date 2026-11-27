import { z } from "zod"

// Undangan buku lewat tautan (FR-04, PB-12, BR-50).

export const INVITATION_TTL_DAYS = 7

export const INVITATION_STATUSES = ["active", "used", "revoked", "expired"] as const
export const invitationStatusSchema = z.enum(INVITATION_STATUSES)
export type InvitationStatus = z.infer<typeof invitationStatusSchema>

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  active: "Aktif",
  used: "Sudah dipakai",
  revoked: "Dibatalkan",
  expired: "Kedaluwarsa",
}

/** BR-50: status dari kolom; urutan: dibatalkan → dipakai → kedaluwarsa → aktif. */
export function invitationStatus(
  v: { revokedAt: Date | null; usedAt: Date | null; expiresAt: Date },
  now: Date,
): InvitationStatus {
  if (v.revokedAt) return "revoked"
  if (v.usedAt) return "used"
  if (v.expiresAt.getTime() <= now.getTime()) return "expired"
  return "active"
}

/** Undangan di daftar buku. Token tidak pernah ikut (hanya ada di tautan saat dibuat). */
export const invitationSchema = z.object({
  id: z.string(),
  status: invitationStatusSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
  createdByName: z.string(),
  usedByName: z.string().nullable(),
})
export type Invitation = z.infer<typeof invitationSchema>

/** Respons `POST /books/:bookId/invitations`: tautan berisi token mentah, ditampilkan sekali. */
export const createdInvitationSchema = z.object({ invitation: invitationSchema, url: z.string() })
export type CreatedInvitation = z.infer<typeof createdInvitationSchema>

/** `GET /invitations/:token` (publik): cukup untuk halaman terima undangan. */
export const invitationPreviewSchema = z.object({
  status: invitationStatusSchema,
  bookName: z.string(),
  bookCode: z.string(),
  inviterName: z.string(),
  expiresAt: z.string(),
})
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>

/** Token base64url 32 byte = 43 karakter. */
export const invitationTokenSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Tautan undangan tidak valid"),
})
