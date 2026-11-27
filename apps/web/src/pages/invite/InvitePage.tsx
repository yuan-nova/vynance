import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { errorMessage, formatBookCode, formatDate, INVITATION_STATUS_LABEL } from "@vynance/shared"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Skeleton } from "@/components/States"
import { useMe } from "@/features/auth"
import { useAcceptInvitation, useInvitationPreview } from "@/features/invitations"
import { ApiRequestError } from "@/lib/api-error"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/undangan/$token")

const STATUS_MESSAGE = {
  used: errorMessage("INVITATION_USED"),
  revoked: errorMessage("INVITATION_REVOKED"),
  expired: errorMessage("INVITATION_EXPIRED"),
} as const

/** Terima undangan (PB-12): nama buku + kode + pengundang, lalu masuk/daftar dan gabung. Tanpa bottom nav. */
export function InvitePage() {
  const navigate = useNavigate()
  const { token } = route.useParams()
  const preview = useInvitationPreview(token)
  const me = useMe()
  const accept = useAcceptInvitation(token)
  const p = preview.data
  const notFound = preview.error instanceof ApiRequestError && preview.error.status === 404

  return (
    <main className="login">
      <div className="login-brand">
        <span className="tile tile-pri">
          <Icon name="users" />
        </span>
        <span className="login-name">Vynance</span>
      </div>

      {preview.isPending || me.isPending ? <Skeleton rows={2} height={64} /> : null}

      {notFound || (preview.isError && !notFound) ? (
        <div className="login-copy">
          <h1 className="login-title">Undangan tidak bisa dibuka</h1>
          <p className="body">
            {notFound ? errorMessage("INVITATION_NOT_FOUND") : "Undangan gagal dimuat. Periksa koneksi lalu coba lagi."}
          </p>
          {!notFound ? (
            <Button variant="soft" full onClick={() => void preview.refetch()} loading={preview.isFetching}>
              Coba lagi
            </Button>
          ) : null}
        </div>
      ) : null}

      {p && !me.isPending ? (
        <>
          <div className="login-copy">
            <p className="row-sub">{p.inviterName || "Anggota buku"} mengundangmu ke buku</p>
            <h1 className="login-title">{p.bookName}</h1>
            <p className="body">
              Kode {formatBookCode(p.bookCode)} · {INVITATION_STATUS_LABEL[p.status]}
              {p.status === "active" ? ` sampai ${formatDate(p.expiresAt.slice(0, 10))}` : ""}
            </p>
          </div>
          {p.status !== "active" ? (
            <p className="danger-box" role="alert">
              {STATUS_MESSAGE[p.status]}
            </p>
          ) : me.data ? (
            <div className="stack">
              <p className="body">
                Kamu masuk sebagai <strong>{me.data.email}</strong>. Setelah bergabung, kamu bisa melihat dan mencatat
                semua data di buku ini.
              </p>
              <Button
                full
                loading={accept.isPending}
                onClick={() =>
                  accept.mutate(undefined, {
                    onSuccess: () => {
                      showSnackbar(`Kamu bergabung ke ${p.bookName}`)
                      void navigate({ to: "/" })
                    },
                    onError: (e) => {
                      if (e instanceof ApiRequestError && e.code === "INVITATION_ALREADY_MEMBER") {
                        showSnackbar(e.message)
                        void navigate({ to: "/" })
                        return
                      }
                      showSnackbar(e.message, { tone: "error" })
                      void preview.refetch()
                    },
                  })
                }
              >
                Gabung ke buku
              </Button>
            </div>
          ) : (
            <div className="stack">
              <p className="body">Masuk atau daftar dulu, lalu kamu kembali ke halaman ini untuk bergabung.</p>
              <Link to="/masuk" search={{ redirect: `/undangan/${token}` }} className="btn btn-primary btn-full">
                Masuk untuk bergabung
              </Link>
            </div>
          )}
        </>
      ) : null}
    </main>
  )
}
