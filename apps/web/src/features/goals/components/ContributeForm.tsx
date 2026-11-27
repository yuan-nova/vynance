import { createContributionSchema, dateOnlyOf, type Goal } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { Money } from "@/components/Money"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type ContributeFormProps = {
  goal: Goal
  pending: boolean
  onSubmit: (v: { amount: bigint; contributedOn: string }, onError: (err: unknown) => void) => void
}

/** Tambah setoran. Saran nominal = setoran/bulan yang dibutuhkan (BR-20). */
export function ContributeForm({ goal, pending, onSubmit }: ContributeFormProps) {
  const today = dateOnlyOf(new Date())
  const [amount, setAmount] = useState<bigint | null>(goal.monthlyNeeded ? BigInt(goal.monthlyNeeded) : null)
  const [date, setDate] = useState(today)
  const [errors, setErrors] = useState<Partial<Record<"amount" | "contributedOn" | "form", string>>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createContributionSchema.safeParse({ amount: (amount ?? 0n).toString(), contributedOn: date })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setErrors({ [(issue?.path[0] as "amount" | undefined) ?? "form"]: issue?.message })
      return
    }
    setErrors({})
    onSubmit(parsed.data, (err) => {
      const { fields, formError } = splitApiError(err, ["amount", "contributedOn"] as const)
      setErrors({ ...fields, form: formError ?? undefined })
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="row-sub">
        Sisa <Money value={BigInt(goal.remaining)} /> untuk {goal.name}
      </p>
      <MoneyInput label="Jumlah setoran" value={amount} onChange={setAmount} error={errors.amount} large autoFocus />
      <TextField
        label="Tanggal setor"
        type="date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && setDate(e.target.value)}
        error={errors.contributedOn}
      />
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" full loading={pending}>
        Simpan setoran
      </Button>
    </form>
  )
}
