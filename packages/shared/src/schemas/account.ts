import { z } from "zod"

// Hak subjek data UU PDP (NFR-08, TSD §10): ekspor semua data dan hapus akun.

export const EXPORT_FORMATS = ["json", "csv"] as const
export const exportQuerySchema = z.object({ format: z.enum(EXPORT_FORMATS).default("json") }).strict()

/** Akibat hapus akun per buku, untuk sheet konfirmasi "dalam angka". */
export const deletionPreviewSchema = z.object({
  books: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      /** Anggota aktif selain pengguna ini. */
      otherMembers: z.number().int(),
      transactionCount: z.number().int(),
      /** true = pengguna anggota terakhir → buku ikut dihapus (BR-51). */
      willBeDeleted: z.boolean(),
    }),
  ),
})
export type DeletionPreview = z.infer<typeof deletionPreviewSchema>

/** Konfirmasi hapus akun: ketik ulang email akun. */
export const deleteAccountSchema = z
  .object({ confirmEmail: z.string().trim().min(1, "Ketik email akun Anda") })
  .strict()
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
