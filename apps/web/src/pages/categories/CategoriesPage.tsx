import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { BUDGET_GROUP_LABEL, type Category, type CategoryKind, type IconName } from "@vynance/shared"
import { useState } from "react"
import { IconButton } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Money } from "@/components/Money"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  CategoryForm,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useRestoreCategory,
  useUpdateCategory,
} from "@/features/categories"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/_tabs/lainnya/kategori")

type SheetState = { kind: "create" } | { kind: "edit"; category: Category } | null

/** Kategori (FR-30): uang keluar/masuk via URL, urutan dengan tombol naik/turun, hapus + Urungkan. */
export function CategoriesPage() {
  const navigate = useNavigate()
  const { jenis } = route.useSearch()
  const kind: CategoryKind = jenis === "masuk" ? "income" : "expense"
  const bookId = useActiveBook()?.id ?? ""
  const query = useCategories(bookId, kind)
  const create = useCreateCategory(bookId)
  const update = useUpdateCategory(bookId)
  const remove = useDeleteCategory(bookId)
  const restore = useRestoreCategory(bookId)
  const reorder = useReorderCategories(bookId, kind)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const list = query.data ?? []

  const move = (index: number, dir: -1 | 1) => {
    const ids = list.map((c) => c.id)
    const j = index + dir
    const a = ids[index]
    const b = ids[j]
    if (a === undefined || b === undefined) return
    ids[index] = b
    ids[j] = a
    reorder.mutate(ids, { onError: (e) => showSnackbar(e.message, { tone: "error" }) })
  }

  const del = (c: Category) =>
    remove.mutate(c.id, {
      onSuccess: (result) => {
        close()
        showSnackbar(result === "archived" ? `${c.name} diarsipkan` : `${c.name} dihapus`, {
          undo: () => restore.mutate(c.id, { onError: (e) => showSnackbar(e.message, { tone: "error" }) }),
        })
      },
      onError: (e) => showSnackbar(e.message, { tone: "error" }),
    })

  return (
    <>
      <TopBar
        level={2}
        title="Kategori"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah kategori" onClick={() => setSheet({ kind: "create" })} />}
      />
      <nav className="segmented" aria-label="Jenis kategori">
        <Link
          to="/lainnya/kategori"
          search={{ jenis: "keluar" }}
          aria-current={kind === "expense" ? "page" : undefined}
        >
          Uang keluar
        </Link>
        <Link to="/lainnya/kategori" search={{ jenis: "masuk" }} aria-current={kind === "income" ? "page" : undefined}>
          Uang masuk
        </Link>
      </nav>

      {query.isPending ? <Skeleton rows={5} /> : null}
      {query.isError && !query.data ? (
        <ErrorState message="Kategori gagal dimuat." onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : null}
      {query.data && list.length === 0 ? (
        <EmptyState
          icon="tag"
          title="Belum ada kategori"
          actionLabel="Tambah kategori"
          onAction={() => setSheet({ kind: "create" })}
        />
      ) : null}

      {list.length > 0 ? (
        <ul className="card plain-list">
          {list.map((c, i) => (
            <li key={c.id} className="row">
              <button
                type="button"
                className="row row-btn"
                style={{ padding: 0 }}
                onClick={() => setSheet({ kind: "edit", category: c })}
                aria-label={`Ubah kategori ${c.name}`}
              >
                <span className={`tile ${kind === "expense" ? "tile-exp" : "tile-inc"}`}>
                  <Icon name={c.icon as IconName} />
                </span>
                <span className="row-main">
                  <span className="row-title">
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="row-sub">
                    {c.budgetGroup ? BUDGET_GROUP_LABEL[c.budgetGroup] : "Uang masuk"}
                    {c.monthlyBudget ? (
                      <>
                        {" · "}
                        <Money value={BigInt(c.monthlyBudget)} />
                        /bln
                      </>
                    ) : null}
                  </span>
                </span>
              </button>
              <span className="order-btns">
                <IconButton
                  icon="chev_u"
                  label={`Pindah ${c.name} ke atas`}
                  disabled={i === 0 || reorder.isPending}
                  onClick={() => move(i, -1)}
                />
                <IconButton
                  icon="chev_d"
                  label={`Pindah ${c.name} ke bawah`}
                  disabled={i === list.length - 1 || reorder.isPending}
                  onClick={() => move(i, 1)}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <Sheet open={sheet?.kind === "create"} title="Tambah kategori" onClose={close}>
        <CategoryForm
          kind={kind}
          pending={create.isPending}
          onSubmit={(v, onError) =>
            create.mutate(
              { ...v, kind },
              {
                onSuccess: (c) => {
                  close()
                  showSnackbar(`Kategori ${c.name} ditambahkan`)
                },
                onError,
              },
            )
          }
        />
      </Sheet>
      <Sheet open={sheet?.kind === "edit"} title="Ubah kategori" onClose={close}>
        {sheet?.kind === "edit" ? (
          <CategoryForm
            key={sheet.category.id}
            kind={kind}
            initial={sheet.category}
            pending={update.isPending}
            onDelete={() => del(sheet.category)}
            onSubmit={(v, onError) =>
              update.mutate(
                {
                  id: sheet.category.id,
                  input: kind === "expense" ? v : { name: v.name, icon: v.icon },
                },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Kategori disimpan")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>
    </>
  )
}
