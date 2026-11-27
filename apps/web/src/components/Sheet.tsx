import { type ReactNode, useId, useRef } from "react"
import { useSheetFocus } from "@/lib/hooks/useSheetFocus"
import { IconButton } from "./Button"

type SheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Bottom sheet DS-SHEET-01: pegangan, judul, konten scroll sendiri (≤ 90 svh), CTA tetap di bawah. */
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useSheetFocus(ref, open, onClose)
  if (!open) return null
  return (
    <div className="sheet-root">
      <button type="button" className="sheet-scrim" aria-label="Tutup" tabIndex={-1} onClick={onClose} />
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <IconButton icon="close" label="Tutup" onClick={onClose} />
        </div>
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-foot">{footer}</div> : null}
      </div>
    </div>
  )
}
