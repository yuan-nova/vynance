import { type RefObject, useEffect, useEffectEvent } from "react"

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Fokus masuk ke sheet, terkunci di dalamnya, Escape menutup, fokus kembali ke pemicu (DS-A11Y-01). */
export function useSheetFocus(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void): void {
  const close = useEffectEvent(onClose)
  // sinkron: fokus DOM dan listener keyboard dokumen
  useEffect(() => {
    if (!open) return
    const el = ref.current
    if (!el) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const first = el.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? el).focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== "Tab") return
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      const head = items[0]
      const tail = items[items.length - 1]
      if (!head || !tail) return
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault()
        tail.focus()
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault()
        head.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      trigger?.focus()
    }
  }, [open, ref])
}
