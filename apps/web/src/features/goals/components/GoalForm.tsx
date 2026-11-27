import { createGoalSchema, dateOnlyOf, GOAL_ICONS, type Goal } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { IconPicker } from "@/components/IconPicker"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Values = {
  name: string
  icon: (typeof GOAL_ICONS)[number]
  targetAmount: bigint
  initialAmount: bigint
  targetDate: string | null
  note: string | null
}
type Fields = "name" | "icon" | "targetAmount" | "initialAmount" | "targetDate" | "note"
const FIELDS = ["name", "icon", "targetAmount", "initialAmount", "targetDate", "note"] as const

type GoalFormProps = {
  initial?: Goal
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

/** Form target tabungan (PB-07 langkah 1): nama, ikon, nominal, sudah terkumpul, tanggal target. */
export function GoalForm({ initial, pending, onSubmit, onDelete }: GoalFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [icon, setIcon] = useState<Values["icon"]>(
    (GOAL_ICONS as readonly string[]).includes(initial?.icon ?? "") ? (initial?.icon as Values["icon"]) : "target",
  )
  const [target, setTarget] = useState<bigint | null>(initial ? BigInt(initial.targetAmount) : null)
  const [initialAmount, setInitialAmount] = useState<bigint | null>(initial ? BigInt(initial.initialAmount) : 0n)
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createGoalSchema.safeParse({
      name,
      icon,
      targetAmount: (target ?? 0n).toString(),
      initialAmount: (initialAmount ?? 0n).toString(),
      targetDate: targetDate || null,
      note: note.trim() || null,
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
        label="Nama target"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <IconPicker label="Ikon" options={GOAL_ICONS} value={icon} onChange={setIcon} />
      <MoneyInput label="Nominal target" value={target} onChange={setTarget} error={errors.targetAmount} />
      <MoneyInput
        label="Sudah terkumpul"
        value={initialAmount}
        onChange={setInitialAmount}
        error={errors.initialAmount}
        hint="Tabungan yang sudah ada sebelum target ini dicatat."
      />
      <TextField
        label="Tanggal target (opsional)"
        type="date"
        value={targetDate}
        min={initial ? undefined : dateOnlyOf(new Date())}
        onChange={(e) => setTargetDate(e.target.value)}
        error={errors.targetDate}
      />
      <TextField
        label="Catatan (opsional)"
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        error={errors.note}
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
            Hapus target
          </Button>
        ) : null}
      </div>
    </form>
  )
}
