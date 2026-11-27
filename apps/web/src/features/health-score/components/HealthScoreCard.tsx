import {
  HEALTH_FULL_POINTS,
  HEALTH_LEVEL_TONE,
  type HealthPillar,
  type HealthScoreLevel,
  type HealthScoreResponse,
} from "@vynance/shared"
import { Icon } from "@/components/Icon"
import { ProgressBar } from "@/components/ProgressBar"

/** Pilar tanpa data diberi bar kosong, bukan tone hijau yang menyiratkan aman (temuan BRD §9 no. 7). */
function pillarTone(p: HealthPillar): "inc" | "warn" | "exp" {
  if (p.status === "not_assessed") return "warn"
  const ratio = p.points / HEALTH_FULL_POINTS
  if (ratio >= 0.8) return "inc"
  if (ratio >= 0.4) return "warn"
  return "exp"
}

type ScoreRingProps = { score: number; level: HealthScoreLevel }

/** PillTone "inc" | "warn" | "exp" untuk busur dan label; "pri" tidak dipakai untuk skor. */
function toneForLevel(level: HealthScoreLevel): "inc" | "warn" | "exp" {
  const tone = HEALTH_LEVEL_TONE[level]
  return tone === "inc" || tone === "warn" || tone === "exp" ? tone : "warn"
}

/** Donat skor 84 px (DS-DATA-03): busur mengikuti skor, angka dibaca pembaca layar lewat label tombol. */
function ScoreRing({ score, level }: ScoreRingProps) {
  const r = 36
  const c = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c
  return (
    <span className="score-ring" aria-hidden="true">
      <svg viewBox="0 0 84 84" width="84" height="84">
        <title>Busur skor kesehatan</title>
        <circle cx="42" cy="42" r={r} className="score-ring-track" strokeWidth="9" fill="none" />
        <circle
          cx="42"
          cy="42"
          r={r}
          className={`score-ring-fill ring-${toneForLevel(level)}`}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${filled} ${c - filled}`}
          transform="rotate(-90 42 42)"
        />
      </svg>
      <span className="score-ring-num">{score}</span>
    </span>
  )
}

type HealthScoreCardProps = { score: HealthScoreResponse; onOpen: () => void }

/**
 * Kartu skor kesehatan Beranda (design/03-dashboard.svg, FR-51):
 * donat skor, label tingkat, empat batang pilar, ketuk membuka rincian.
 */
export function HealthScoreCard({ score, onOpen }: HealthScoreCardProps) {
  return (
    <button
      type="button"
      className="card score-card"
      onClick={onOpen}
      aria-label={`Skor kesehatan ${score.score} dari 100, ${score.levelLabel}. Lihat rincian pilar.`}
    >
      <ScoreRing score={score.score} level={score.level} />
      <span className="score-main">
        <span className="row-sub">Skor kesehatan</span>
        <span className={`score-level level-${toneForLevel(score.level)}`}>{score.levelLabel}</span>
        <span className="score-pillars">
          {score.pillars.map((p) => (
            <span key={p.key} className="score-pillar">
              <span className="row-sub">
                {p.label}
                {p.status === "not_assessed" ? <span className="score-na"> · belum dinilai</span> : null}
              </span>
              <ProgressBar
                valueBp={p.status === "not_assessed" ? 0 : Math.round((p.points / HEALTH_FULL_POINTS) * 10_000)}
                tone={pillarTone(p)}
                label={
                  p.status === "not_assessed"
                    ? `${p.label}: belum dinilai`
                    : `${p.label}: ${Math.round(p.points)} dari ${HEALTH_FULL_POINTS} poin`
                }
              />
            </span>
          ))}
        </span>
      </span>
      <span className="score-chev" aria-hidden="true">
        <Icon name="chev_r" size={18} strokeWidth={2.4} />
      </span>
    </button>
  )
}
