import { formatDateLong, formatDateWeekdayShort, groupByDate, type TransactionListItem } from "@vynance/shared"
import { useRef } from "react"
import { Money } from "@/components/Money"
import { useInView } from "@/lib/hooks/useInView"
import { TransactionRow } from "./TransactionRow"

type TransactionListProps = {
  items: TransactionListItem[]
  today: string
  hasMore: boolean
  loadingMore: boolean
  loadMoreFailed?: boolean
  onLoadMore: () => void
  onOpen?: (tx: TransactionListItem) => void
}

/** Daftar per tanggal dengan total harian (DS-DATA-01) + scroll tak berujung. */
export function TransactionList({
  items,
  today,
  hasMore,
  loadingMore,
  loadMoreFailed = false,
  onLoadMore,
  onOpen,
}: TransactionListProps) {
  const sentinel = useRef<HTMLDivElement>(null)
  useInView(sentinel, onLoadMore, hasMore && !loadingMore && !loadMoreFailed)
  const groups = groupByDate(items)
  return (
    <div>
      {groups.map((g) => (
        <section key={g.date} className="tx-group" aria-label={formatDateLong(g.date)}>
          <h3 className="group-head">
            <span>
              {g.date === today ? `Hari ini · ${formatDateWeekdayShort(g.date)}` : formatDateWeekdayShort(g.date)}
            </span>
            <Money value={g.total} sign={g.total > 0n ? "income" : g.total < 0n ? "expense" : "none"} />
          </h3>
          <div className="card plain-list">
            {g.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onOpen={onOpen ? () => onOpen(tx) : undefined} />
            ))}
          </div>
        </section>
      ))}
      <div ref={sentinel} className="list-end" aria-live="polite">
        {loadMoreFailed ? (
          <button type="button" className="link-row" onClick={onLoadMore}>
            Gagal memuat. Coba lagi
          </button>
        ) : loadingMore ? (
          "Memuat lagi…"
        ) : hasMore ? (
          ""
        ) : items.length > 0 ? (
          "Semua transaksi sudah tampil"
        ) : (
          ""
        )}
      </div>
    </div>
  )
}
