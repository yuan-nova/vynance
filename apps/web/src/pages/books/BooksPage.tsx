import { useNavigate } from "@tanstack/react-router"
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
  useActiveBook,
  useBooks,
  useCreateBook,
  useRenameBook,
  useSwitchBook,
} from "@/features/books"
import { showSnackbar } from "@/lib/snackbar"

/** Layar Buku (design/17-books.svg): buku aktif, buku lain, buat buku baru. Anggota & undangan di #25–#26. */
export function BooksPage() {
  const navigate = useNavigate()
  const books = useBooks()
  const active = useActiveBook()
  const switchBook = useSwitchBook()
  const create = useCreateBook()
  const rename = useRenameBook(active?.id ?? "")
  const [sheet, setSheet] = useState<"create" | "rename" | null>(null)

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
          <div className="section-sm">
            <Button variant="soft" icon="edit" onClick={() => setSheet("rename")}>
              Ubah nama
            </Button>
          </div>
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
