// Store luar untuk mode privasi (BR-44). Nilai awal diambil dari profil pengguna saat login (tiket #19).

let privacy = false
const listeners = new Set<() => void>()

export const privacyStore = {
  get: (): boolean => privacy,
  set: (value: boolean): void => {
    if (value === privacy) return
    privacy = value
    for (const l of listeners) l()
  },
  subscribe: (cb: () => void): (() => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },
}
