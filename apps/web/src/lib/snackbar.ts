import type { SnackbarItem } from "@vynance/shared"

// Antrean snackbar (DS-STATE-03). Satu snackbar tampil sekaligus; yang baru menggantikan yang lama.

let current: SnackbarItem | null = null
let seq = 0
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

export const snackbarStore = {
  get: (): SnackbarItem | null => current,
  subscribe: (cb: () => void): (() => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },
  dismiss: (id: number): void => {
    if (current?.id !== id) return
    current = null
    emit()
  },
}

/** Tampilkan snackbar. `undo` menambah tombol Urungkan dan memperpanjang durasi ke 6 detik (DS-ACTION-03). */
export function showSnackbar(
  message: string,
  opts: { undo?: () => void; tone?: "default" | "error"; actionLabel?: string; onAction?: () => void } = {},
): void {
  seq += 1
  const onAction = opts.undo ?? opts.onAction
  current = {
    id: seq,
    message,
    tone: opts.tone ?? "default",
    actionLabel: opts.undo ? "Urungkan" : opts.actionLabel,
    onAction,
    durationMs: onAction ? 6000 : 4000,
  }
  emit()
}
