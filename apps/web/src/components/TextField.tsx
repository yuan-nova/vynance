import { type InputHTMLAttributes, useId } from "react"

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
  label: string
  error?: string
  hint?: string
}

/** Kolom isian 48 px, label di atas, font 16 px, error lewat aria-describedby (DS-FORM-01). */
export function TextField({ label, error, hint, ...rest }: TextFieldProps) {
  const id = useId()
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
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
