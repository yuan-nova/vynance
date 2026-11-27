import { createInvestmentTypeSchema, INVESTMENT_ICONS, type InvestmentType } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { IconPicker } from "@/components/IconPicker"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Values = ReturnType<typeof createInvestmentTypeSchema.parse>
type Icon = (typeof INVESTMENT_ICONS)[number]

type TypeFormProps = {
  initial?: InvestmentType
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

/** Jenis investasi dengan target nilai (PB-06 langkah 1). */
export function TypeForm({ initial, pending, onSubmit, onDelete }: TypeFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [icon, setIcon] = useState<Icon>(
    (INVESTMENT_ICONS as readonly string[]).includes(initial?.icon ?? "") ? (initial?.icon as Icon) : "trend",
  )
  const [target, setTarget] = useState<bigint | null>(initial?.targetValue ? BigInt(initial.targetValue) : null)
  const [errors, setErrors] = useState<Partial<Record<"name" | "targetValue" | "form", string>>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createInvestmentTypeSchema.safeParse({
      name,
      icon,
      targetValue: target && target > 0n ? target.toString() : null,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setErrors({ [(issue?.path[0] as "name" | undefined) ?? "form"]: issue?.message })
      return
    }
    setErrors({})
    onSubmit(parsed.data, (err) => {
      const { fields, formError } = splitApiError(err, ["name", "targetValue"] as const)
      setErrors({ ...fields, form: formError ?? undefined })
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Nama jenis"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <IconPicker label="Ikon" options={INVESTMENT_ICONS} value={icon} onChange={setIcon} />
      <MoneyInput
        label="Target nilai (opsional)"
        value={target}
        onChange={setTarget}
        error={errors.targetValue}
        hint="Contoh: Emas target Rp100 jt."
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
            Hapus jenis
          </Button>
        ) : null}
      </div>
    </form>
  )
}
