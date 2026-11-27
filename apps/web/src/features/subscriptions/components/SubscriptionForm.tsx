import {
  CURRENCIES,
  CURRENCY_SYMBOL,
  type Currency,
  createSubscriptionSchema,
  dateOnlyOf,
  type FxRates,
  formatMoney,
  type Subscription,
  toIdr,
  type Wallet,
} from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Fields = "name" | "originalAmount" | "fxRate" | "billingDay" | "billingMonth" | "walletId" | "startDate"
const FIELDS = ["name", "originalAmount", "fxRate", "billingDay", "billingMonth", "walletId", "startDate"] as const
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

type Values = ReturnType<typeof createSubscriptionSchema.parse> & { paused: boolean }

type SubscriptionFormProps = {
  initial?: Subscription
  wallets: Wallet[]
  rates: FxRates
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

/** Form langganan (PB-05 langkah 1): nama, biaya + mata uang (kurs otomatis/manual), siklus, tanggal, rekening. */
export function SubscriptionForm({ initial, wallets, rates, pending, onSubmit, onDelete }: SubscriptionFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "IDR")
  const [amount, setAmount] = useState(initial ? String(Number(initial.originalAmount)) : "")
  const [rate, setRate] = useState(initial?.fxRate ? String(Number(initial.fxRate)) : "")
  const [cycle, setCycle] = useState<"monthly" | "yearly">(initial?.cycle ?? "monthly")
  const [day, setDay] = useState(String(initial?.billingDay ?? new Date().getDate()))
  const [month, setMonth] = useState(String(initial?.billingMonth ?? new Date().getMonth() + 1))
  const [walletId, setWalletId] = useState(initial?.walletId ?? wallets[0]?.id ?? "")
  const [paused, setPaused] = useState(initial?.paused ?? false)
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})
  const autoRate = rates.find((r) => r.currency === currency)?.value ?? "1"
  const usedRate = currency === "IDR" ? "1" : rate.trim() || autoRate
  const normalized = amount.replace(/\./g, "").replace(",", ".")
  const preview =
    /^\d+(\.\d{1,2})?$/.test(normalized) && Number(normalized) > 0
      ? toIdr(normalized, usedRate.replace(",", "."))
      : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createSubscriptionSchema.safeParse({
      name,
      currency,
      originalAmount: currency === "IDR" ? normalized.split(".")[0] : normalized,
      fxRate: currency === "IDR" || !rate.trim() ? null : rate.trim().replace(",", "."),
      cycle,
      billingDay: Number(day),
      billingMonth: cycle === "yearly" ? Number(month) : null,
      walletId,
      categoryId: initial?.categoryId ?? null,
      startDate: initial?.startDate ?? dateOnlyOf(new Date()),
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setErrors({ [(issue?.path[0] as Fields | undefined) ?? "form"]: issue?.message })
      return
    }
    setErrors({})
    onSubmit({ ...parsed.data, paused }, (err) => {
      const { fields, formError } = splitApiError(err, FIELDS)
      setErrors({ ...fields, form: formError ?? undefined })
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Nama langganan"
        value={name}
        maxLength={60}
        placeholder="Contoh: Netflix, IndiHome, Asuransi"
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      <ChipGroup
        label="Mata uang"
        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        value={currency}
        onChange={setCurrency}
      />
      <TextField
        label={`Biaya (${CURRENCY_SYMBOL[currency]})`}
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.originalAmount}
        hint={preview !== null && currency !== "IDR" ? `≈ ${formatMoney(preview)}` : undefined}
      />
      {currency !== "IDR" ? (
        <TextField
          label={`Kurs 1 ${currency} (Rp)`}
          inputMode="decimal"
          value={rate}
          placeholder={`Otomatis: ${Number(autoRate).toLocaleString("id-ID")}`}
          onChange={(e) => setRate(e.target.value)}
          error={errors.fxRate}
          hint="Kosongkan untuk memakai kurs otomatis."
        />
      ) : null}
      <ChipGroup
        label="Siklus"
        options={[
          { value: "monthly", label: "Bulanan" },
          { value: "yearly", label: "Tahunan" },
        ]}
        value={cycle}
        onChange={setCycle}
      />
      <TextField
        label="Tanggal bayar (1–31)"
        inputMode="numeric"
        value={day}
        onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
        error={errors.billingDay}
        hint="Tanggal 31 di bulan pendek otomatis jadi tanggal terakhir bulan itu."
      />
      {cycle === "yearly" ? (
        <ChipGroup
          label="Bulan tagihan"
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
          value={month}
          onChange={setMonth}
        />
      ) : null}
      <ChipGroup
        label="Rekening"
        options={wallets.map((w) => ({ value: w.id, label: w.name }))}
        value={walletId}
        onChange={setWalletId}
      />
      {initial ? (
        <ChipGroup
          label="Status"
          options={[
            { value: "active", label: "Aktif" },
            { value: "paused", label: "Dijeda" },
          ]}
          value={paused ? "paused" : "active"}
          onChange={(v) => setPaused(v === "paused")}
        />
      ) : null}
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
            Hapus langganan
          </Button>
        ) : null}
      </div>
    </form>
  )
}
