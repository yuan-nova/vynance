import { type ChildPlan, createChildSchema } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Values = { name: string; birthYear: number; savings: bigint }
type Fields = "name" | "birthYear" | "savings"
const FIELDS = ["name", "birthYear", "savings"] as const

type ChildFormProps = {
  initial?: ChildPlan
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

/** Form anak (PB-09 langkah 1): nama, tahun lahir, tabungan pendidikan saat ini. */
export function ChildForm({ initial, pending, onSubmit, onDelete }: ChildFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [birthYear, setBirthYear] = useState(initial ? String(initial.birthYear) : "")
  const [savings, setSavings] = useState<bigint | null>(initial ? BigInt(initial.savings) : 0n)
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createChildSchema.safeParse({
      name,
      birthYear: birthYear.trim() === "" ? undefined : birthYear,
      savings: (savings ?? 0n).toString(),
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const field = (issue?.path[0] as Fields | undefined) ?? "form"
      setErrors({ [field]: field === "birthYear" && !birthYear.trim() ? "Tahun lahir wajib diisi" : issue?.message })
      return
    }
    setErrors({})
    onSubmit(parsed.data, (err) => {
      const { fields, formError } = splitApiError(err, FIELDS)
      setErrors({ ...fields, form: formError ?? undefined })
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Nama anak"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <TextField
        label="Tahun lahir"
        inputMode="numeric"
        maxLength={4}
        value={birthYear}
        onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ""))}
        error={errors.birthYear}
      />
      <MoneyInput
        label="Tabungan pendidikan saat ini"
        value={savings}
        onChange={setSavings}
        error={errors.savings}
        hint="Dibagi berurutan ke jenjang terdekat dulu."
      />
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <div className="stack">
        <Button type="submit" full loading={pending}>
          Simpan
        </Button>
        {onDelete ? (
          <Button variant="ghost" full icon="trash" onClick={onDelete}>
            Hapus anak
          </Button>
        ) : null}
      </div>
    </form>
  )
}
