import type { PillTone } from "@vynance/shared"
import type { ReactNode } from "react"

type PillProps = { tone: PillTone; children: ReactNode }

/** Pill status 22 px, 11/700, latar tint (DS-STATE-02). Label dan tone diambil dari peta status di shared. */
export function Pill({ tone, children }: PillProps) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}
