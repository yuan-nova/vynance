import type { Locale } from "@vynance/shared"

// Store luar bahasa antarmuka (FR-150). Nilai diambil dari profil saat login (applyUserPrefs).

let locale: Locale = "id"
const listeners = new Set<() => void>()

export const localeStore = {
  get: (): Locale => locale,
  set: (value: Locale): void => {
    if (value === locale) return
    locale = value
    for (const l of listeners) l()
  },
  subscribe: (cb: () => void): (() => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },
}
