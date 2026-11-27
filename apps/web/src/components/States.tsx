import type { IconName } from "@vynance/shared"
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus"
import { Button } from "./Button"
import { Icon } from "./Icon"

// Lima state layar data (DS-STATE-01).

type SkeletonProps = { rows?: number; height?: number }

export function Skeleton({ rows = 3, height = 64 }: SkeletonProps) {
  return (
    <div className="skeleton-list" role="status" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: baris kerangka statis tanpa identitas
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  )
}

type EmptyStateProps = { icon: IconName; title: string; body?: string; actionLabel?: string; onAction?: () => void }

export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="state">
      <span className="state-icon">
        <Icon name={icon} size={28} />
      </span>
      <p className="state-title">{title}</p>
      {body ? <p className="state-body">{body}</p> : null}
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  )
}

type NoMatchStateProps = { title: string; onReset: () => void }

export function NoMatchState({ title, onReset }: NoMatchStateProps) {
  return (
    <div className="state">
      <span className="state-icon">
        <Icon name="filter" size={28} />
      </span>
      <p className="state-title">{title}</p>
      <Button variant="ghost" onClick={onReset}>
        Atur ulang filter
      </Button>
    </div>
  )
}

type ErrorStateProps = { message: string; onRetry: () => void; retrying?: boolean }

export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <div className="state" role="alert">
      <span className="state-icon state-icon-exp">
        <Icon name="alert" size={28} />
      </span>
      <p className="state-title">{message}</p>
      <Button variant="soft" onClick={onRetry} loading={retrying}>
        Coba lagi
      </Button>
    </div>
  )
}

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="offline-banner" role="status">
      <Icon name="wifi" size={16} />
      Offline — perubahan akan disinkronkan
    </div>
  )
}
