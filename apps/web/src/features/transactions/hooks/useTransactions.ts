import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CategoryKind, CategoryUsage, CreateTransactionInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { createTransaction, fetchCategoryUsage } from "../services/transactions.service"

export const categoryUsageQueryOptions = (bookId: string, kind: CategoryKind) =>
  queryOptions({ queryKey: qk.categoryUsage(bookId, kind), queryFn: () => fetchCategoryUsage(bookId, kind) })

export function useCategoryUsage(bookId: string, kind: CategoryKind): UseQueryResult<CategoryUsage> {
  return useQuery(categoryUsageQueryOptions(bookId, kind))
}

/** Transaksi baru memengaruhi saldo, anggaran, daftar, dan Beranda: invalidasi seluruh data buku (§7.2 butir 3). */
export function useCreateTransaction(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { input: CreateTransactionInput; key: string }) => createTransaction(bookId, v.input, v.key),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.book(bookId) }),
  })
}
