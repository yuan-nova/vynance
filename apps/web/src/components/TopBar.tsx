import type { ReactNode } from "react"
import { IconButton } from "./Button"

type TopBarProps =
  | { level: 1; title: string; actions?: ReactNode; leading?: ReactNode }
  | { level: 2; title: string; backLabel: string; onBack: () => void; action?: ReactNode }

/** Bilah atas DS-NAV-02. Tingkat 1: judul 22/800 + ≤ 2 aksi ikon. Tingkat 2+: kembali 44 px + judul 17/800. */
export function TopBar(props: TopBarProps) {
  if (props.level === 1) {
    return (
      <header className="topbar">
        <div className="topbar-lead">
          {props.leading}
          <h1 className="h1-tab">{props.title}</h1>
        </div>
        {props.actions ? <div className="topbar-actions">{props.actions}</div> : null}
      </header>
    )
  }
  return (
    <header className="topbar topbar-2">
      <IconButton icon="chev_l" label={props.backLabel} onClick={props.onBack} />
      <h1 className="h1-detail truncate">{props.title}</h1>
      <div className="topbar-actions">{props.action}</div>
    </header>
  )
}
