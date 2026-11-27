import { addMonths, type DateOnly, type Month, monthOfDate } from "../date"

// Target tabungan (PB-07, BR-20, BR-21). Rupiah utuh bigint.

export type GoalStatus = "achieved" | "overdue" | "onTrack" | "attention"

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  achieved: "Tercapai",
  overdue: "Lewat tenggat",
  onTrack: "Sesuai jalur",
  attention: "Perlu perhatian",
}

/** Jumlah bulan dari `from` ke `to` (YYYY-MM). Negatif bila `to` sebelum `from`. */
export function monthsBetween(from: Month, to: Month): number {
  const [fy = 0, fm = 0] = from.split("-").map(Number)
  const [ty = 0, tm = 0] = to.split("-").map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

/** Dibulatkan ke ratusan rupiah terdekat (tampilan setoran/bulan, design/09). */
function roundHundreds(v: bigint): bigint {
  return ((v + 50n) / 100n) * 100n
}

export type GoalInput = {
  targetAmount: bigint
  /** initial_amount + Σ setoran (TSD §6.4). */
  collected: bigint
  targetDate: DateOnly | null
  /** Tanggal target dibuat; menentukan berapa bulan riwayat setoran yang tersedia. */
  createdOn: DateOnly
  /** Σ setoran per bulan (cukup 3 bulan terakhir termasuk bulan ini). */
  recentContributions: readonly { month: Month; amount: bigint }[]
  today: DateOnly
}

export type GoalProgress = {
  /** Basis poin, dibatasi 10.000. */
  percentBp: number
  remaining: bigint
  /** null bila tanpa tanggal target. */
  monthsLeft: number | null
  /** BR-20: sisa ÷ sisa bulan. null bila tanpa tanggal, sudah tercapai, atau tenggat lewat. */
  monthlyNeeded: bigint | null
  /** Rata-rata setoran per bulan selama ≤ 3 bulan terakhir. */
  pace: bigint
  status: GoalStatus
}

/** BR-20 dan BR-21. */
export function goalProgress(g: GoalInput): GoalProgress {
  const remaining = g.collected >= g.targetAmount ? 0n : g.targetAmount - g.collected
  const percentBp = g.targetAmount <= 0n ? 10_000 : Math.min(10_000, Number((g.collected * 10_000n) / g.targetAmount))
  const thisMonth = monthOfDate(g.today)
  const monthsLeft = g.targetDate ? monthsBetween(thisMonth, monthOfDate(g.targetDate)) : null

  // Laju: rata-rata setoran bulan yang sudah berjalan sejak target dibuat, maksimal 3 bulan.
  const observed = Math.max(1, Math.min(3, monthsBetween(monthOfDate(g.createdOn), thisMonth) + 1))
  const window = new Set(Array.from({ length: observed }, (_, i) => addMonths(thisMonth, -i)))
  const sum = g.recentContributions.filter((c) => window.has(c.month)).reduce((s, c) => s + c.amount, 0n)
  const pace = sum / BigInt(observed)
  const out = { percentBp, remaining, monthsLeft, pace }

  if (remaining === 0n) return { ...out, monthlyNeeded: null, status: "achieved" }
  if (g.targetDate && g.targetDate < g.today) return { ...out, monthlyNeeded: null, status: "overdue" }
  if (monthsLeft === null) return { ...out, monthlyNeeded: null, status: "onTrack" }
  // Bulan target sendiri masih bisa disetor, jadi minimal 1 bulan.
  const monthlyNeeded = roundHundreds(remaining / BigInt(Math.max(1, monthsLeft)))
  // BR-21: "Perlu perhatian" hanya bila laju < kebutuhan. Target baru bulan ini belum punya riwayat.
  const isNew = monthOfDate(g.createdOn) === thisMonth
  return { ...out, monthlyNeeded, status: !isNew && pace < monthlyNeeded ? "attention" : "onTrack" }
}
