import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Category, CategoryKind, CreateCategoryInput, UpdateCategoryInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  reorderCategories,
  restoreCategory,
  updateCategory,
} from "../services/categories.service"

export const categoriesQueryOptions = (bookId: string, kind: CategoryKind) =>
  queryOptions({ queryKey: qk.categories(bookId, kind), queryFn: () => fetchCategories(bookId, kind) })

export function useCategories(bookId: string, kind: CategoryKind): UseQueryResult<Category[]> {
  return useQuery(categoriesQueryOptions(bookId, kind))
}

/** Kategori dipakai transaksi, anggaran, dan Beranda: invalidasi seluruh data buku. */
function useInvalidate(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.book(bookId) })
}

export function useCreateCategory(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (i: CreateCategoryInput) => createCategory(bookId, i), onSuccess })
}

export function useUpdateCategory(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateCategoryInput }) => updateCategory(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteCategory(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => deleteCategory(bookId, id), onSuccess })
}

export function useRestoreCategory(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => restoreCategory(bookId, id), onSuccess })
}

/** Ubah urutan dengan optimistic update; dikembalikan bila gagal. */
export function useReorderCategories(bookId: string, kind: CategoryKind) {
  const qc = useQueryClient()
  const key = qk.categories(bookId, kind)
  return useMutation({
    mutationFn: (ids: string[]) => reorderCategories(bookId, kind, ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Category[]>(key)
      if (prev) {
        const byId = new Map(prev.map((c) => [c.id, c]))
        qc.setQueryData<Category[]>(
          key,
          ids.flatMap((id) => byId.get(id) ?? []),
        )
      }
      return { prev }
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.book(bookId) }),
  })
}
