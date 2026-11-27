import type { IconName } from "@vynance/shared"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Icon } from "./Icon"

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: "primary" | "soft" | "ghost" | "dark" | "destructive"
  loading?: boolean
  full?: boolean
  icon?: IconName
  children: ReactNode
}

/** Tombol 52 px sesuai DS-ACTION-01. Maksimal satu `primary` per layar/sheet. */
export function Button({
  variant = "primary",
  loading = false,
  full = false,
  icon,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={`btn btn-${variant}${full ? " btn-full" : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
    </button>
  )
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  icon: IconName
  label: string
}

/** Tombol ikon 44 × 44 dengan nama aksesibel wajib (DS-ACTION-02, DS-TOUCH-01). */
export function IconButton({ icon, label, type = "button", ...rest }: IconButtonProps) {
  return (
    <button {...rest} type={type} className="icon-btn" aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  )
}
