// Batas kirim OTP per email (TSD §10), melengkapi rate limit per IP dari Better Auth.
// Disimpan di memori: cukup untuk satu instance api (TSD §8.1). Ganti ke Redis bila api lebih dari satu instance.

export function createEmailThrottle(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>()
  return {
    /** true bila email ini masih boleh dikirimi kode; mencatat percobaan. */
    allow(email: string): boolean {
      const key = email.trim().toLowerCase()
      const t = now()
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs)
      if (recent.length >= max) {
        hits.set(key, recent)
        return false
      }
      recent.push(t)
      hits.set(key, recent)
      return true
    },
  }
}
