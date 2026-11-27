import { bookCodeFromBytes } from "@vynance/shared"

/** Kode buku acak (TSD §5.3). Acak dibuat di sini karena shared harus deterministik. */
export function generateBookCode(): string {
  return bookCodeFromBytes(crypto.getRandomValues(new Uint8Array(8)))
}
