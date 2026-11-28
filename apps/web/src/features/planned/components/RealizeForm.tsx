import type { Category, PlannedItem, RealizePlannedInput, Wallet } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"

type RealizeFormProps = {
  item: PlannedItem
  wallets: Wallet[]
  /** Kategori sesuai jenis rencana (pemasukan untuk penghasilan, pengeluaran untuk langganan). */
  categories: Category[]
  defaultCategoryId: string | null
  defaultWalletId: string | null
  today: string
  pending: boolean
  error?: string
  onSubmit: (input: RealizePlannedInput) => void
}

/** Realisasi rencana (PB-13 langkah 3–4): semua isian bisa diubah; nominal 0 = Lewati. */
export function RealizeForm({
  item,
  wallets,
  categories,
  defaultCategoryId,
  defaultWalletId,
  today,
  pending,
  error,
  onSubmit,
}: RealizeFormProps) {
  const [amount, setAmount] = useState<bigint | null>(BigInt(item.amount))
  // Rencana bulan lalu yang terlewat memakai tanggal rencananya; bulan ini memakai hari ini bila sudah lewat.
  const [txDate, setTxDate] = useState(item.dueDate < today && item.period === today.slice(0, 7) ? today : item.dueDate)
  const [walletId, setWalletId] = useState(item.walletId ?? defaultWalletId ?? wallets[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState(item.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "")
  const [note, setNote] = useState("")
  const [amountError, setAmountError] = useState<string>()

  const send = (value: bigint) =>
    onSubmit({
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      period: item.period,
      amount: value,
      txDate,
      walletId,
      categoryId,
      note: note.trim() || undefined,
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (amount === null) {
      setAmountError("Isi nominal. Ketik 0 untuk melewati bulan ini.")
      return
    }
    setAmountError(undefined)
    send(amount)
  }

  return (
    <form onSubmit={submit} noValidate>
      <MoneyInput
        label="Nominal"
        value={amount}
        onChange={setAmount}
        error={amountError}
        hint={`Rencana ${BigInt(item.amount).toLocaleString("id-ID")}. Boleh beda, 0 = lewati.`}
        autoFocus
      />
      <TextField label="Tanggal" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
      <ChipGroup
        label="Rekening"
        options={wallets.map((w) => ({ value: w.id, label: w.name }))}
        value={walletId}
        onChange={setWalletId}
      />
      <ChipGroup
        label="Kategori"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        value={categoryId}
        onChange={setCategoryId}
      />
      <TextField
        label="Catatan (opsional)"
        value={note}
        maxLength={200}
        placeholder={item.name}
        onChange={(e) => setNote(e.target.value)}
      />
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="stack">
        <Button type="submit" full loading={pending}>
          {amount === 0n ? "Lewati bulan ini" : "Simpan realisasi"}
        </Button>
        {amount !== 0n ? (
          <Button variant="ghost" full disabled={pending} onClick={() => send(0n)}>
            Lewati bulan ini
          </Button>
        ) : null}
      </div>
    </form>
  )
}
