import { formatDateShort, type Member } from "@vynance/shared"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Pill } from "@/components/Pill"

type MemberListProps = { members: Member[]; onRemove: (m: Member) => void; onLeave: () => void }

/** Daftar anggota tanpa label peran (BR-49). Email membedakan nama yang mirip. */
export function MemberList({ members, onRemove, onLeave }: MemberListProps) {
  return (
    <ul className="plain-list card">
      {members.map((m) => (
        <li key={m.userId} className="row">
          <span className="tile tile-neutral" aria-hidden="true">
            <Icon name="user" />
          </span>
          <span className="row-main">
            <span className="row-title">
              <span className="truncate">{m.name || m.email}</span>
              {m.isMe ? <Pill tone="pri">Kamu</Pill> : null}
            </span>
            <span className="row-sub truncate">
              {m.email} · bergabung {formatDateShort(m.joinedAt.slice(0, 10))}
            </span>
          </span>
          {m.isMe ? (
            <Button variant="ghost" onClick={onLeave}>
              Keluar
            </Button>
          ) : (
            <Button variant="ghost" aria-label={`Keluarkan ${m.name || m.email}`} onClick={() => onRemove(m)}>
              Keluarkan
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
