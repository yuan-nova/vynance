import { dateOnlyOf, parseScanText, type ScanCommitInput } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Money } from "@/components/Money"
import { useCategories } from "@/features/categories"
import { useWallets } from "@/features/wallets"
import { useCommitScan } from "../hooks/useTransactions"

type Row = {
  pick: boolean
  type: "income" | "expense" | "transfer"
  amount: bigint
  txDate: string
  note: string
  categoryId: string
  categoryName: string | null
  toWalletId: string
}

type ScanFlowProps = { bookId: string; onSaved: (count: number) => void }

/** OCR di perangkat (ADR 0004): gambar tidak pernah keluar dari ponsel; hanya baris yang dipilih yang dikirim. */
async function ocr(file: File, onProgress: (p: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker("ind+eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress(m.progress)
    },
  })
  try {
    return (await worker.recognize(file)).data.text
  } finally {
    await worker.terminate()
  }
}

/** Tambah Cepat (PB-03): pilih foto struk/mutasi atau tempel teks → tinjau baris → simpan semua. */
export function ScanFlow({ bookId, onSaved }: ScanFlowProps) {
  const wallets = useWallets(bookId)
  const expenseCats = useCategories(bookId, "expense")
  const incomeCats = useCategories(bookId, "income")
  const commit = useCommitScan(bookId)
  const [key] = useState(() => crypto.randomUUID().replaceAll("-", ""))
  const [text, setText] = useState("")
  const [progress, setProgress] = useState<number | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [walletId, setWalletId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const active = wallets.data?.wallets.filter((w) => !w.archivedAt) ?? []
  const wallet = walletId || active[0]?.id || ""
  const catsFor = (t: Row["type"]) =>
    ((t === "income" ? incomeCats.data : expenseCats.data) ?? []).filter((c) => !c.archivedAt)
  const idByName = (t: Row["type"], name: string | null) =>
    catsFor(t).find((c) => c.name.toLowerCase() === name?.toLowerCase())?.id ?? ""

  const parse = (raw: string) => {
    const today = dateOnlyOf(new Date())
    const r = parseScanText(raw, today.slice(0, 4))
    if (r.rows.length === 0) {
      setError("Tidak ada transaksi yang terbaca. Coba foto yang lebih terang, atau tempel teksnya.")
      return
    }
    setError(null)
    setRows(
      r.rows.map((x) => {
        const type = x.direction === "in" ? "income" : "expense"
        return {
          pick: true,
          type,
          amount: x.amount,
          txDate: x.txDate ?? today,
          note: x.note,
          categoryName: x.categoryName,
          categoryId: idByName(type, x.categoryName),
          toWalletId: "",
        }
      }),
    )
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      const t = await ocr(file, setProgress)
      setText(t)
      parse(t)
    } catch {
      setError("Gambar gagal dibaca. Tempel teks struk atau mutasi sebagai gantinya.")
    } finally {
      setProgress(null)
    }
  }

  const patch = (i: number, p: Partial<Row>) =>
    setRows((rs) => rs?.map((r, j) => (j === i ? { ...r, ...p } : r)) ?? null)

  const picked = rows?.filter((r) => r.pick) ?? []
  const missing = picked.some((r) => (r.type === "transfer" ? !r.toWalletId || r.toWalletId === wallet : !r.categoryId))

  const save = () => {
    const items: ScanCommitInput["items"] = picked.map((r) =>
      r.type === "transfer"
        ? {
            type: "transfer",
            amount: r.amount,
            txDate: r.txDate,
            walletId: wallet,
            toWalletId: r.toWalletId,
            note: r.note,
          }
        : {
            type: r.type,
            amount: r.amount,
            txDate: r.txDate,
            walletId: wallet,
            categoryId: r.categoryId,
            note: r.note,
          },
    )
    commit.mutate({ items, key }, { onSuccess: (n) => onSaved(n), onError: (e) => setError(e.message) })
  }

  if (!rows) {
    return (
      <div className="scan-flow">
        <p className="body">
          Foto struk, mutasi rekening, atau riwayat e-wallet. Gambar dibaca di perangkat ini dan tidak diunggah.
        </p>
        <label className="btn btn-soft btn-full scan-pick">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={progress !== null}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {progress !== null ? `Membaca gambar… ${Math.round(progress * 100)}%` : "Pilih atau ambil foto"}
        </label>
        <label className="field">
          <span className="field-label">Atau tempel teks</span>
          <textarea className="field-input scan-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button variant="primary" full disabled={!text.trim() || progress !== null} onClick={() => parse(text)}>
          Baca teks
        </Button>
      </div>
    )
  }

  return (
    <div className="scan-flow">
      <label className="field">
        <span className="field-label">Rekening</span>
        <select className="field-input" value={wallet} onChange={(e) => setWalletId(e.target.value)}>
          {active.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <ul className="plain-list scan-rows">
        {rows.map((r, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: baris hasil scan tidak punya id dan urutannya tetap.
          <li key={i} className="card scan-row">
            <label className="scan-row-head">
              <input type="checkbox" checked={r.pick} onChange={(e) => patch(i, { pick: e.target.checked })} />
              <span className="row-title">{r.note || "Tanpa catatan"}</span>
              <Money value={r.amount} />
            </label>
            <span className="row-sub">{r.txDate}</span>
            <div className="scan-row-fields">
              <select
                className="field-input"
                aria-label={`Jenis baris ${i + 1}`}
                value={r.type}
                onChange={(e) => {
                  const type = e.target.value as Row["type"]
                  patch(i, { type, categoryId: idByName(type, r.categoryName) })
                }}
              >
                <option value="expense">Uang keluar</option>
                <option value="income">Uang masuk</option>
                <option value="transfer">Transfer</option>
              </select>
              {r.type === "transfer" ? (
                <select
                  className="field-input"
                  aria-label={`Rekening tujuan baris ${i + 1}`}
                  value={r.toWalletId}
                  onChange={(e) => patch(i, { toWalletId: e.target.value })}
                >
                  <option value="">Pilih rekening tujuan</option>
                  {active
                    .filter((w) => w.id !== wallet)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  className="field-input"
                  aria-label={`Kategori baris ${i + 1}`}
                  aria-invalid={r.pick && !r.categoryId ? "true" : undefined}
                  value={r.categoryId}
                  onChange={(e) => patch(i, { categoryId: e.target.value })}
                >
                  <option value="">Pilih kategori</option>
                  {catsFor(r.type).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        variant="primary"
        full
        loading={commit.isPending}
        disabled={picked.length === 0 || missing || !wallet}
        onClick={save}
      >
        {missing ? "Lengkapi kategori atau rekening tujuan" : `Simpan ${picked.length} transaksi`}
      </Button>
      <Button variant="ghost" full onClick={() => setRows(null)}>
        Scan ulang
      </Button>
    </div>
  )
}
