import { ICON_PATHS, type IconName } from "@vynance/shared"

type IconProps = { name: IconName; size?: number; strokeWidth?: number; className?: string }

/** Ikon garis dari registri DS-ICON-01. Selalu dekoratif; nama aksesibel ada di tombol pembungkus. */
export function Icon({ name, size = 20, strokeWidth = 1.8, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
