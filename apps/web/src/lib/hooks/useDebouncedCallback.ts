import { useEffect, useRef } from "react"

/** Fungsi yang dijalankan `ms` setelah panggilan terakhir (DS-DATA-02: cari 300 ms). Dipanggil dari event handler. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, ms = 300): (...args: A) => void {
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(fn)
  latest.current = fn
  // sinkron: batalkan timer saat komponen dilepas
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (...args: A) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => latest.current(...args), ms)
  }
}
