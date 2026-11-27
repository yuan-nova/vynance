import { BOOK_RESTORE_DAYS, type Book, type BookDeletionInfo } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type DeleteBookFormProps = {
  book: Book
  info: BookDeletionInfo
  pending: boolean
  onSubmit: (confirmName: string, onError: (err: unknown) => void) => void
  onCancel: () => void
}

/** Konfirmasi hapus buku (BR-52, DS-ACTION-03): akibat dalam angka, lalu ketik nama buku. */
export function DeleteBookForm({ book, info, pending, onSubmit, onCancel }: DeleteBookFormProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | undefined>()
  const others = info.memberCount - 1

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim() !== book.name.trim()) {
      setError("Nama yang diketik tidak sama dengan nama buku.")
      return
    }
    setError(undefined)
    onSubmit(value.trim(), (err) => {
      const { fields, formError } = splitApiError(err, ["confirmName"] as const)
      setError(fields.confirmName ?? formError ?? undefined)
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="danger-box">
        <p className="row-title">Yang akan terjadi</p>
        <ul className="danger-list">
          <li>
            Buku <strong>{book.name}</strong> beserta <strong>{info.transactionCount} transaksi</strong>, rekening,
            anggaran, dan target di dalamnya disembunyikan.
          </li>
          {others > 0 ? (
            <li>
              <strong>{others} anggota lain</strong> juga langsung kehilangan akses.
            </li>
          ) : null}
          <li>Anggota masih bisa memulihkannya selama {BOOK_RESTORE_DAYS} hari. Setelah itu buku dihapus permanen.</li>
        </ul>
      </div>
      <TextField
        label={`Ketik "${book.name}" untuk konfirmasi`}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
      />
      <div className="stack">
        <Button type="submit" variant="destructive" full loading={pending} disabled={!value.trim()}>
          Hapus buku
        </Button>
        <Button variant="ghost" full onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
