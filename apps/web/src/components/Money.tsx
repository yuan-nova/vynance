import { formatMoney, formatMoneyShort, MONEY_PRIVACY_MASK, type MoneySign } from "@vynance/shared"
import { usePrivacyMode } from "@/lib/hooks/usePrivacyMode"

type MoneyProps = {
  value: bigint | null
  sign?: MoneySign
  short?: boolean
  tone?: "inc" | "exp" | "trf" | "inv" | "ink"
  className?: string
}

/** Nominal sesuai DS-MONEY-01: tabular, tanda U+2212, singkat dengan nilai penuh di aria-label, mode privasi. */
export function Money({ value, sign = "auto", short = false, tone = "ink", className }: MoneyProps) {
  const privacy = usePrivacyMode()
  const cls = `money money-${tone}${className ? ` ${className}` : ""}`
  if (value === null) return <span className={cls}>—</span>
  if (privacy) {
    return (
      <span className={cls}>
        <span aria-hidden="true">{MONEY_PRIVACY_MASK}</span>
        <span className="sr-only">Nominal disembunyikan</span>
      </span>
    )
  }
  const full = formatMoney(value, sign)
  if (!short) return <span className={cls}>{full}</span>
  const shortText = formatMoneyShort(value)
  return (
    <span className={cls} title={full}>
      <span aria-hidden="true">
        {sign === "income" ? "+" : ""}
        {sign === "expense" && value > 0n ? "−" : ""}
        {shortText}
      </span>
      <span className="sr-only">{full}</span>
    </span>
  )
}
