import type { IconName } from "@vynance/shared"
import { useId } from "react"
import { Icon } from "./Icon"

type IconPickerProps<T extends IconName> = {
  label: string
  options: readonly T[]
  value: string
  onChange: (v: T) => void
}

/** Kisi pilihan ikon ≤ 16 (DS-FORM-03: kisi pilihan, perlu ikon). Target 44 px. */
export function IconPicker<T extends IconName>({ label, options, value, onChange }: IconPickerProps<T>) {
  const labelId = useId()
  return (
    <div className="field">
      <span id={labelId} className="field-label">
        {label}
      </span>
      <div className="icon-grid" role="radiogroup" aria-labelledby={labelId}>
        {options.map((name) => (
          // biome-ignore lint/a11y/useSemanticElements: kisi ikon DS-FORM-03; semantik radio lewat role + aria-checked
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={name === value}
            aria-label={`Ikon ${name}`}
            className={`icon-choice${name === value ? " icon-choice-on" : ""}`}
            onClick={() => onChange(name)}
          >
            <Icon name={name} />
          </button>
        ))}
      </div>
    </div>
  )
}
