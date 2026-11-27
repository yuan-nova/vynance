import { Link, useRouterState } from "@tanstack/react-router"
import type { IconName } from "@vynance/shared"
import { useRef } from "react"
import { useKeyboardOpen } from "@/lib/hooks/useKeyboardOpen"
import { Icon } from "./Icon"

const TABS: { to: "/" | "/transaksi" | "/anggaran" | "/lainnya"; label: string; icon: IconName }[] = [
  { to: "/", label: "Beranda", icon: "home" },
  { to: "/transaksi", label: "Transaksi", icon: "list" },
  { to: "/anggaran", label: "Anggaran", icon: "pie" },
  { to: "/lainnya", label: "Lainnya", icon: "grid" },
]

function isActive(path: string, to: string): boolean {
  return to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`)
}

type BottomNavProps = { onAdd: () => void; onScan: () => void }

/** Navigasi bawah lima slot (DS-NAV-01, ADR 0001). Tekan lama tombol tengah membuka Scan struk. */
export function BottomNav({ onAdd, onScan }: BottomNavProps) {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const keyboardOpen = useKeyboardOpen()
  const pressTimer = useRef<number | undefined>(undefined)
  const longPressed = useRef(false)
  const tab = (t: (typeof TABS)[number]) => {
    const active = isActive(path, t.to)
    return (
      <Link
        key={t.to}
        to={t.to}
        className={`nav-tab${active ? " nav-tab-active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <span className="nav-pill">
          <Icon name={t.icon} size={22} strokeWidth={active ? 2 : 1.8} />
        </span>
        <span className="nav-label">{t.label}</span>
      </Link>
    )
  }
  if (keyboardOpen) return null
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {TABS.slice(0, 2).map(tab)}
      <div className="nav-add-slot">
        <button
          type="button"
          className="nav-add"
          aria-label="Catat transaksi"
          onPointerDown={() => {
            longPressed.current = false
            pressTimer.current = window.setTimeout(() => {
              longPressed.current = true
              onScan()
            }, 500)
          }}
          onPointerUp={() => window.clearTimeout(pressTimer.current)}
          onPointerLeave={() => window.clearTimeout(pressTimer.current)}
          onClick={() => {
            if (!longPressed.current) onAdd()
          }}
        >
          <Icon name="plus" size={26} strokeWidth={2.2} />
        </button>
      </div>
      {TABS.slice(2).map(tab)}
    </nav>
  )
}
