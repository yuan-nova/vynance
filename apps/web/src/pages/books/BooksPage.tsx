import { useNavigate } from "@tanstack/react-router"
import type { Member } from "@vynance/shared"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Pill } from "@/components/Pill"
import { Sheet } from "@/components/Sheet"
import { ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import {
  BookCode,
  BookNameForm,
  DeleteBookForm,
  DeletedBooks,
  useActiveBook,
  useBookDeletionInfo,
  useBooks,
  useCreateBook,
  useDeleteBook,
  useRenameBook,
  useSwitchBook,
} from "@/features/books"
import { InvitePanel } from "@/features/invitations"
import { ActivityList, MemberList, useActivities, useLeaveBook, useMembers, useRemoveMember } from "@/features/members"
import { showSnackbar } from "@/lib/snackbar"

/** Layar Buku (design/17-books.svg): buku aktif, buku lain, buat buku baru. Anggota & undangan di #25–#26. */
export function BooksPage() {
  const navigate = useNavigate()
  const books = useBooks()
  const active = useActiveBook()
  const switchBook = useSwitchBook()
  const create = useCreateBook()
  const rename = useRenameBook(active?.id ?? "")
  const [sheet, setSheet] = useState<"create" | "rename" | "delete" | "invite" | "leave" | null>(null)
  const [removing, setRemoving] = useState<Member | null>(null)
  const members = useMembers(active?.id ?? "")
  const activities = useActivities(active?.id ?? "")
  const removeMember = useRemoveMember(active?.id ?? "")
  const leave = useLeaveBook(active?.id ?? "")
  const lastMember = (members.data?.length ?? 0) <= 1
  const remove = useDeleteBook()
  const deletionInfo = useBookDeletionInfo(active?.id ?? "", sheet === "delete")

  const others = (books.data ?? []).filter((b) => b.id !== active?.id)

  return (
    <>
      <TopBar level={2} title="Buku" backLabel="Kembali ke Lainnya" onBack={() => void navigate({ to: "/lainnya" })} />
      {books.isPending ? <Skeleton rows={3} /> : null}
      {books.isError ? (
        <ErrorState
          message="Daftar buku gagal dimuat."
          onRetry={() => void books.refetch()}
          retrying={books.isFetching}
        />
      ) : null}
      {active ? (
        <section className="card" aria-labelledby="book-active">
          <div className="status-row">
            <h2 id="book-active" className="h2 truncate" style={{ marginBottom: 0 }}>
              {active.name}
            </h2>
            <Pill tone="pri">Aktif</Pill>
          </div>
          <p className="row-sub">
            Kode <BookCode code={active.code} /> · {active.memberCount} anggota
          </p>
          <div className="section-sm book-actions">
            <Button icon="users" onClick={() => setSheet("invite")}>
              Undang anggota
            </Button>
            <Button variant="soft" icon="edit" onClick={() => setSheet("rename")}>
              Ubah nama
            </Button>
            <Button variant="ghost" icon="trash" onClick={() => setSheet("delete")}>
              Hapus buku
            </Button>
          </div>
        </section>
      ) : null}

      {members.data ? (
        <section className="section" aria-labelledby="book-members">
          <div className="section-head">
            <h2 id="book-members" className="h2">
              Anggota
            </h2>
            <span className="row-sub">Akses sama</span>
          </div>
          <MemberList members={members.data} onRemove={setRemoving} onLeave={() => setSheet("leave")} />
        </section>
      ) : null}

      {others.length > 0 ? (
        <section className="section" aria-labelledby="book-others">
          <h2 id="book-others" className="h2">
            Buku lain
          </h2>
          <ul className="plain-list card">
            {others.map((b) => (
              <li key={b.id} className="row">
                <span className="tile tile-neutral">
                  <Icon name="book" />
                </span>
                <span className="row-main">
                  <span className="row-title">
                    <span className="truncate">{b.name}</span>
                  </span>
                  <span className="row-sub">
                    Kode <BookCode code={b.code} /> · {b.memberCount} anggota
                  </span>
                </span>
                <Button
                  variant="ghost"
                  aria-label={`Pakai buku ${b.name}`}
                  disabled={switchBook.isPending}
                  onClick={() =>
                    switchBook.mutate(
                      { to: b.id, from: active?.id ?? null },
                      {
                        onSuccess: () => void navigate({ to: "/" }),
                        onError: (e) => showSnackbar(e.message, { tone: "error" }),
                      },
                    )
                  }
                >
                  Pakai
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section">
        <Button variant="soft" full icon="plus" onClick={() => setSheet("create")}>
          Buat buku baru
        </Button>
      </section>

      {activities.data && activities.data.length > 0 ? (
        <section className="section" aria-labelledby="book-activity">
          <h2 id="book-activity" className="h2">
            Aktivitas terbaru
          </h2>
          <ActivityList items={activities.data} />
        </section>
      ) : null}

      <DeletedBooks onRestored={() => void navigate({ to: "/" })} />

      <Sheet
        open={removing !== null}
        title={removing ? `Keluarkan ${removing.name || removing.email}?` : ""}
        onClose={() => setRemoving(null)}
        footer={
          removing ? (
            <>
              <Button
                variant="destructive"
                full
                loading={removeMember.isPending}
                onClick={() =>
                  removeMember.mutate(removing.userId, {
                    onSuccess: () => {
                      showSnackbar(`${removing.name || removing.email} dikeluarkan`)
                      setRemoving(null)
                    },
                    onError: (e) => {
                      setRemoving(null)
                      showSnackbar(e.message, { tone: "error" })
                    },
                  })
                }
              >
                Keluarkan
              </Button>
              <Button variant="ghost" full onClick={() => setRemoving(null)}>
                Batal
              </Button>
            </>
          ) : null
        }
      >
        <p className="body">
          Ia langsung kehilangan akses ke buku ini. Transaksi yang pernah ia catat tetap ada dan tetap menyebut namanya.
        </p>
      </Sheet>

      <Sheet
        open={sheet === "leave"}
        title={lastMember ? "Kamu anggota terakhir" : `Keluar dari ${active?.name ?? "buku"}?`}
        onClose={() => setSheet(null)}
        footer={
          lastMember ? (
            <>
              <Button variant="destructive" full icon="trash" onClick={() => setSheet("delete")}>
                Hapus buku
              </Button>
              <Button variant="ghost" full onClick={() => setSheet(null)}>
                Batal
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                full
                loading={leave.isPending}
                onClick={() =>
                  leave.mutate(undefined, {
                    onSuccess: () => {
                      setSheet(null)
                      showSnackbar(`Kamu keluar dari ${active?.name ?? "buku"}`)
                      void navigate({ to: "/" })
                    },
                    onError: (e) => {
                      setSheet(null)
                      showSnackbar(e.message, { tone: "error" })
                    },
                  })
                }
              >
                Keluar dari buku
              </Button>
              <Button variant="ghost" full onClick={() => setSheet(null)}>
                Batal
              </Button>
            </>
          )
        }
      >
        <p className="body">
          {lastMember
            ? "Buku harus punya minimal satu anggota, jadi kamu tidak bisa keluar. Hapus bukunya bila tidak dipakai lagi."
            : "Kamu langsung kehilangan akses ke buku ini. Transaksi yang kamu catat tetap ada untuk anggota lain."}
        </p>
      </Sheet>

      <Sheet
        open={sheet === "delete"}
        title={active ? `Hapus buku ${active.name}?` : "Hapus buku"}
        onClose={() => setSheet(null)}
      >
        {deletionInfo.isPending ? <Skeleton rows={2} /> : null}
        {deletionInfo.isError ? (
          <ErrorState
            message="Data buku gagal dimuat."
            onRetry={() => void deletionInfo.refetch()}
            retrying={deletionInfo.isFetching}
          />
        ) : null}
        {active && deletionInfo.data ? (
          <DeleteBookForm
            book={active}
            info={deletionInfo.data}
            pending={remove.isPending}
            onCancel={() => setSheet(null)}
            onSubmit={(confirmName, onError) =>
              remove.mutate(
                { bookId: active.id, confirmName },
                {
                  onSuccess: () => {
                    setSheet(null)
                    showSnackbar(`Buku ${active.name} dihapus. Bisa dipulihkan 30 hari.`)
                    void navigate({ to: "/" })
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet open={sheet === "invite"} title="Undang anggota" onClose={() => setSheet(null)}>
        {active && sheet === "invite" ? <InvitePanel bookId={active.id} bookName={active.name} /> : null}
      </Sheet>

      <Sheet open={sheet === "create"} title="Buat buku baru" onClose={() => setSheet(null)}>
        <BookNameForm
          submitLabel="Buat buku"
          pending={create.isPending}
          onCancel={() => setSheet(null)}
          onSubmit={(name, onError) =>
            create.mutate(
              { name },
              {
                onSuccess: (book) => {
                  setSheet(null)
                  showSnackbar(`Buku ${book.name} dibuat`)
                  void navigate({ to: "/" })
                },
                onError,
              },
            )
          }
        />
      </Sheet>
      <Sheet open={sheet === "rename"} title="Ubah nama buku" onClose={() => setSheet(null)}>
        <BookNameForm
          initial={active?.name}
          submitLabel="Simpan"
          pending={rename.isPending}
          onCancel={() => setSheet(null)}
          onSubmit={(name, onError) =>
            rename.mutate(
              { name },
              {
                onSuccess: () => {
                  setSheet(null)
                  showSnackbar("Nama buku disimpan")
                },
                onError,
              },
            )
          }
        />
      </Sheet>
    </>
  )
}
