import type { usePullToRefresh } from "@/lib/hooks/usePullToRefresh"
import { useT } from "@/lib/hooks/useT"
import { Icon } from "./Icon"

type PullIndicatorProps = { state: ReturnType<typeof usePullToRefresh> }

/** Indikator tarik untuk muat ulang: teks + ikon, diumumkan ke pembaca layar saat memuat. */
export function PullIndicator({ state }: PullIndicatorProps) {
  const t = useT()
  if (state.phase === "idle") return null
  const label =
    state.phase === "refreshing"
      ? t("refresh.loading")
      : state.phase === "ready"
        ? t("refresh.release")
        : t("refresh.pull")
  return (
    <div className="pull-indicator" style={{ height: state.distance }} aria-live="polite">
      <span className={`pull-icon${state.phase === "refreshing" ? " pull-spin" : ""}`} aria-hidden="true">
        <Icon name={state.phase === "pulling" ? "chev_d" : "repeat"} size={18} />
      </span>
      <span>{label}</span>
    </div>
  )
}
