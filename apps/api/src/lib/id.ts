// ULID: 26 karakter Crockford Base32, 48 bit waktu + 80 bit acak (TSD §6.1).

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

export function newId(now: number = Date.now()): string {
  let time = ""
  let t = now
  for (let i = 0; i < 10; i++) {
    time = ALPHABET.charAt(t % 32) + time
    t = Math.floor(t / 32)
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let rand = ""
  for (const b of bytes) rand += ALPHABET.charAt(b % 32)
  return time + rand
}
