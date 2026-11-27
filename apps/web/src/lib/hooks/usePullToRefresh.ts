import { useEffect, useRef, useState } from "react"

const THRESHOLD = 64
const MAX = 96

type PullState = { distance: number; phase: "idle" | "pulling" | "ready" | "refreshing" }

/**
 * Tarik untuk muat ulang (FR-150) di layar daftar. Aktif hanya saat halaman di paling atas dan
 * gerakan dimulai dengan sentuhan. Mouse/trackpad tidak terpengaruh.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>): PullState {
  const [state, setState] = useState<PullState>({ distance: 0, phase: "idle" })
  const refresh = useRef(onRefresh)
  refresh.current = onRefresh

  useEffect(() => {
    let startY: number | null = null
    let distance = 0
    let busy = false

    const onStart = (e: TouchEvent) => {
      if (busy || window.scrollY > 0 || e.touches.length !== 1) return
      startY = e.touches[0]?.clientY ?? null
    }
    const onMove = (e: TouchEvent) => {
      if (startY === null) return
      const dy = (e.touches[0]?.clientY ?? startY) - startY
      if (dy <= 0 || window.scrollY > 0) {
        distance = 0
        setState({ distance: 0, phase: "idle" })
        return
      }
      // Redaman supaya tarikan terasa berat.
      distance = Math.min(MAX, dy * 0.5)
      setState({ distance, phase: distance >= THRESHOLD ? "ready" : "pulling" })
    }
    const onEnd = () => {
      if (startY === null) return
      startY = null
      if (distance < THRESHOLD) {
        distance = 0
        setState({ distance: 0, phase: "idle" })
        return
      }
      busy = true
      setState({ distance: THRESHOLD, phase: "refreshing" })
      void refresh.current().finally(() => {
        busy = false
        distance = 0
        setState({ distance: 0, phase: "idle" })
      })
    }

    window.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: true })
    window.addEventListener("touchend", onEnd)
    window.addEventListener("touchcancel", onEnd)
    return () => {
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
      window.removeEventListener("touchcancel", onEnd)
    }
  }, [])

  return state
}
