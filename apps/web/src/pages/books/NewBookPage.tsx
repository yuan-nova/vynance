import { useNavigate } from "@tanstack/react-router"
import { Icon } from "@/components/Icon"
import { BookNameForm, DeletedBooks, useCreateBook } from "@/features/books"

/** BR-54: belum punya buku → buat buku sebelum masuk Beranda. */
export function NewBookPage() {
  const navigate = useNavigate()
  const create = useCreateBook()
  return (
    <main className="login">
      <div className="login-brand">
        <span className="tile tile-pri">
          <Icon name="book" />
        </span>
        <span className="login-name">Vynance</span>
      </div>
      <div className="login-copy">
        <h1 className="login-title">Buat buku pertamamu</h1>
        <p className="body">Buku menyimpan rekening, transaksi, dan anggaran. Kamu bisa mengundang anggota nanti.</p>
      </div>
      <BookNameForm
        initial="Pribadi"
        submitLabel="Buat buku"
        pending={create.isPending}
        onSubmit={(name, onError) =>
          create.mutate({ name }, { onSuccess: () => void navigate({ to: "/mulai" }), onError })
        }
      />
      <DeletedBooks onRestored={() => void navigate({ to: "/" })} />
    </main>
  )
}
