import { useId } from "react"

type ChipGroupProps<T extends string> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** Pilihan 2–12 opsi sebagai chip (DS-FORM-03), radiogroup dengan panah kiri/kanan. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  const labelId = useId()
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value)
    const next = options[(i + dir + options.length) % options.length]
    if (next) onChange(next.value)
  }
  return (
    <div className="field">
      <span id={labelId} className="field-label">
        {label}
      </span>
      <div
        className="chips"
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") move(1)
          if (e.key === "ArrowLeft") move(-1)
        }}
      >
        {options.map((o) => (
          // biome-ignore lint/a11y/useSemanticElements: chip DS-FORM-03 butuh tombol bergaya; semantik radio lewat role + aria-checked
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={o.value === value ? 0 : -1}
            className={`chip${o.value === value ? " chip-on" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
