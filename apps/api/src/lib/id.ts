// ULID monoton: 26 karakter Crockford Base32, 48 bit waktu + 80 bit acak (TSD §6.1).
// Dalam milidetik yang sama, bagian acak dinaikkan 1 supaya urutan pembuatan = urutan ID.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

let lastTime = -1
let lastRandom: number[] = []

function encodeTime(t: number): string {
  let out = ""
  let v = t
  for (let i = 0; i < 10; i++) {
    out = ALPHABET.charAt(v % 32) + out
    v = Math.floor(v / 32)
  }
  return out
}

function increment(digits: number[]): number[] {
  const next = [...digits]
  for (let i = next.length - 1; i >= 0; i--) {
    const d = next[i] ?? 0
    if (d < 31) {
      next[i] = d + 1
      return next
    }
    next[i] = 0
  }
  // Luapan 80 bit dalam satu milidetik praktis mustahil; mulai ulang dari acak.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b % 32)
}

export function newId(now: number = Date.now()): string {
  if (now === lastTime) {
    lastRandom = increment(lastRandom)
  } else {
    lastTime = now
    lastRandom = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b % 32)
  }
  return encodeTime(now) + lastRandom.map((d) => ALPHABET.charAt(d)).join("")
}
