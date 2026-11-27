import { formatDate } from "@vynance/shared"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { showSnackbar } from "@/lib/snackbar"
import { useDeletedBooks, useRestoreBook } from "../hooks/useBooks"
import { BookCode } from "./BookCode"

type DeletedBooksProps = { onRestored: () => void }

/** Daftar "Buku terhapus" yang masih bisa dipulihkan (TSD §5.5). Tidak tampil bila kosong. */
export function DeletedBooks({ onRestored }: DeletedBooksProps) {
  const list = useDeletedBooks()
  const restore = useRestoreBook()
  if (!list.data?.length) return null
  return (
    <section className="section" aria-labelledby="book-deleted">
      <h2 id="book-deleted" className="h2">
        Buku terhapus
      </h2>
      <ul className="plain-list card">
        {list.data.map((b) => (
          <li key={b.id} className="row">
            <span className="tile tile-neutral">
              <Icon name="trash" />
            </span>
            <span className="row-main">
              <span className="row-title">
                <span className="truncate">{b.name}</span>
              </span>
              <span className="row-sub">
                Kode <BookCode code={b.code} /> · bisa dipulihkan sampai {formatDate(b.purgeAfter.slice(0, 10))}
              </span>
            </span>
            <Button
              variant="ghost"
              aria-label={`Pulihkan buku ${b.name}`}
              disabled={restore.isPending}
              onClick={() =>
                restore.mutate(b.id, {
                  onSuccess: (book) => {
                    showSnackbar(`Buku ${book.name} dipulihkan`)
                    onRestored()
                  },
                  onError: (e) => showSnackbar(e.message, { tone: "error" }),
                })
              }
            >
              Pulihkan
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
