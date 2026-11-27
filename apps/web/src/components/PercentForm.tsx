import { type FormEvent, useState } from "react"
import type { ZodType } from "zod"
import { Button } from "./Button"
import { TextField } from "./TextField"

type PercentFormProps = {
  label: string
  hint?: string
  initialBp: number
  /** Validasi basis poin dari shared, mis. batas 0–30%. */
  schema: ZodType<number>
  pending: boolean
  onSubmit: (bp: number, onError: (err: unknown) => void) => void
}

/** Isian satu persen (koma atau titik desimal), dikirim sebagai basis poin. */
export function PercentForm({ label, hint, initialBp, schema, pending, onSubmit }: PercentFormProps) {
  const [value, setValue] = useState(String(initialBp / 100).replace(".", ","))
  const [error, setError] = useState<string>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const pct = Number(value.replace(",", "."))
    if (value.trim() === "" || Number.isNaN(pct)) {
      setError("Isi angka persen, misalnya 12")
      return
    }
    const parsed = schema.safeParse(Math.round(pct * 100))
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }
    setError(undefined)
    onSubmit(parsed.data, (err) => setError(err instanceof Error ? err.message : "Gagal menyimpan"))
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label={label}
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
        hint={hint}
        autoFocus
      />
      <Button type="submit" full loading={pending}>
        Simpan
      </Button>
    </form>
  )
}
