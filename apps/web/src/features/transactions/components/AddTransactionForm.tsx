import {
  type Category,
  type CategoryKind,
  createTransactionSchema,
  dateOnlyOf,
  formatDateShort,
  formatMoney,
  type TransactionDetail,
} from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { useCategories } from "@/features/categories"
import { usePortfolio } from "@/features/investments"
import { useWallets } from "@/features/wallets"
import { splitApiError } from "@/lib/api-error"
import { usePrivacyMode } from "@/lib/hooks/usePrivacyMode"
import { useCategoryUsage, useCreateTransaction, useUpdateTransaction } from "../hooks/useTransactions"

type TxKind = "expense" | "income" | "transfer" | "asset_buy" | "asset_sell"
type Field = "amount" | "categoryId" | "walletId" | "toWalletId" | "assetId" | "txDate" | "note"

const TYPE_OPTIONS = [
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
  { value: "asset_buy", label: "Beli aset" },
  { value: "asset_sell", label: "Jual aset" },
] as const

const CHIP_LIMIT = 8

/** Urutkan kategori: yang sering dipakai di depan, sisanya mengikuti urutan pengguna (PB-02 langkah 3). */
function byUsage(categories: Category[], usage: { categoryId: string; count: number }[]): Category[] {
  const rank = new Map(usage.map((u, i) => [u.categoryId, i]))
  return [...categories].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999) || a.sortOrder - b.sortOrder)
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

type AddTransactionFormProps = { bookId: string; onSaved: () => void; initial?: TransactionDetail }

/**
 * Catat transaksi (design/04-add-transaction.svg, PB-02): tipe → jumlah → kategori → rekening → tanggal → catatan.
 * 6 kolom isian → bottom sheet (DS-SHEET-01). Satu tombol primer di bawah (DS-ACTION-01).
 */
export function AddTransactionForm({ bookId, onSaved, initial }: AddTransactionFormProps) {
  const privacy = usePrivacyMode()
  const [type, setType] = useState<TxKind>(initial?.type ?? "expense")
  const isAsset = type === "asset_buy" || type === "asset_sell"
  const kind: CategoryKind = type === "income" ? "income" : "expense"
  const wallets = useWallets(bookId)
  const categories = useCategories(bookId, kind)
  const usage = useCategoryUsage(bookId, kind)
  const portfolio = usePortfolio(bookId)
  const create = useCreateTransaction(bookId)
  const update = useUpdateTransaction(bookId)
  const saving = initial ? update : create
  // Kunci idempotensi dibuat sekali per sheet; simpan ganda memakai kunci yang sama.
  const [key] = useState(() => crypto.randomUUID().replaceAll("-", ""))
  const today = dateOnlyOf(new Date())

  const [amount, setAmount] = useState<bigint | null>(initial ? BigInt(initial.amount) : null)
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null)
  const [walletId, setWalletId] = useState<string | null>(initial?.walletId ?? null)
  const [toWalletId, setToWalletId] = useState<string | null>(initial?.toWalletId ?? null)
  const [assetId, setAssetId] = useState<string | null>(initial?.assetId ?? null)
  const [txDate, setTxDate] = useState(initial?.txDate ?? today)
  const [note, setNote] = useState(initial?.note ?? "")
  const [showAll, setShowAll] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<Field | "form", string>>>({})

  const activeWallets = (wallets.data?.wallets ?? []).filter((w) => w.archivedAt === null)
  const chosenWallet = walletId ?? activeWallets.find((w) => w.type === "bank")?.id ?? activeWallets[0]?.id ?? null
  const sorted = byUsage(categories.data ?? [], usage.data ?? [])
  const chips = showAll ? sorted : sorted.slice(0, CHIP_LIMIT)
  const walletLabel = (w: (typeof activeWallets)[number]) =>
    privacy ? w.name : `${w.name} · ${formatMoney(BigInt(w.balance))}`

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const base = { amount: (amount ?? 0n).toString(), txDate, walletId: chosenWallet ?? "", note: note || undefined }
    const parsed = createTransactionSchema.safeParse(
      type === "transfer"
        ? { ...base, type, toWalletId: toWalletId ?? "" }
        : type === "asset_buy" || type === "asset_sell"
          ? { ...base, type, assetId: assetId ?? "" }
          : { ...base, type, categoryId: categoryId ?? "" },
    )
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const field = issue?.path[0] as Field | undefined
      const message =
        field === "amount"
          ? "Isi jumlah lebih dari 0"
          : field === "categoryId"
            ? "Pilih kategori"
            : field === "assetId"
              ? "Pilih aset"
              : field === "toWalletId" && !toWalletId
                ? "Pilih rekening tujuan"
                : issue?.message
      setErrors({ [field ?? "form"]: message })
      return
    }
    setErrors({})
    const handlers = {
      onSuccess: onSaved,
      onError: (err: unknown) => {
        const { fields, formError } = splitApiError(err, [
          "amount",
          "categoryId",
          "walletId",
          "toWalletId",
          "assetId",
          "txDate",
          "note",
        ] as const)
        setErrors({ ...fields, form: formError ?? undefined })
      },
    }
    if (initial) update.mutate({ id: initial.id, input: parsed.data }, handlers)
    else create.mutate({ input: parsed.data, key }, handlers)
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChipGroup
        label="Jenis"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(t) => {
          setType(t)
          setCategoryId(null)
          setErrors({})
        }}
      />
      <MoneyInput label="Jumlah" value={amount} onChange={setAmount} error={errors.amount} large autoFocus={!initial} />

      {isAsset ? (
        <div className="field">
          {(portfolio.data?.assets.length ?? 0) > 0 ? (
            <ChipGroup
              label="Aset"
              options={(portfolio.data?.assets ?? []).map((a) => ({
                value: a.id,
                label: privacy ? a.name : `${a.name} · ${formatMoney(BigInt(a.currentValue))}`,
              }))}
              value={assetId ?? ""}
              onChange={setAssetId}
            />
          ) : (
            <p className="row-sub">Belum ada aset. Tambahkan dulu di Lainnya → Investasi.</p>
          )}
          {errors.assetId ? <p className="field-error">{errors.assetId}</p> : null}
          <p className="row-sub">Beli dan jual aset tidak dihitung sebagai pemasukan atau pengeluaran.</p>
        </div>
      ) : null}

      {type !== "transfer" && !isAsset ? (
        <div className="field">
          <ChipGroup
            label="Kategori"
            options={chips.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId ?? ""}
            onChange={setCategoryId}
          />
          {sorted.length > CHIP_LIMIT ? (
            <button type="button" className="link-row" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Tampilkan lebih sedikit" : `Semua kategori (${sorted.length})`}
            </button>
          ) : null}
          {errors.categoryId ? <p className="field-error">{errors.categoryId}</p> : null}
        </div>
      ) : null}

      <ChipGroup
        label={type === "transfer" ? "Dari rekening" : "Rekening"}
        options={activeWallets.map((w) => ({ value: w.id, label: walletLabel(w) }))}
        value={chosenWallet ?? ""}
        onChange={setWalletId}
      />
      {errors.walletId ? <p className="field-error">{errors.walletId}</p> : null}

      {type === "transfer" ? (
        <div className="field">
          <ChipGroup
            label="Ke rekening"
            options={activeWallets
              .filter((w) => w.id !== chosenWallet)
              .map((w) => ({ value: w.id, label: walletLabel(w) }))}
            value={toWalletId ?? ""}
            onChange={setToWalletId}
          />
          {errors.toWalletId ? <p className="field-error">{errors.toWalletId}</p> : null}
        </div>
      ) : null}

      <ChipGroup
        label="Tanggal"
        options={[
          { value: today, label: `Hari ini, ${formatDateShort(today)}` },
          { value: shiftDate(today, -1), label: "Kemarin" },
          ...(txDate !== today && txDate !== shiftDate(today, -1)
            ? [{ value: txDate, label: formatDateShort(txDate) }]
            : []),
        ]}
        value={txDate}
        onChange={setTxDate}
      />
      <TextField
        label="Tanggal lain"
        type="date"
        value={txDate}
        max={today}
        onChange={(e) => e.target.value && setTxDate(e.target.value)}
        error={errors.txDate}
      />
      <TextField
        label="Catatan (opsional)"
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        error={errors.note}
        placeholder="Contoh: Indomaret"
      />
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" full loading={saving.isPending}>
        Simpan
      </Button>
    </form>
  )
}
