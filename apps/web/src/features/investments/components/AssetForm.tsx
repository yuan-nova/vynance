import { type Asset, createAssetSchema, type Portfolio } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Fields = "name" | "investmentTypeId" | "units" | "costBasis" | "currentValue"
const FIELDS = ["name", "investmentTypeId", "units", "costBasis", "currentValue"] as const
type Values = ReturnType<typeof createAssetSchema.parse>

type AssetFormProps = {
  initial?: Asset
  types: Portfolio["types"]
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

/**
 * Aset (PB-06 langkah 2, 4). Saat mengubah, modal tidak bisa diedit langsung (berubah lewat beli/jual, #32);
 * yang diperbarui manual adalah nilai kini.
 */
export function AssetForm({ initial, types, pending, onSubmit, onDelete }: AssetFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [typeId, setTypeId] = useState(initial?.investmentTypeId ?? types[0]?.id ?? "")
  const [units, setUnits] = useState(initial ? String(Number(initial.units)) : "")
  const [cost, setCost] = useState<bigint | null>(initial ? BigInt(initial.costBasis) : null)
  const [value, setValue] = useState<bigint | null>(initial ? BigInt(initial.currentValue) : null)
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createAssetSchema.safeParse({
      name,
      investmentTypeId: typeId,
      units: (units.trim() || "0").replace(/\./g, "").replace(",", "."),
      costBasis: (cost ?? 0n).toString(),
      currentValue: (value ?? cost ?? 0n).toString(),
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
        label="Nama aset"
        value={name}
        maxLength={60}
        placeholder="Contoh: Emas Antam, BBCA, RDPU"
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <ChipGroup
        label="Jenis"
        options={types.map((t) => ({ value: t.id, label: t.name }))}
        value={typeId}
        onChange={setTypeId}
      />
      <TextField
        label="Jumlah unit (gram, lembar, unit)"
        inputMode="decimal"
        value={units}
        onChange={(e) => setUnits(e.target.value)}
        error={errors.units}
      />
      {initial ? (
        <p className="row-sub">Modal berubah lewat transaksi beli/jual aset.</p>
      ) : (
        <MoneyInput label="Modal (total harga beli)" value={cost} onChange={setCost} error={errors.costBasis} />
      )}
      <MoneyInput
        label="Nilai kini"
        value={value}
        onChange={setValue}
        error={errors.currentValue}
        hint={initial ? undefined : "Kosongkan bila sama dengan modal."}
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
            Hapus aset
          </Button>
        ) : null}
      </div>
    </form>
  )
}
