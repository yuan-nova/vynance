import { type RefObject, useEffect, useEffectEvent } from "react"

/** Panggil `onEnter` saat elemen terlihat (scroll tak berujung, DS-DATA-01). */
export function useInView(ref: RefObject<Element | null>, onEnter: () => void, enabled: boolean): void {
  const enter = useEffectEvent(onEnter)
  // sinkron: IntersectionObserver
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) enter()
      },
      { rootMargin: "400px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, enabled])
}
