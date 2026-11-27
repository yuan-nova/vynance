import { useId } from "react"

type SwitchProps = { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }

/** Sakelar on/off: role="switch", seluruh baris bisa diketuk (target ≥ 44 px), status terbaca tanpa warna. */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  const hintId = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint ? hintId : undefined}
      className="switch-row"
      onClick={() => onChange(!checked)}
    >
      <span className="switch-text">
        <span className="row-title">{label}</span>
        {hint ? (
          <span id={hintId} className="row-sub">
            {hint}
          </span>
        ) : null}
      </span>
      <span className={`switch${checked ? " switch-on" : ""}`} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  )
}
