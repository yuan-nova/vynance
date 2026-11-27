import type { ChildPlan, EducationStage, PillTone } from "@vynance/shared"
import { Icon } from "@/components/Icon"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"

const STATUS_LABEL: Record<EducationStage["status"], string> = {
  upcoming: "Akan datang",
  ongoing: "Sedang berjalan",
  done: "Selesai",
}
const STATUS_TONE: Record<EducationStage["status"], PillTone> = {
  upcoming: "pri",
  ongoing: "warn",
  done: "neutral",
}

type ChildCardProps = { child: ChildPlan; year: number; onOpen: () => void }

/** Kartu anak (design/16): setoran total per bulan dan rincian per jenjang (PB-09 langkah 2–5). */
export function ChildCard({ child: c, year, onOpen }: ChildCardProps) {
  return (
    <article className="card edu-card">
      <button type="button" className="goal-head" onClick={onOpen} aria-label={`Ubah data ${c.name}`}>
        <span className="tile tile-pri" aria-hidden="true">
          <Icon name="school" />
        </span>
        <span className="goal-title">
          <span className="row-title truncate">{c.name}</span>
          <span className="row-sub">
            Umur {year - c.birthYear} · tabungan <Money value={BigInt(c.savings)} short />
          </span>
        </span>
        <span className="edu-monthly">
          <Money value={BigInt(c.monthly)} />
          <span className="row-sub">/bln</span>
        </span>
      </button>
      <ul className="edu-stages">
        {c.stages.map((s) => (
          <li key={s.key} className={`edu-stage edu-${s.status}`}>
            <span className="edu-stage-head">
              <span className="row-title">{s.label}</span>
              <span className="row-sub">{s.startYear}</span>
              <Pill tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Pill>
            </span>
            {s.status === "upcoming" ? (
              <span className="row-sub edu-stage-body">
                Biaya <Money value={BigInt(s.futureCost)} short />
                {BigInt(s.allocated) > 0n ? (
                  <>
                    {" "}
                    · tertutup tabungan <Money value={BigInt(s.allocated)} short />
                  </>
                ) : null}
                {s.monthly !== null && BigInt(s.monthly) > 0n ? (
                  <>
                    {" "}
                    · setor <Money value={BigInt(s.monthly)} />
                    /bln ({s.monthsLeft} bln)
                  </>
                ) : (
                  " · sudah tercukupi"
                )}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  )
}
