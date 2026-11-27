import { dateOnlyOf, monthOfDate, type SavePayslipInput, savePayslipSchema } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { Money } from "@/components/Money"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"
import { useReadPayslipPdf } from "../hooks/usePayslips"

type Fields = "period" | "gross" | "deductions" | "net"
const FIELDS = ["period", "gross", "deductions", "net"] as const

type PayslipFormProps = {
  pending: boolean
  onSubmit: (v: SavePayslipInput, onError: (err: unknown) => void) => void
}

/**
 * Unggah slip PDF (dibaca di perangkat, ADR 0007) atau isi manual, lalu tinjau sebelum simpan.
 * Gaji bersih selalu = kotor − potongan supaya angka konsisten.
 */
export function PayslipForm({ pending, onSubmit }: PayslipFormProps) {
  const [period, setPeriod] = useState(monthOfDate(dateOnlyOf(new Date())))
  const [gross, setGross] = useState<bigint | null>(null)
  const [deductions, setDeductions] = useState<bigint | null>(0n)
  const read = useReadPayslipPdf()
  const reading = read.isPending
  const [note, setNote] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Fields | "form", string>>>({})
  const net = gross !== null ? gross - (deductions ?? 0n) : null

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setErrors({})
    try {
      const p = await read.mutateAsync(file)
      if (p.period) setPeriod(p.period)
      if (p.gross !== null) setGross(p.gross)
      if (p.deductions !== null) setDeductions(p.deductions)
      const missing = [p.period ? null : "periode", p.gross === null ? "gaji kotor" : null].filter(Boolean)
      setNote(
        missing.length > 0
          ? `Sebagian terbaca. Lengkapi ${missing.join(" dan ")} secara manual.`
          : "Slip terbaca. Periksa angkanya sebelum menyimpan.",
      )
    } catch {
      setNote(null)
      setErrors({ form: "PDF gagal dibaca. Isi angkanya secara manual." })
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = savePayslipSchema.safeParse({
      period,
      gross: (gross ?? 0n).toString(),
      deductions: (deductions ?? 0n).toString(),
      net: (net ?? 0n).toString(),
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
      <p className="body">PDF dibaca di perangkat ini dan tidak diunggah. Hanya angka yang disimpan.</p>
      <label className="btn btn-soft btn-full scan-pick">
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          disabled={reading}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {reading ? "Membaca slip…" : "Pilih PDF slip gaji"}
      </label>
      {note ? (
        <p className="row-sub" role="status">
          {note}
        </p>
      ) : null}
      <TextField
        label="Periode"
        type="month"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        error={errors.period}
      />
      <MoneyInput label="Gaji kotor" value={gross} onChange={setGross} error={errors.gross} />
      <MoneyInput label="Total potongan" value={deductions} onChange={setDeductions} error={errors.deductions} />
      <p className="payslip-net">
        <span className="row-sub">Gaji bersih</span>
        {net !== null ? <Money value={net} /> : <span className="row-sub">—</span>}
      </p>
      {errors.net ? (
        <p className="field-error" role="alert">
          {errors.net}
        </p>
      ) : null}
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" full loading={pending}>
        Simpan
      </Button>
    </form>
  )
}
