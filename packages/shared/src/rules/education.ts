import { monthsBetween } from "./goal"

// Dana pendidikan anak (PB-09, FR-120, BR-43).

export type EducationStageKey = "tk" | "sd" | "smp" | "sma" | "kuliah"
export type EducationStageStatus = "upcoming" | "ongoing" | "done"

/** Jenjang: umur mulai, lama (tahun), dan biaya dasar hari ini (PB-09 langkah 2). */
export const EDUCATION_STAGES: readonly {
  key: EducationStageKey
  label: string
  startAge: number
  years: number
  baseCost: bigint
}[] = [
  { key: "tk", label: "TK", startAge: 4, years: 2, baseCost: 5_000_000n },
  { key: "sd", label: "SD", startAge: 6, years: 6, baseCost: 15_000_000n },
  { key: "smp", label: "SMP", startAge: 12, years: 3, baseCost: 25_000_000n },
  { key: "sma", label: "SMA", startAge: 15, years: 3, baseCost: 35_000_000n },
  { key: "kuliah", label: "Kuliah", startAge: 18, years: 4, baseCost: 150_000_000n },
]

/** Bawaan inflasi pendidikan 12%/tahun (BR-43). */
export const DEFAULT_EDUCATION_INFLATION_BP = 1200

/** Tahun ajaran dimulai bulan Juli. */
const SCHOOL_START_MONTH = "07"

/** Biaya masa depan = biaya dasar × (1 + inflasi)^tahun, dibulatkan ke rupiah terdekat (PB-09 langkah 3). */
export function futureCost(base: bigint, inflationBp: number, years: number): bigint {
  if (years <= 0) return base
  const num = base * BigInt(10_000 + inflationBp) ** BigInt(years)
  const den = 10_000n ** BigInt(years)
  return (num + den / 2n) / den
}

export type EducationStagePlan = {
  key: EducationStageKey
  label: string
  startYear: number
  status: EducationStageStatus
  futureCost: bigint
  allocated: bigint
  shortfall: bigint
  monthsLeft: number | null
  monthly: bigint | null
}

/**
 * Rencana per jenjang untuk satu anak.
 * Tabungan dibagi berurutan ke jenjang yang akan datang, mulai dari yang terdekat (BRD §9 no. 9).
 * Setoran per bulan = (biaya masa depan − porsi tabungan) ÷ bulan tersisa, dibulatkan ke atas (PB-09 langkah 4).
 */
export function educationPlan(input: {
  birthYear: number
  savings: bigint
  inflationBp: number
  today: string
}): EducationStagePlan[] {
  const year = Number(input.today.slice(0, 4))
  const currentMonth = input.today.slice(0, 7)
  const age = year - input.birthYear
  let pool = input.savings
  return EDUCATION_STAGES.map((s) => {
    const startYear = input.birthYear + s.startAge
    const status: EducationStageStatus = age < s.startAge ? "upcoming" : age < s.startAge + s.years ? "ongoing" : "done"
    const cost = futureCost(s.baseCost, input.inflationBp, Math.max(0, s.startAge - age))
    if (status !== "upcoming") {
      return {
        ...pick(s),
        startYear,
        status,
        futureCost: cost,
        allocated: 0n,
        shortfall: 0n,
        monthsLeft: null,
        monthly: null,
      }
    }
    const allocated = pool < cost ? pool : cost
    pool -= allocated
    const shortfall = cost - allocated
    const monthsLeft = Math.max(1, monthsBetween(currentMonth, `${startYear}-${SCHOOL_START_MONTH}`))
    const months = BigInt(monthsLeft)
    const monthly = (shortfall + months - 1n) / months
    return { ...pick(s), startYear, status, futureCost: cost, allocated, shortfall, monthsLeft, monthly }
  })
}

function pick(s: (typeof EDUCATION_STAGES)[number]) {
  return { key: s.key, label: s.label }
}
