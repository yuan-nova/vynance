import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { addMonths, dateOnlyOf, formatMonth, monthDateRange, monthOf, type TxType } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { Icon } from "@/components/Icon"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, NoMatchState, Skeleton } from "@/components/States"
import { TextField } from "@/components/TextField"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { TransactionList, transactionsCsvUrl, useTransactionList, useTransactionSummary } from "@/features/transactions"
import { useWallets } from "@/features/wallets"
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback"

const route = getRouteApi("/_tabs/transaksi")

const TYPE_CHIPS = [
  { value: "semua", label: "Semua" },
  { value: "keluar", label: "Keluar" },
  { value: "masuk", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
] as const
const TYPE_MAP: Record<string, TxType | undefined> = { keluar: "expense", masuk: "income", transfer: "transfer" }

/** Layar Transaksi (design/05-transactions.svg, FR-21). Bulan, jenis, rekening, dan cari disimpan di URL. */
export function TransactionsPage() {
  const navigate = useNavigate({ from: "/transaksi" })
  const search = route.useSearch()
  const bookId = useActiveBook()?.id ?? ""
  const today = dateOnlyOf(new Date())
  const month = search.bulan ?? monthOf(new Date())
  const { from, to } = monthDateRange(month)
  const filter = {
    from,
    to,
    type: TYPE_MAP[search.jenis],
    walletId: search.rekening,
    q: search.cari || undefined,
  }
  const list = useTransactionList(bookId, filter)
  const summary = useTransactionSummary(bookId, from, to)
  const wallets = useWallets(bookId)
  const [filterOpen, setFilterOpen] = useState(false)
  // Teks ketikan lokal; URL diperbarui 300 ms setelah berhenti mengetik (DS-DATA-02).
  const [draft, setDraft] = useState(search.cari ?? "")
  const pushSearch = useDebouncedCallback((cari: string) =>
    navigate({ search: (s) => ({ ...s, cari: cari || undefined }), replace: true }),
  )

  const items = list.data?.pages.flatMap((p) => p.data) ?? []
  const filtered = search.jenis !== "semua" || Boolean(search.rekening) || Boolean(search.cari)
  const activeFilters = (search.rekening ? 1 : 0) + (search.cari ? 1 : 0)
  const reset = () => {
    setDraft("")
    void navigate({ search: { bulan: search.bulan, jenis: "semua" } })
  }

  return (
    <>
      <TopBar
        level={1}
        title="Transaksi"
        actions={
          <span className="home-actions">
            <a
              className="icon-btn"
              href={transactionsCsvUrl(bookId, filter)}
              download
              aria-label="Unduh CSV sesuai filter"
              title="Unduh CSV sesuai filter"
            >
              <Icon name="download" />
            </a>
            <IconButton
              icon="filter"
              label={activeFilters ? `Filter · ${activeFilters}` : "Filter"}
              onClick={() => setFilterOpen(true)}
            />
          </span>
        }
      />
      <div className="month-nav">
        <IconButton
          icon="chev_l"
          label="Bulan sebelumnya"
          onClick={() => void navigate({ search: (s) => ({ ...s, bulan: addMonths(month, -1) }) })}
        />
        <span className="month-label">{formatMonth(month)}</span>
        <IconButton
          icon="chev_r"
          label="Bulan berikutnya"
          onClick={() => void navigate({ search: (s) => ({ ...s, bulan: addMonths(month, 1) }) })}
        />
      </div>
      <section className="card summary-strip" aria-label="Ringkasan bulan">
        <div>
          <p className="row-sub">Masuk</p>
          <Money value={summary.data ? BigInt(summary.data.income) : null} sign="income" tone="inc" />
        </div>
        <div>
          <p className="row-sub">Keluar</p>
          <Money value={summary.data ? BigInt(summary.data.expense) : null} sign="expense" tone="exp" />
        </div>
      </section>
      <div className="chip-scroll">
        <ChipGroup
          label="Jenis transaksi"
          options={TYPE_CHIPS}
          value={search.jenis}
          onChange={(jenis) => void navigate({ search: (s) => ({ ...s, jenis }) })}
        />
      </div>

      {list.isPending ? <Skeleton rows={6} /> : null}
      {list.isError && items.length === 0 ? (
        <ErrorState message="Transaksi gagal dimuat." onRetry={() => void list.refetch()} retrying={list.isFetching} />
      ) : null}
      {list.isSuccess && items.length === 0 ? (
        filtered ? (
          <NoMatchState title="Tidak ada transaksi yang cocok" onReset={reset} />
        ) : (
          <EmptyState
            icon="list"
            title="Belum ada transaksi bulan ini"
            body="Tekan + di bawah untuk mencatat transaksi pertamamu."
          />
        )
      ) : null}
      {items.length > 0 ? (
        <TransactionList
          items={items}
          today={today}
          hasMore={Boolean(list.hasNextPage)}
          loadingMore={list.isFetchingNextPage}
          loadMoreFailed={list.isFetchNextPageError}
          onLoadMore={() => void list.fetchNextPage()}
          onOpen={(tx) => void navigate({ to: "/transaksi/$id", params: { id: tx.id } })}
        />
      ) : null}

      <Sheet
        open={filterOpen}
        title="Filter"
        onClose={() => setFilterOpen(false)}
        footer={
          <>
            <Button full onClick={() => setFilterOpen(false)}>
              Tampilkan hasil
            </Button>
            {filtered ? (
              <Button variant="ghost" full onClick={reset}>
                Atur ulang
              </Button>
            ) : null}
          </>
        }
      >
        <TextField
          label="Cari catatan"
          type="search"
          value={draft}
          maxLength={100}
          onChange={(e) => {
            setDraft(e.target.value)
            pushSearch(e.target.value.trim())
          }}
        />
        <ChipGroup
          label="Rekening"
          options={[
            { value: "", label: "Semua rekening" },
            ...(wallets.data?.wallets ?? []).map((w) => ({ value: w.id, label: w.name })),
          ]}
          value={search.rekening ?? ""}
          onChange={(rekening) => void navigate({ search: (s) => ({ ...s, rekening: rekening || undefined }) })}
        />
      </Sheet>
    </>
  )
}
