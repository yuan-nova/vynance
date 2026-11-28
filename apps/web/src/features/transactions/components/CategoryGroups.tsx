import type { CategoryGroup, TransactionListItem } from "@vynance/shared"
import { Money } from "@/components/Money"
import { TransactionRow } from "./TransactionRow"

type CategoryGroupsProps = {
  groups: CategoryGroup<TransactionListItem>[]
  categoryName: (id: string) => string
  onOpen: (tx: TransactionListItem) => void
}

/** Mode Per kategori (PB-14): pagu, realisasi, rencana belum direalisasi, lalu transaksinya. */
export function CategoryGroups({ groups, categoryName, onOpen }: CategoryGroupsProps) {
  return (
    <div>
      {groups.map((g) => {
        const name = g.categoryId ? categoryName(g.categoryId) : "Transfer & aset"
        return (
          <section key={g.categoryId ?? "_"} className="tx-group" aria-label={name}>
            <h3 className="group-head">
              <span>{name}</span>
              <Money
                value={g.realized}
                sign={g.kind === "income" ? "income" : g.kind === "expense" ? "expense" : "none"}
              />
            </h3>
            {g.kind !== "other" ? (
              <p className="row-sub cat-group-meta">
                {g.budget !== null ? (
                  <span>
                    Pagu <Money value={g.budget} short />
                  </span>
                ) : null}
                <span>
                  Realisasi <Money value={g.realized} short />
                </span>
                {g.planned > 0n ? (
                  <span>
                    Rencana <Money value={g.planned} short />
                  </span>
                ) : null}
              </p>
            ) : null}
            {g.transactions.length > 0 ? (
              <div className="card plain-list">
                {g.transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} onOpen={() => onOpen(tx)} />
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
