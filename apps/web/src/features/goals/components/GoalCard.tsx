import { formatDate, formatMonth, GOAL_STATUS_LABEL, type Goal, type IconName, type PillTone } from "@vynance/shared"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"
import { ProgressBar } from "@/components/ProgressBar"

const STATUS_TONE: Record<Goal["status"], PillTone> = {
  achieved: "inc",
  overdue: "exp",
  onTrack: "pri",
  attention: "warn",
}
const BAR_TONE: Record<Goal["status"], "inc" | "warn" | "exp" | "pri"> = {
  achieved: "inc",
  overdue: "exp",
  onTrack: "pri",
  attention: "warn",
}

type GoalCardProps = { goal: Goal; onOpen: () => void; onContribute: () => void }

function deadline(g: Goal): string {
  if (!g.targetDate) return "Tanpa tenggat"
  const when = formatMonth(g.targetDate.slice(0, 7))
  if (g.status === "overdue") return `${formatDate(g.targetDate)} · tenggat lewat`
  if (g.monthsLeft === null || g.monthsLeft <= 0) return `${when} · bulan ini`
  return `${when} · ${g.monthsLeft} bln lagi`
}

/** Kartu target (design/09): status teks + warna, progres, kebutuhan setoran/bulan (BR-20/BR-21). */
export function GoalCard({ goal: g, onOpen, onContribute }: GoalCardProps) {
  const pct = Math.floor(g.percentBp / 100)
  return (
    <article className="card goal-card">
      <button type="button" className="goal-head" onClick={onOpen} aria-label={`Ubah target ${g.name}`}>
        <span className="tile tile-pri" aria-hidden="true">
          <Icon name={g.icon as IconName} />
        </span>
        <span className="goal-title">
          <span className="row-title truncate">{g.name}</span>
          <span className="row-sub">{deadline(g)}</span>
        </span>
        <Pill tone={STATUS_TONE[g.status]}>{GOAL_STATUS_LABEL[g.status]}</Pill>
      </button>
      <p className="goal-amounts">
        <Money value={BigInt(g.collected)} className="goal-collected" />
        <span className="row-sub">
          {" "}
          / <Money value={BigInt(g.targetAmount)} />
        </span>
        <span className="goal-pct">{pct}%</span>
      </p>
      <ProgressBar valueBp={g.percentBp} tone={BAR_TONE[g.status]} label={`Progres ${g.name}`} />
      <div className="goal-foot">
        <p className="row-sub">
          {g.status === "achieved" ? (
            "Selamat, target tercapai!"
          ) : g.monthlyNeeded === null ? (
            <>
              Sisa <Money value={BigInt(g.remaining)} />
            </>
          ) : g.status === "attention" ? (
            <>
              Butuh <Money value={BigInt(g.monthlyNeeded)} />
              /bln · laju <Money value={BigInt(g.pace)} short />
            </>
          ) : (
            <>
              Setor <Money value={BigInt(g.monthlyNeeded)} />
              /bln
            </>
          )}
        </p>
        {g.status === "achieved" ? null : (
          <Button variant="soft" icon="plus" onClick={onContribute}>
            Setor
          </Button>
        )}
      </div>
    </article>
  )
}
