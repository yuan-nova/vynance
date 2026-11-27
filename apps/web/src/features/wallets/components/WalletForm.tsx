import {
  createWalletSchema,
  isDebtWallet,
  WALLET_TYPE_LABEL,
  WALLET_TYPES,
  type Wallet,
  type WalletType,
} from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Values = { name: string; type: WalletType; openingBalance: bigint; creditLimit: bigint | null }
type Fields = "name" | "type" | "openingBalance" | "creditLimit"

type WalletFormProps = {
  initial?: Wallet
  pending: boolean
  submitLabel: string
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

const TYPE_OPTIONS = WALLET_TYPES.map((t) => ({ value: t, label: WALLET_TYPE_LABEL[t] }))

/** Form rekening: 4 kolom isian → bottom sheet (DS-SHEET-01). Limit hanya untuk tipe utang (FR-10). */
export function WalletForm({ initial, pending, submitLabel, onSubmit, onDelete }: WalletFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [type, setType] = useState<WalletType>(initial?.type ?? "bank")
  const [opening, setOpening] = useState<bigint | null>(initial ? BigInt(initial.openingBalance) : 0n)
  const [limit, setLimit] = useState<bigint | null>(initial?.creditLimit ? BigInt(initial.creditLimit) : null)
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})
  const debt = isDebtWallet(type)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createWalletSchema.safeParse({
      name,
      type,
      openingBalance: (opening ?? 0n).toString(),
      creditLimit: debt && limit !== null ? limit.toString() : null,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setErrors({ [(issue?.path[0] as Fields | undefined) ?? "form"]: issue?.message })
      return
    }
    setErrors({})
    onSubmit(
      {
        name: parsed.data.name,
        type,
        openingBalance: parsed.data.openingBalance,
        creditLimit: parsed.data.creditLimit ?? null,
      },
      (err) => {
        const { fields, formError } = splitApiError(err, ["name", "type", "openingBalance", "creditLimit"] as const)
        setErrors({ ...fields, form: formError ?? undefined })
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Nama rekening"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <ChipGroup label="Tipe" options={TYPE_OPTIONS} value={type} onChange={setType} />
      <MoneyInput
        label="Saldo awal"
        value={opening}
        onChange={setOpening}
        error={errors.openingBalance}
        allowNegative={debt}
        hint={debt ? "Untuk utang, isi minus. Contoh: -2.250.000" : undefined}
      />
      {debt ? <MoneyInput label="Limit" value={limit} onChange={setLimit} error={errors.creditLimit} /> : null}
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <div className="stack">
        <Button type="submit" full loading={pending}>
          {submitLabel}
        </Button>
        {onDelete ? (
          <Button variant="ghost" full icon="trash" onClick={onDelete}>
            Hapus rekening
          </Button>
        ) : null}
      </div>
    </form>
  )
}
