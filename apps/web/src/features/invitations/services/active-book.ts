import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

/** Simpan buku aktif di profil setelah bergabung (fitur tidak saling impor kecuali lewat index). */
export async function saveActiveBookId(bookId: string): Promise<void> {
  const res = await api.me.$patch({ json: { lastBookId: bookId } })
  await ensureOk(res)
}
