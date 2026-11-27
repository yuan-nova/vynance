import type { DeletionPreview } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type DeleteAccountFormProps = {
  email: string
  preview: DeletionPreview
  pending: boolean
  onSubmit: (confirmEmail: string, onError: (err: unknown) => void) => void
  onCancel: () => void
}

/** Konfirmasi hapus akun: akibat per buku dalam angka (BR-51, BR-53), lalu ketik ulang email. */
export function DeleteAccountForm({ email, preview, pending, onSubmit, onCancel }: DeleteAccountFormProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | undefined>()
  const removed = preview.books.filter((b) => b.willBeDeleted)
  const left = preview.books.filter((b) => !b.willBeDeleted)
  const removedTx = removed.reduce((s, b) => s + b.transactionCount, 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim().toLowerCase() !== email.toLowerCase()) {
      setError("Email tidak cocok dengan akun ini.")
      return
    }
    setError(undefined)
    onSubmit(value.trim(), (err) =>
      setError(splitApiError(err, ["confirmEmail"] as const).fields.confirmEmail ?? (err as Error).message),
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="danger-box">
        <p className="row-title">Yang akan terjadi</p>
        <ul className="danger-list">
          {removed.length > 0 ? (
            <li>
              <strong>{removed.length} buku dihapus</strong> beserta {removedTx} transaksi karena tidak ada anggota
              lain: {removed.map((b) => b.name).join(", ")}.
            </li>
          ) : null}
          {left.length > 0 ? (
            <li>
              Anda <strong>keluar dari {left.length} buku bersama</strong> ({left.map((b) => b.name).join(", ")}).
              Catatan Anda tetap ada untuk anggota lain.
            </li>
          ) : null}
          <li>Nama, email, dan semua sesi login dihapus. Tindakan ini tidak bisa dibatalkan.</li>
        </ul>
      </div>
      <TextField
        label={`Ketik email Anda (${email}) untuk konfirmasi`}
        type="email"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
      />
      <div className="stack">
        <Button type="submit" variant="destructive" full loading={pending} disabled={!value.trim()}>
          Hapus akun permanen
        </Button>
        <Button variant="ghost" full onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
