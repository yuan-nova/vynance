import { parseMoney } from "@vynance/shared"
import { useId, useState } from "react"

type MoneyInputProps = {
  label: string
  value: bigint | null
  onChange: (value: bigint | null) => void
  error?: string
  hint?: string
  allowNegative?: boolean
  large?: boolean
  autoFocus?: boolean
}

function group(v: bigint): string {
  const neg = v < 0n
  const s = (neg ? -v : v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return neg ? `-${s}` : s
}

/**
 * Satu-satunya input nominal (DS-FORM-02): pemisah ribuan saat mengetik, singkatan "1,5jt"/"250rb",
 * tanpa desimal. Teks ketikan disimpan lokal hanya selama mengetik singkatan; nilai sumber tetap `value`.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  error,
  hint,
  allowNegative = false,
  large,
  autoFocus,
}: MoneyInputProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === null ? "" : group(value))
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined

  const handle = (raw: string) => {
    const cleaned = allowNegative ? raw : raw.replace(/-/g, "")
    if (cleaned.trim() === "" || cleaned.trim() === "-") {
      setDraft(cleaned.trim() === "-" ? "-" : null)
      onChange(null)
      return
    }
    const parsed = parseMoney(cleaned)
    // Angka polos langsung diformat; singkatan ("1,5jt") dibiarkan apa adanya sampai blur.
    const plain = /^-?[\d.]*$/.test(cleaned.trim())
    setDraft(plain && parsed !== null ? null : cleaned)
    onChange(parsed)
  }

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className={`money-field${large ? " money-field-lg" : ""}`}>
        <span className="money-prefix" aria-hidden="true">
          Rp
        </span>
        <input
          id={id}
          className="field-input money-input"
          inputMode={allowNegative ? "text" : "numeric"}
          autoComplete="off"
          value={shown}
          onChange={(e) => handle(e.target.value)}
          onBlur={() => setDraft(null)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          // Fokus awal diatur useSheetFocus lewat data-autofocus supaya pemicu sheet tetap tercatat.
          data-autofocus={autoFocus || undefined}
        />
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
