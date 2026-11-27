import { useNavigate } from "@tanstack/react-router"
import { dateOnlyOf, formatDateLong, formatTime, isDebtWallet, NISAB_GRAMS } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Money } from "@/components/Money"
import { MoneyInput } from "@/components/MoneyInput"
import { Pill } from "@/components/Pill"
import { Sheet } from "@/components/Sheet"
import { ErrorState, Skeleton } from "@/components/States"
import { TextField } from "@/components/TextField"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { useWallets } from "@/features/wallets"
import { usePayZakat, useSaveHaulStart, useZakat } from "@/features/zakat"
import { showSnackbar } from "@/lib/snackbar"

const SOURCE_LABEL = { manual: "Diisi manual", live: "Live", default: "Nilai bawaan" } as const

/** Zakat Maal (design/15-zakat.svg, FR-110, PB-08, BR-42). */
export function ZakatPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const [manualGold, setManualGold] = useState<bigint | null>(null)
  const q = useZakat(bookId, manualGold)
  const wallets = useWallets(bookId)
  const pay = usePayZakat(bookId)
  const saveHaul = useSaveHaulStart(bookId)
  const [sheet, setSheet] = useState<"gold" | "pay" | null>(null)
  const [goldDraft, setGoldDraft] = useState<bigint | null>(null)
  const [amount, setAmount] = useState<bigint | null>(null)
  const [walletId, setWalletId] = useState("")
  const [txDate, setTxDate] = useState(() => dateOnlyOf(new Date()))
  const [key, setKey] = useState(() => crypto.randomUUID().replaceAll("-", ""))
  const d = q.data
  const activeWallets = wallets.data?.wallets.filter((w) => !w.archivedAt && !isDebtWallet(w.type)) ?? []
  const chosenWallet = walletId || activeWallets[0]?.id || ""

  const openPay = () => {
    setAmount(d ? BigInt(d.zakat) : null)
    setKey(crypto.randomUUID().replaceAll("-", ""))
    setSheet("pay")
  }

  return (
    <>
      <TopBar
        level={2}
        title="Zakat Maal"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
      />
      {q.isPending ? <Skeleton rows={3} height={96} /> : null}
      {q.isError && !d ? (
        <ErrorState message="Zakat gagal dihitung." onRetry={() => void q.refetch()} retrying={q.isFetching} />
      ) : null}
      {d ? (
        <>
          <section className="card zakat-gold">
            <div>
              <p className="row-sub">Harga emas</p>
              <p className="row-title">
                <Money value={BigInt(d.goldPrice)} /> / gram
              </p>
              <p className="row-sub">
                {SOURCE_LABEL[d.goldSource]}
                {d.goldFetchedAt ? ` · ${formatTime(new Date(d.goldFetchedAt))}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setGoldDraft(BigInt(d.goldPrice))
                setSheet("gold")
              }}
            >
              Ubah
            </Button>
          </section>

          <section className="section">
            <h2 className="h2">Harta yang dihitung</h2>
            <dl className="card detail-list">
              <div>
                <dt>Kas semua rekening</dt>
                <dd>
                  <Money value={BigInt(d.cash)} sign="income" />
                </dd>
              </div>
              <div>
                <dt>Investasi (nilai kini)</dt>
                <dd>
                  <Money value={BigInt(d.investments)} sign="income" />
                </dd>
              </div>
              <div>
                <dt>Utang jatuh tempo</dt>
                <dd>
                  <Money value={-BigInt(d.debtDue)} sign="expense" tone="exp" />
                </dd>
              </div>
              <div>
                <dt>
                  <strong>Total harta</strong>
                </dt>
                <dd>
                  <strong>
                    <Money value={BigInt(d.wealth)} />
                  </strong>
                </dd>
              </div>
              <div>
                <dt>Nisab ({NISAB_GRAMS} g emas)</dt>
                <dd>
                  <Money value={BigInt(d.nisab)} />
                </dd>
              </div>
            </dl>
          </section>

          <section className={`card zakat-result${d.obligatory ? " zakat-due" : ""}`}>
            <Pill tone={d.obligatory ? "inc" : "neutral"}>
              {d.obligatory ? "Harta di atas nisab — wajib zakat" : "Harta di bawah nisab — belum wajib zakat"}
            </Pill>
            <p className="row-sub">Zakat yang perlu dibayar (2,5%)</p>
            <p className="zakat-amount">
              <Money value={BigInt(d.zakat)} />
            </p>
            {d.haulDate ? (
              <p className={d.haulReached ? "body text-warn" : "row-sub"} role={d.haulReached ? "status" : undefined}>
                {d.haulReached ? "Haul tercapai: " : "Haul tercapai pada "}
                {formatDateLong(d.haulDate)}
              </p>
            ) : null}
          </section>

          <section className="card section">
            <TextField
              label="Mulai haul (harta mencapai nisab)"
              type="date"
              value={d.haulStart ?? ""}
              hint="Haul = 1 tahun hijriah (354 hari). Diperbarui otomatis saat pembayaran dicatat."
              onChange={(e) =>
                saveHaul.mutate(e.target.value || null, {
                  onError: (err) => showSnackbar(err.message, { tone: "error" }),
                })
              }
            />
          </section>

          <p className="row-sub zakat-note">
            Hitungan ini perkiraan. Konsultasikan dengan lembaga amil zakat bila ragu.
          </p>
          {d.categoryId ? (
            <Button variant="primary" full icon="moon" onClick={openPay}>
              Catat pembayaran zakat
            </Button>
          ) : (
            <p className="body">Buat kategori uang keluar “Zakat & Infaq” dulu untuk mencatat pembayaran.</p>
          )}
        </>
      ) : null}

      <Sheet
        open={sheet === "gold"}
        title="Harga emas per gram"
        onClose={() => setSheet(null)}
        footer={
          <>
            <Button
              variant="primary"
              full
              disabled={!goldDraft}
              onClick={() => {
                setManualGold(goldDraft)
                setSheet(null)
              }}
            >
              Pakai harga ini
            </Button>
            {manualGold ? (
              <Button
                variant="ghost"
                full
                onClick={() => {
                  setManualGold(null)
                  setSheet(null)
                }}
              >
                Kembali ke harga otomatis
              </Button>
            ) : null}
          </>
        }
      >
        <MoneyInput label="Harga emas per gram" value={goldDraft} onChange={setGoldDraft} autoFocus />
      </Sheet>

      <Sheet
        open={sheet === "pay"}
        title="Catat pembayaran zakat"
        onClose={() => setSheet(null)}
        footer={
          <Button
            variant="primary"
            full
            loading={pay.isPending}
            disabled={!amount || amount <= 0n || !chosenWallet}
            onClick={() =>
              pay.mutate(
                { input: { amount: amount ?? 0n, walletId: chosenWallet, txDate }, key },
                {
                  onSuccess: () => {
                    setSheet(null)
                    showSnackbar("Pembayaran zakat dicatat")
                  },
                  onError: (e) => showSnackbar(e.message, { tone: "error" }),
                },
              )
            }
          >
            Simpan
          </Button>
        }
      >
        <MoneyInput label="Jumlah" value={amount} onChange={setAmount} large />
        <label className="field">
          <span className="field-label">Dari rekening</span>
          <select className="field-input" value={chosenWallet} onChange={(e) => setWalletId(e.target.value)}>
            {activeWallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <TextField label="Tanggal" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
      </Sheet>
    </>
  )
}
