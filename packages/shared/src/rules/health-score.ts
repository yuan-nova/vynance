import type { PillTone } from "../types"

// Skor kesehatan keuangan 0–100 dari 4 pilar × 25 poin (BRD §8.2, FR-51).
// Perbaikan Vynance (temuan BRD §9 no. 7): pilar tanpa data = "belum dinilai" dan skor dihitung
// ulang secara proporsional, bukan otomatis 25 poin. Semua bigint rupiah utuh; tidak ada float uang.

export const PILLAR_KEYS = ["savings", "budget", "debt", "investment"] as const
export type PillarKey = (typeof PILLAR_KEYS)[number]

export type PillarStatus = "scored" | "not_assessed"

export type HealthPillar = {
  key: PillarKey
  /** 0–25 untuk pilar yang dinilai. */
  points: number
  status: PillarStatus
  /** Nilai mentah pilar: rasio tabungan, rasio porsi investasi, atau pemakaian limit (basis poin). */
  valueBp: number | null
}

export type HealthScoreLevel = "excellent" | "good" | "fair" | "poor"

export type HealthScore = {
  /** 0–100 setelah skala proporsional. */
  score: number
  level: HealthScoreLevel
  pillars: HealthPillar[]
  /** Pilar yang punya data dan ikut dihitung. */
  assessedCount: number
  assessedPoints: number
  /** Jumlah poin pilar yang belum dinilai (0 < nilai ≤ 100). 0 = skor bisa dibandingkan langsung. */
  unassessedPoints: number
}

export const HEALTH_FULL_POINTS = 25
/** Rasio tabungan dan porsi investasi memberi 25 poin di 20% (BRD §8.2). */
export const HEALTH_TARGET_BP = 2_000
/** Pemakaian limit ≤ 30% = 25 poin, ≥ 90% = 0 poin, linear di antaranya. */
export const DEBT_FULL_BP = 3_000
export const DEBT_ZERO_BP = 9_000

export type HealthInput = {
  /** Uang masuk bulan yang dipilih. */
  income: bigint
  /** Uang keluar bulan yang dipilih. */
  expense: bigint
  /** Jumlah kategori beranggaran bulan ini; `null` bila belum ada anggaran. */
  budgetedCategories: number | null
  /** Jumlah kategori beranggaran yang realisasinya ≤ alokasi. */
  withinBudgetCategories: number
  /** Pemakaian limit semua kartu kredit dan PayLater (basis poin). `null` bila tidak ada rekening utang. */
  debtUsageBp: number | null
  /** Kas likuid + nilai kini investasi. */
  cash: bigint
  investments: bigint
}

function toBp(numerator: bigint, denominator: bigint): number {
  if (denominator <= 0n) return 0
  return Number((numerator * 10_000n) / denominator)
}

function clampPoints(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(HEALTH_FULL_POINTS, value)
}

function scored(key: PillarKey, points: number, valueBp: number | null): HealthPillar {
  return { key, points: clampPoints(points), status: "scored", valueBp }
}

function notAssessed(key: PillarKey): HealthPillar {
  return { key, points: 0, status: "not_assessed", valueBp: null }
}

/**
 * Pilar 1: tingkat tabungan = (masuk − keluar) ÷ masuk; poin = min(25, rate ÷ 20% × 25).
 * Bulan tanpa uang masuk tidak bisa dinilai.
 */
export function savingsPillar(income: bigint, expense: bigint): HealthPillar {
  if (income <= 0n) return notAssessed("savings")
  const bp = toBp(income - expense, income)
  return scored("savings", (bp / HEALTH_TARGET_BP) * HEALTH_FULL_POINTS, bp)
}

/** Pilar 2: kategori dalam anggaran ÷ kategori beranggaran × 25. Belum ada anggaran = belum dinilai. */
export function budgetPillar(budgetedCategories: number | null, withinBudgetCategories: number): HealthPillar {
  if (!budgetedCategories || budgetedCategories <= 0) return notAssessed("budget")
  const within = Math.min(Math.max(withinBudgetCategories, 0), budgetedCategories)
  return scored(
    "budget",
    (within / budgetedCategories) * HEALTH_FULL_POINTS,
    toBp(BigInt(within), BigInt(budgetedCategories)),
  )
}

/**
 * Pilar 3: pemakaian limit ≤ 30% → 25 poin; ≥ 90% → 0; linear di antaranya.
 * Tanpa kartu kredit / PayLater tidak ada skor utang palsu (belum dinilai).
 */
export function debtPillar(debtUsageBp: number | null): HealthPillar {
  if (debtUsageBp === null) return notAssessed("debt")
  const bp = Math.max(0, debtUsageBp)
  const span = DEBT_ZERO_BP - DEBT_FULL_BP
  const points = ((DEBT_ZERO_BP - Math.min(bp, DEBT_ZERO_BP)) / span) * HEALTH_FULL_POINTS
  return scored("debt", points, bp)
}

/** Pilar 4: porsi investasi = investasi ÷ (kas + investasi); poin = min(25, ratio ÷ 20% × 25). */
export function investmentPillar(cash: bigint, investments: bigint): HealthPillar {
  const total = cash + investments
  if (total <= 0n) return notAssessed("investment")
  const bp = toBp(investments, total)
  return scored("investment", (bp / HEALTH_TARGET_BP) * HEALTH_FULL_POINTS, bp)
}

/** Label BRD §8.2: ≥80 Sangat Baik, ≥60 Baik, ≥40 Cukup, <40 Perlu Perhatian. */
export function healthLevel(score: number): HealthScoreLevel {
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  if (score >= 40) return "fair"
  return "poor"
}

export const HEALTH_LEVEL_LABEL: Record<HealthScoreLevel, string> = {
  excellent: "Sangat Baik",
  good: "Baik",
  fair: "Cukup",
  poor: "Perlu Perhatian",
}

export const HEALTH_LEVEL_TONE: Record<HealthScoreLevel, PillTone> = {
  excellent: "inc",
  good: "inc",
  fair: "warn",
  poor: "exp",
}

export const PILLAR_LABEL: Record<PillarKey, string> = {
  savings: "Tabungan",
  budget: "Anggaran",
  debt: "Utang",
  investment: "Investasi",
}

/** "belum dinilai" untuk pilar tanpa data (DS-STATE-02). */
export const PILLAR_NOT_ASSESSED_LABEL = "Belum dinilai"

/**
 * Skor total. Pilar dinilai dijumlahkan lalu diskalakan ke 100 sesuai bobot yang tersedia:
 * misalnya hanya 2 dari 4 pilar yang punya data → skor = poin ÷ 50 × 100.
 * Tanpa satu pilar pun, skor 0 dengan level "poor" dan semua pilar "belum dinilai".
 */
export function healthScore(input: HealthInput): HealthScore {
  const pillars = [
    savingsPillar(input.income, input.expense),
    budgetPillar(input.budgetedCategories, input.withinBudgetCategories),
    debtPillar(input.debtUsageBp),
    investmentPillar(input.cash, input.investments),
  ]
  const assessed = pillars.filter((p) => p.status === "scored")
  const assessedPoints = assessed.reduce((sum, p) => sum + p.points, 0)
  const assessedMaxPoints = assessed.length * HEALTH_FULL_POINTS
  const unassessedPoints = (pillars.length - assessed.length) * HEALTH_FULL_POINTS
  const score = assessedMaxPoints === 0 ? 0 : Math.round((assessedPoints / assessedMaxPoints) * 100)
  return {
    score: Math.min(100, Math.max(0, score)),
    level: healthLevel(score),
    pillars,
    assessedCount: assessed.length,
    assessedPoints: Math.round(assessedPoints * 100) / 100,
    unassessedPoints,
  }
}

/** Teks ringkas alasan skor diturunkan skalanya, untuk pembaca layar dan layar rincian. */
export function healthAssessedNote(result: HealthScore): string {
  if (result.assessedCount === PILLAR_KEYS.length) return "Keempat pilar dinilai."
  if (result.assessedCount === 0) return "Belum ada data untuk menilai kesehatan keuangan."
  const missing = PILLAR_KEYS.length - result.assessedCount
  return `Skor dihitung proporsional dari ${result.assessedCount} pilar yang dinilai; ${missing} pilar belum dinilai.`
}
