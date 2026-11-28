import { getRouteApi, useNavigate } from "@tanstack/react-router"
import {
  addMonths,
  dateOnlyOf,
  formatMonth,
  groupTransactionsByCategory,
  monthDateRange,
  monthOf,
  type PlannedItem,
  planBudgets,
  type TxType,
} from "@vynance/shared"
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
import { useCategories } from "@/features/categories"
import { PlannedSection, RealizeForm, usePlanned, useRealizePlanned } from "@/features/planned"
import { usePlan } from "@/features/plans"
import {
  CategoryGroups,
  TransactionList,
  transactionsCsvUrl,
  useTransactionList,
  useTransactionSummary,
} from "@/features/transactions"
import { useWallets } from "@/features/wallets"
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback"
import { useLoadAllPages } from "@/lib/hooks/useLoadAllPages"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/_tabs/transaksi")

const TYPE_CHIPS = [
  { value: "semua", label: "Semua" },
  { value: "keluar", label: "Keluar" },
  { value: "masuk", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
] as const
const MODE_CHIPS = [
  { value: "riwayat", label: "Riwayat" },
  { value: "kategori", label: "Per kategori" },
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
  const currentMonth = monthOf(new Date())
  const planned = usePlanned(bookId, month)
  // Rencana bulan lalu yang belum direalisasi tampil sebagai Terlewat di bulan berjalan (PB-13 langkah 6).
  const prevPlanned = usePlanned(bookId, addMonths(month, -1))
  const plannedItems = [
    ...(month === currentMonth ? (prevPlanned.data?.items ?? []).filter((i) => i.status === "pending") : []),
    ...(planned.data?.items ?? []),
  ]
  const plan = usePlan(bookId, month)
  const expenseCats = useCategories(bookId, "expense")
  const incomeCats = useCategories(bookId, "income")
  const realize = useRealizePlanned(bookId)
  const [realizing, setRealizing] = useState<PlannedItem | null>(null)
  const byCategory = search.mode === "kategori"
  // Teks ketikan lokal; URL diperbarui 300 ms setelah berhenti mengetik (DS-DATA-02).
  const [draft, setDraft] = useState(search.cari ?? "")
  const pushSearch = useDebouncedCallback((cari: string) =>
    navigate({ search: (s) => ({ ...s, cari: cari || undefined }), replace: true }),
  )

  const items = list.data?.pages.flatMap((p) => p.data) ?? []
  // Per kategori butuh seluruh transaksi bulan itu supaya total realisasi benar.
  useLoadAllPages(list, byCategory)
  const allCats = [...(expenseCats.data ?? []), ...(incomeCats.data ?? [])]
  const subscriptionCat = expenseCats.data?.find((c) => c.name.toLowerCase() === "langganan")?.id ?? null
  // Langganan tanpa kategori tercatat ke kategori Langganan bawaan (PB-05).
  const plannedForGroups = plannedItems
    .filter((i) => i.period === month)
    .map((i) => ({ ...i, categoryId: i.categoryId ?? (i.sourceType === "subscription" ? subscriptionCat : null) }))
  const groups = byCategory
    ? groupTransactionsByCategory(items, {
        budgets: plan.data ? planBudgets(plan.data) : new Map<string, bigint>(),
        planned: plannedForGroups,
      })
    : []
  const filtered = search.jenis !== "semua" || Boolean(search.rekening) || Boolean(search.cari)
  const activeFilters = (search.rekening ? 1 : 0) + (search.cari ? 1 : 0)
  const reset = () => {
    setDraft("")
    void navigate({ search: { bulan: search.bulan, jenis: "semua", mode: search.mode } })
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
          label="Tampilan"
          options={MODE_CHIPS}
          value={search.mode}
          onChange={(mode) => void navigate({ search: (s) => ({ ...s, mode }) })}
        />
      </div>
      {!byCategory ? <PlannedSection items={plannedItems} currentMonth={currentMonth} onOpen={setRealizing} /> : null}
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
      {list.isSuccess && items.length === 0 && !(byCategory && groups.length > 0) ? (
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
      {byCategory && list.isSuccess && groups.length > 0 ? (
        <CategoryGroups
          groups={groups}
          categoryName={(id) => allCats.find((c) => c.id === id)?.name ?? "(dihapus)"}
          onOpen={(tx) => void navigate({ to: "/transaksi/$id", params: { id: tx.id } })}
        />
      ) : null}
      {!byCategory && items.length > 0 ? (
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
        open={realizing !== null}
        title={realizing ? `Realisasi ${realizing.name}` : ""}
        onClose={() => {
          setRealizing(null)
          realize.reset()
        }}
      >
        {realizing && wallets.data && expenseCats.data && incomeCats.data ? (
          <RealizeForm
            key={`${realizing.period}:${realizing.sourceId}`}
            item={realizing}
            wallets={wallets.data.wallets.filter((w) => !w.archivedAt)}
            categories={(realizing.sourceType === "income" ? incomeCats.data : expenseCats.data).filter(
              (c) => !c.archivedAt,
            )}
            defaultCategoryId={realizing.sourceType === "subscription" ? subscriptionCat : null}
            defaultWalletId={plan.data?.defaultWalletId ?? null}
            today={today}
            pending={realize.isPending}
            error={realize.error?.message}
            onSubmit={(input) =>
              realize.mutate(input, {
                onSuccess: () => {
                  showSnackbar(
                    input.amount === 0n ? `${realizing.name} dilewati bulan ini` : `${realizing.name} direalisasi`,
                  )
                  setRealizing(null)
                },
              })
            }
          />
        ) : null}
      </Sheet>

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
