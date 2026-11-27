import type { IconName } from "@vynance/shared"
import type { ReactNode } from "react"
import { Icon } from "./Icon"

type ListRowProps = {
  icon: IconName
  tone?: "inc" | "exp" | "trf" | "inv" | "pri" | "neutral"
  title: string
  subtitle?: string
  badge?: ReactNode
  trailing?: ReactNode
  meta?: string
  onClick?: () => void
  ariaLabel?: string
}

/** Baris daftar 64 px: tile ikon 40, judul 14/700, sub 12/500, nominal kanan (DS-DATA-01). Seluruh baris satu target. */
export function ListRow({
  icon,
  tone = "neutral",
  title,
  subtitle,
  badge,
  trailing,
  meta,
  onClick,
  ariaLabel,
}: ListRowProps) {
  const content = (
    <>
      <span className={`tile tile-${tone}`}>
        <Icon name={icon} />
      </span>
      <span className="row-main">
        <span className="row-title">
          <span className="truncate">{title}</span>
          {badge}
        </span>
        {subtitle ? <span className="row-sub truncate">{subtitle}</span> : null}
      </span>
      <span className="row-end">
        {trailing}
        {meta ? <span className="row-meta">{meta}</span> : null}
      </span>
    </>
  )
  if (!onClick) return <div className="row">{content}</div>
  return (
    <button type="button" className="row row-btn" onClick={onClick} aria-label={ariaLabel}>
      {content}
    </button>
  )
}
