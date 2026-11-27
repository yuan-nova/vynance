import { type DeletionPreview, deletionPreviewSchema } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

/** URL unduhan ekspor (berkas, dibuka lewat tautan biasa agar browser menyimpan). */
export function exportUrl(format: "json" | "csv"): string {
  // `$url()` Hono butuh base absolut; API satu origin, jadi cukup path relatif.
  return `/api/v1/me/export?format=${format}`
}

export async function fetchDeletionPreview(): Promise<DeletionPreview> {
  const res = await api.me["deletion-preview"].$get()
  await ensureOk(res)
  return deletionPreviewSchema.parse((await res.json()).data)
}

export async function deleteAccount(confirmEmail: string): Promise<void> {
  const res = await api.me.$delete({ json: { confirmEmail } })
  await ensureOk(res)
}
