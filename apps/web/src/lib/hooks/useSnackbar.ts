import type { SnackbarItem } from "@vynance/shared"
import { useEffect, useSyncExternalStore } from "react"
import { snackbarStore } from "../snackbar"

/** Snackbar aktif + timer tutup otomatis. */
export function useSnackbar(): SnackbarItem | null {
  const item = useSyncExternalStore(snackbarStore.subscribe, snackbarStore.get, snackbarStore.get)
  // sinkron: timer tutup otomatis snackbar
  useEffect(() => {
    if (!item) return
    const t = window.setTimeout(() => snackbarStore.dismiss(item.id), item.durationMs)
    return () => window.clearTimeout(t)
  }, [item])
  return item
}
