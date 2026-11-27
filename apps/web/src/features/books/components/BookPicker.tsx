import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Icon } from "@/components/Icon"
import { Sheet } from "@/components/Sheet"
import { showSnackbar } from "@/lib/snackbar"
import { useActiveBook, useBooks, useSwitchBook } from "../hooks/useBooks"
import { BookCode } from "./BookCode"

/** Header Beranda: nama + kode buku aktif; ketuk untuk mengganti (DS-NAV-04). */
export function BookPicker() {
  const navigate = useNavigate()
  const books = useBooks()
  const active = useActiveBook()
  const switchBook = useSwitchBook()
  const [open, setOpen] = useState(false)
  if (!active) return null

  const choose = (bookId: string) => {
    if (bookId === active.id) {
      setOpen(false)
      return
    }
    switchBook.mutate(
      { to: bookId, from: active.id },
      {
        onSuccess: () => {
          setOpen(false)
          void navigate({ to: "/" })
        },
        onError: (e) => showSnackbar(e.message, { tone: "error" }),
      },
    )
  }

  return (
    <>
      <button
        type="button"
        className="book-switch"
        onClick={() => setOpen(true)}
        aria-label={`Ganti buku. Buku aktif: ${active.name}`}
      >
        <span className="book-switch-name truncate">{active.name}</span>
        <span className="book-switch-meta">
          <BookCode code={active.code} />
          <Icon name="chev_d" size={16} />
        </span>
      </button>
      <Sheet open={open} title="Pilih buku" onClose={() => setOpen(false)}>
        <ul className="plain-list">
          {(books.data ?? []).map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="row row-btn"
                onClick={() => choose(b.id)}
                aria-current={b.id === active.id ? "true" : undefined}
                disabled={switchBook.isPending}
              >
                <span className={`tile ${b.id === active.id ? "tile-pri" : "tile-neutral"}`}>
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
                {b.id === active.id ? <Icon name="check" /> : null}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="link-row"
          onClick={() => {
            setOpen(false)
            void navigate({ to: "/lainnya/buku" })
          }}
        >
          Kelola buku
        </button>
      </Sheet>
    </>
  )
}
