import {
  queryOptions,
  type UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { CategoryKind, CategoryUsage, CreateTransactionInput, TransactionSummary } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  createTransaction,
  fetchCategoryUsage,
  fetchTransactionSummary,
  fetchTransactions,
} from "../services/transactions.service"

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

type ListFilter = Parameters<typeof fetchTransactions>[1]

/** Daftar dengan scroll tak berujung (cursor, DS-DATA-01). */
export function useTransactionList(bookId: string, filter: ListFilter) {
  return useInfiniteQuery({
    queryKey: qk.transactionList(bookId, filter),
    queryFn: ({ pageParam }) => fetchTransactions(bookId, filter, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useTransactionSummary(bookId: string, from: string, to: string): UseQueryResult<TransactionSummary> {
  return useQuery({
    queryKey: qk.transactionSummary(bookId, from, to),
    queryFn: () => fetchTransactionSummary(bookId, from, to),
  })
}
