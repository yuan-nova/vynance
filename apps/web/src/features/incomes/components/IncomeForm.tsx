import { createIncomeSourceSchema, INCOME_KIND_LABEL, type IncomeKind, type IncomeSource } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { MoneyInput } from "@/components/MoneyInput"
import { Switch } from "@/components/Switch"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Values = { name: string; kind: IncomeKind; monthlyAmount: bigint; isRecurring: boolean }
type Fields = "name" | "kind" | "monthlyAmount" | "isRecurring"
const FIELDS = ["name", "kind", "monthlyAmount", "isRecurring"] as const
const KIND_OPTIONS = [
  { value: "active", label: INCOME_KIND_LABEL.active },
  { value: "passive", label: INCOME_KIND_LABEL.passive },
] as const

type IncomeFormProps = {
  initial?: IncomeSource
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

/** Form sumber penghasilan (PB-10): nama, aktif/pasif, nominal per bulan, rutin atau tidak. */
export function IncomeForm({ initial, pending, onSubmit, onDelete }: IncomeFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [kind, setKind] = useState<IncomeKind>(initial?.kind ?? "active")
  const [amount, setAmount] = useState<bigint | null>(initial ? BigInt(initial.monthlyAmount) : null)
  const [recurring, setRecurring] = useState(initial?.isRecurring ?? true)
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createIncomeSourceSchema.safeParse({
      name,
      kind,
      monthlyAmount: (amount ?? 0n).toString(),
      isRecurring: recurring,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setErrors({ [(issue?.path[0] as Fields | undefined) ?? "form"]: issue?.message })
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
        label="Nama sumber"
        placeholder="Gaji, sewa kos, dividen"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <ChipGroup label="Jenis" options={KIND_OPTIONS} value={kind} onChange={setKind} />
      <p className="row-sub">Pasif: tetap masuk tanpa Anda bekerja aktif, misalnya sewa, dividen, atau bunga.</p>
      <MoneyInput label="Rata-rata per bulan" value={amount} onChange={setAmount} error={errors.monthlyAmount} />
      <Switch
        label="Rutin tiap bulan"
        hint="Matikan untuk penghasilan yang tidak tetap."
        checked={recurring}
        onChange={setRecurring}
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
            Hapus sumber
          </Button>
        ) : null}
      </div>
    </form>
  )
}
