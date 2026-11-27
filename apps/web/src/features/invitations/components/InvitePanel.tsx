import {
  formatDate,
  INVITATION_STATUS_LABEL,
  INVITATION_TTL_DAYS,
  type InvitationStatus,
  type PillTone,
} from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Pill } from "@/components/Pill"
import { Skeleton } from "@/components/States"
import { showSnackbar } from "@/lib/snackbar"
import { useCreateInvitation, useInvitations, useRevokeInvitation } from "../hooks/useInvitations"

const TONE: Record<InvitationStatus, PillTone> = { active: "inc", used: "pri", revoked: "neutral", expired: "neutral" }

type InvitePanelProps = { bookId: string; bookName: string }

/**
 * Undang anggota (FR-04, PB-12): buat tautan sekali pakai, salin atau bagikan ke WhatsApp.
 * Tautan hanya tampil sekali setelah dibuat karena server hanya menyimpan hash-nya.
 */
export function InvitePanel({ bookId, bookName }: InvitePanelProps) {
  const list = useInvitations(bookId)
  const create = useCreateInvitation(bookId)
  const revoke = useRevokeInvitation(bookId)
  const [url, setUrl] = useState<string | null>(null)
  const message = url ? `Gabung ke buku "${bookName}" di Vynance: ${url}` : ""

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      showSnackbar("Tautan disalin")
    } catch {
      showSnackbar("Tidak bisa menyalin otomatis. Tekan lama tautan untuk menyalin.", { tone: "error" })
    }
  }

  return (
    <div className="invite-panel">
      <p className="body">
        Siapa pun yang membuka tautan ini bisa bergabung dan punya akses yang sama dengan kamu. Tautan berlaku{" "}
        {INVITATION_TTL_DAYS} hari dan hanya bisa dipakai satu orang.
      </p>
      {url ? (
        <div className="invite-link card">
          <p className="invite-url">
            <span className="sr-only">Tautan undangan: </span>
            {url}
          </p>
          <div className="stack">
            <Button icon="link" full onClick={() => void copy()}>
              Salin tautan
            </Button>
            <a
              className="btn btn-soft btn-full"
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Bagikan ke WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <Button
          full
          icon="send"
          loading={create.isPending}
          onClick={() =>
            create.mutate(undefined, {
              onSuccess: (r) => setUrl(r.url),
              onError: (e) => showSnackbar(e.message, { tone: "error" }),
            })
          }
        >
          Buat tautan undangan
        </Button>
      )}

      <h3 className="h3">Undangan terbaru</h3>
      {list.isPending ? <Skeleton rows={2} /> : null}
      {list.data && list.data.length === 0 ? <p className="row-sub">Belum ada undangan.</p> : null}
      {list.data && list.data.length > 0 ? (
        <ul className="plain-list">
          {list.data.map((i) => (
            <li key={i.id} className="row">
              <span className="row-main">
                <span className="row-title">
                  <Pill tone={TONE[i.status]}>{INVITATION_STATUS_LABEL[i.status]}</Pill>
                </span>
                <span className="row-sub">
                  {i.status === "used" && i.usedByName
                    ? `Dipakai ${i.usedByName}`
                    : `Oleh ${i.createdByName || "anggota"} · berlaku sampai ${formatDate(i.expiresAt.slice(0, 10))}`}
                </span>
              </span>
              {i.status === "active" ? (
                <Button
                  variant="ghost"
                  disabled={revoke.isPending}
                  aria-label="Batalkan undangan ini"
                  onClick={() =>
                    revoke.mutate(i.id, {
                      onSuccess: () => showSnackbar("Undangan dibatalkan"),
                      onError: (e) => showSnackbar(e.message, { tone: "error" }),
                    })
                  }
                >
                  Batalkan
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
