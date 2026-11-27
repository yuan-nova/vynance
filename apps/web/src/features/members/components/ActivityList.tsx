import { type Activity, activityText, formatRelative } from "@vynance/shared"
import { usePrivacyMode } from "@/lib/hooks/usePrivacyMode"

type ActivityListProps = { items: Activity[] }

/** Aktivitas terbaru buku (design/17). Nominal ikut disamarkan saat mode privasi (BR-44). */
export function ActivityList({ items }: ActivityListProps) {
  const privacy = usePrivacyMode()
  const now = new Date()
  return (
    <ul className="plain-list card activity-list">
      {items.map((a) => (
        <li key={a.id} className="activity-row">
          <p className="body">{activityText(a, privacy)}</p>
          <p className="row-sub">{formatRelative(new Date(a.createdAt), now)}</p>
        </li>
      ))}
    </ul>
  )
}
