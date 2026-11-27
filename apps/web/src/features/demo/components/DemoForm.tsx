import { DEMO_CATEGORIES, dateOnlyOf } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { demoActions } from "../hooks/useDemo"

type Kind = "expense" | "income"
const TYPE_OPTIONS = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const

type DemoFormProps = { onSaved: () => void }

/** Catat transaksi mode demo. Disimpan di perangkat saja (FR-151). */
export function DemoForm({ onSaved }: DemoFormProps) {
  const [type, setType] = useState<Kind>("expense")
  const [amount, setAmount] = useState<bigint | null>(null)
  const [category, setCategory] = useState<string>(DEMO_CATEGORIES.expense[0] ?? "")
  const [txDate, setTxDate] = useState(dateOnlyOf(new Date()))
  const [note, setNote] = useState("")
  const [error, setError] = useState<string>()
  const options = DEMO_CATEGORIES[type].map((c) => ({ value: c, label: c }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0n) {
      setError("Isi jumlah lebih dari 0")
      return
    }
    demoActions.add({
      type,
      amount: amount.toString(),
      txDate,
      categoryName: category,
      note: note.trim() || null,
    })
    onSaved()
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChipGroup
        label="Jenis"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(t) => {
          setType(t)
          setCategory(DEMO_CATEGORIES[t][0] ?? "")
        }}
      />
      <MoneyInput label="Jumlah" value={amount} onChange={setAmount} error={error} autoFocus />
      <ChipGroup label="Kategori" options={options} value={category} onChange={setCategory} />
      <TextField label="Tanggal" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
      <TextField label="Catatan (opsional)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" full>
        Simpan di perangkat
      </Button>
    </form>
  )
}
