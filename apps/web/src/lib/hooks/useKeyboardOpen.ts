import { useSyncExternalStore } from "react"

// Keyboard virtual dianggap terbuka bila visualViewport menyusut > 150 px dari tinggi jendela (DS-NAV-01).
const THRESHOLD = 150

const subscribe = (cb: () => void): (() => void) => {
  const vv = window.visualViewport
  if (!vv) return () => undefined
  vv.addEventListener("resize", cb)
  return () => vv.removeEventListener("resize", cb)
}

const snapshot = (): boolean => {
  const vv = window.visualViewport
  return vv ? window.innerHeight - vv.height > THRESHOLD : false
}

export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
