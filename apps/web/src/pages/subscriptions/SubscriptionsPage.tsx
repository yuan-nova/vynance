import { useNavigate } from "@tanstack/react-router"
import { dateOnlyOf, formatDateShort, heroNeedsShort, type Subscription } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  SubscriptionForm,
  SubscriptionRow,
  useCreateSubscription,
  useDeleteSubscription,
  useFxRates,
  useSubscriptions,
  useUpdateSubscription,
} from "@/features/subscriptions"
import { useWallets } from "@/features/wallets"
import { showSnackbar } from "@/lib/snackbar"

type SheetState =
  | { kind: "create" }
  | { kind: "edit"; sub: Subscription }
  | { kind: "delete"; sub: Subscription }
  | null

function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000)
}

/** Langganan (design/11-subscriptions.svg, FR-80, PB-05). */
export function SubscriptionsPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const query = useSubscriptions(bookId)
  const rates = useFxRates(bookId)
  const wallets = useWallets(bookId)
  const create = useCreateSubscription(bookId)
  const update = useUpdateSubscription(bookId)
  const remove = useDeleteSubscription(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const data = query.data
  const today = dateOnlyOf(new Date())
  const activeWallets = (wallets.data?.wallets ?? []).filter((w) => w.archivedAt === null)
  const next = data?.subscriptions.find((s) => !s.paused)
  const ready = rates.data && wallets.data
  const monthly = BigInt(data?.monthlyTotal ?? "0")

  return (
    <>
      <TopBar
        level={2}
        title="Langganan"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah langganan" onClick={() => setSheet({ kind: "create" })} />}
      />
      {query.isPending ? <Skeleton rows={4} /> : null}
      {query.isError && !data ? (
        <ErrorState
          message="Langganan gagal dimuat."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}

      {data && data.subscriptions.length > 0 ? (
        <section className="hero" aria-label="Ringkasan langganan">
          <p className="hero-label">Biaya rutin per bulan</p>
          <p className="hero-value">
            <Money value={monthly} short={heroNeedsShort(monthly)} />
          </p>
          <div className="hero-row">
            <span>
              <Money value={BigInt(data.yearlyTotal)} short />
              /thn
            </span>
            {next ? (
              <span>
                {next.name} · {formatDateShort(next.nextBillingDate)} ({daysUntil(next.nextBillingDate, today)} hari
                lagi)
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {data && data.subscriptions.length === 0 ? (
        <EmptyState
          icon="repeat"
          title="Belum ada langganan"
          body="Catat Netflix, internet, asuransi, dan tagihan rutin lain. Transaksinya dibuat otomatis tiap tanggal bayar."
          actionLabel="Tambah langganan"
          onAction={() => setSheet({ kind: "create" })}
        />
      ) : null}

      {data && data.subscriptions.length > 0 ? (
        <section className="section">
          <div className="card plain-list">
            {data.subscriptions.map((s) => (
              <SubscriptionRow key={s.id} sub={s} onOpen={() => setSheet({ kind: "edit", sub: s })} />
            ))}
          </div>
          <p className="row-sub section-note">Transaksi dibuat otomatis tiap tanggal bayar.</p>
        </section>
      ) : null}

      <Sheet open={sheet?.kind === "create"} title="Tambah langganan" onClose={close}>
        {ready && sheet?.kind === "create" ? (
          <SubscriptionForm
            wallets={activeWallets}
            rates={rates.data}
            pending={create.isPending}
            onSubmit={({ paused: _p, ...v }, onError) =>
              create.mutate(v, {
                onSuccess: (s) => {
                  close()
                  showSnackbar(`Langganan ${s.name} ditambahkan`)
                },
                onError,
              })
            }
          />
        ) : null}
      </Sheet>

      <Sheet open={sheet?.kind === "edit"} title="Ubah langganan" onClose={close}>
        {ready && sheet?.kind === "edit" ? (
          <SubscriptionForm
            key={sheet.sub.id}
            initial={sheet.sub}
            wallets={activeWallets}
            rates={rates.data}
            pending={update.isPending}
            onDelete={() => setSheet({ kind: "delete", sub: sheet.sub })}
            onSubmit={(v, onError) =>
              update.mutate(
                { id: sheet.sub.id, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Langganan disimpan")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "delete"}
        title={sheet?.kind === "delete" ? `Hapus langganan ${sheet.sub.name}?` : ""}
        onClose={close}
        footer={
          sheet?.kind === "delete" ? (
            <>
              <Button
                variant="destructive"
                full
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(sheet.sub.id, {
                    onSuccess: () => {
                      close()
                      showSnackbar("Langganan dihapus")
                    },
                    onError: (e) => {
                      close()
                      showSnackbar(e.message, { tone: "error" })
                    },
                  })
                }
              >
                Hapus
              </Button>
              <Button variant="ghost" full onClick={close}>
                Batal
              </Button>
            </>
          ) : null
        }
      >
        <p className="body">Transaksi yang sudah tercatat tetap ada. Tagihan berikutnya tidak dibuat lagi.</p>
      </Sheet>
    </>
  )
}
