import {
  BUDGET_STATUS_LABEL,
  BUDGET_STATUS_TONE,
  budgetStatus,
  budgetTone,
  type Dashboard,
  usageBp,
} from "@vynance/shared"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"
import { ProgressBar } from "@/components/ProgressBar"

type TopBudgetsProps = { items: Dashboard["topBudgets"] }

/** Anggaran teratas Beranda (design/03): nama, status teks, bar, terpakai/alokasi. */
export function TopBudgets({ items }: TopBudgetsProps) {
  return (
    <div className="card">
      {items.map((b) => {
        const allocated = BigInt(b.allocated)
        const spent = BigInt(b.spent)
        const status = budgetStatus(allocated, spent)
        return (
          <div key={b.categoryId} className="alloc-row">
            <div className="alloc-head">
              <p className="row-title truncate">{b.name}</p>
              <Pill tone={BUDGET_STATUS_TONE[status]}>{BUDGET_STATUS_LABEL[status]}</Pill>
            </div>
            <ProgressBar
              valueBp={usageBp(allocated, spent)}
              tone={budgetTone(allocated, spent)}
              label={`Realisasi ${b.name}`}
            />
            <p className="row-sub">
              <Money value={spent} /> / <Money value={allocated} />
            </p>
          </div>
        )
      })}
    </div>
  )
}
