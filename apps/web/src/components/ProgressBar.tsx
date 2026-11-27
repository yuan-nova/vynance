type ProgressBarProps = { valueBp: number; tone: "inc" | "warn" | "exp" | "pri"; label: string }

/** Bar 8 px (DS-DATA-03). Nilai dalam basis poin; teks pendamping wajib ada di luar bar. */
export function ProgressBar({ valueBp, tone, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, valueBp / 100))
  return (
    <div
      className="bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <span className={`bar-fill bar-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
