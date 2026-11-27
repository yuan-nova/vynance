import { useNavigate } from "@tanstack/react-router"
import { isDebtWallet, WALLET_TYPE_LABEL, wealthSummary } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Money } from "@/components/Money"
import { MoneyInput } from "@/components/MoneyInput"
import { ErrorState, Skeleton } from "@/components/States"
import { useActiveBook } from "@/features/books"
import { useSaveOpeningBalances, useWallets } from "@/features/wallets"
import { showSnackbar } from "@/lib/snackbar"

/** Onboarding (design/02b-onboarding.svg, PB-01 langkah 3): saldo awal tiap rekening, lalu kelola sendiri/undang. */
export function OnboardingPage() {
  const navigate = useNavigate()
  const book = useActiveBook()
  const bookId = book?.id ?? ""
  const wallets = useWallets(bookId)
  const save = useSaveOpeningBalances(bookId)
  const [step, setStep] = useState<"balances" | "share">("balances")
  // Draf form lokal; data server tetap di TanStack Query.
  const [values, setValues] = useState<Record<string, bigint | null>>({})

  const list = (wallets.data?.wallets ?? []).filter((w) => w.archivedAt === null)
  const amountOf = (id: string, fallback: string): bigint | null =>
    id in values ? (values[id] ?? null) : BigInt(fallback)
  const summary = wealthSummary(list.map((w) => ({ type: w.type, balance: amountOf(w.id, w.openingBalance) ?? 0n })))

  const submit = (skip: boolean) =>
    save.mutate(
      skip ? [] : list.map((w) => ({ walletId: w.id, openingBalance: amountOf(w.id, w.openingBalance) ?? 0n })),
      { onSuccess: () => setStep("share"), onError: (e) => showSnackbar(e.message, { tone: "error" }) },
    )

  if (step === "share") {
    return (
      <main className="login">
        <p className="row-sub">Langkah 3 dari 3</p>
        <div className="login-copy">
          <h1 className="login-title">Kelola sendiri atau bersama?</h1>
          <p className="body">
            Semua anggota buku {book?.name} bisa melihat dan mencatat transaksi. Kamu bisa mengundang kapan saja.
          </p>
        </div>
        <div className="stack">
          <Button full onClick={() => void navigate({ to: "/" })}>
            Kelola sendiri
          </Button>
          <Button variant="soft" full disabled>
            Undang anggota · Segera hadir
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="login">
      <div className="status-row">
        <p className="row-sub">Langkah 2 dari 3</p>
        <Button variant="ghost" onClick={() => submit(true)} disabled={save.isPending}>
          Lewati
        </Button>
      </div>
      <div className="login-copy">
        <h1 className="login-title">Berapa saldo di tiap rekeningmu sekarang?</h1>
        <p className="body">Isi kira-kira saja. Bisa diubah kapan pun.</p>
      </div>
      {wallets.isPending ? <Skeleton rows={3} height={80} /> : null}
      {wallets.isError ? (
        <ErrorState
          message="Rekening gagal dimuat."
          onRetry={() => void wallets.refetch()}
          retrying={wallets.isFetching}
        />
      ) : null}
      <div>
        {list.map((w) => (
          <MoneyInput
            key={w.id}
            label={`${w.name} · ${WALLET_TYPE_LABEL[w.type]}`}
            value={amountOf(w.id, w.openingBalance)}
            onChange={(v) => setValues((prev) => ({ ...prev, [w.id]: v }))}
            allowNegative={isDebtWallet(w.type)}
            hint={isDebtWallet(w.type) ? "Utang diisi minus, misalnya -6.200.000" : undefined}
          />
        ))}
      </div>
      <div className="stack">
        <p className="status-row">
          <span>Total kas</span>
          <Money value={summary.cash} />
        </p>
        <Button full loading={save.isPending} onClick={() => submit(false)}>
          Lanjut
        </Button>
      </div>
    </main>
  )
}
