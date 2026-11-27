import {
  queryOptions,
  type UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type {
  CategoryKind,
  CategoryUsage,
  CreateTransactionInput,
  ScanCommitInput,
  TransactionDetail,
  TransactionSummary,
} from "@vynance/shared"
import { useEffect, useRef, useSyncExternalStore } from "react"
import { qk } from "@/lib/query-keys"
import { enqueueTransaction, flushOutbox, isNetworkError, readOutbox, subscribeOutbox } from "../services/outbox"
import {
  commitScan,
  createTransaction,
  deleteTransaction,
  fetchCategoryUsage,
  fetchTransaction,
  fetchTransactionSummary,
  fetchTransactions,
  restoreTransaction,
  sendOutboxItem,
  updateTransaction,
} from "../services/transactions.service"

export const categoryUsageQueryOptions = (bookId: string, kind: CategoryKind) =>
  queryOptions({ queryKey: qk.categoryUsage(bookId, kind), queryFn: () => fetchCategoryUsage(bookId, kind) })

export function useCategoryUsage(bookId: string, kind: CategoryKind): UseQueryResult<CategoryUsage> {
  return useQuery(categoryUsageQueryOptions(bookId, kind))
}

/** Transaksi baru memengaruhi saldo, anggaran, daftar, dan Beranda: invalidasi seluruh data buku (§7.2 butir 3). */
/**
 * Catat transaksi. Saat offline atau jaringan putus, transaksi masuk antrean dengan Idempotency-Key yang sama
 * dan hasilnya `null` (NFR-04). Error dari server tetap dilempar ke form.
 */
export function useCreateTransaction(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { input: CreateTransactionInput; key: string }) => {
      const queue = () => {
        enqueueTransaction(bookId, v.input, v.key, new Date())
        return null
      }
      if (!navigator.onLine) return queue()
      try {
        return await createTransaction(bookId, v.input, v.key)
      } catch (e) {
        if (isNetworkError(e)) return queue()
        throw e
      }
    },
    onSuccess: (r) => (r ? qc.invalidateQueries({ queryKey: qk.book(bookId) }) : undefined),
  })
}

/** Jumlah transaksi yang menunggu sinkron. */
export function useOutboxCount(): number {
  return useSyncExternalStore(
    subscribeOutbox,
    () => readOutbox().length,
    () => 0,
  )
}

/** Kirim antrean offline saat aplikasi dibuka dan setiap kali kembali online. */
export function useOutboxSync(onSynced: (sent: number, rejected: number) => void): void {
  const qc = useQueryClient()
  const onSyncedRef = useRef(onSynced)
  onSyncedRef.current = onSynced
  useEffect(() => {
    let running = false
    const run = async () => {
      if (running || !navigator.onLine || readOutbox().length === 0) return
      running = true
      try {
        const r = await flushOutbox(sendOutboxItem)
        for (const b of r.books) void qc.invalidateQueries({ queryKey: qk.book(b) })
        if (r.sent + r.rejected > 0) onSyncedRef.current(r.sent, r.rejected)
      } finally {
        running = false
      }
    }
    void run()
    window.addEventListener("online", run)
    return () => window.removeEventListener("online", run)
  }, [qc])
}

export function useCommitScan(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { items: ScanCommitInput["items"]; key: string }) => commitScan(bookId, v.items, v.key),
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

export const transactionQueryOptions = (bookId: string, id: string) =>
  queryOptions({ queryKey: qk.transactionDetail(bookId, id), queryFn: () => fetchTransaction(bookId, id) })

export function useTransaction(bookId: string, id: string): UseQueryResult<TransactionDetail> {
  return useQuery(transactionQueryOptions(bookId, id))
}

/** Ubah/hapus/urungkan memengaruhi saldo, anggaran, daftar, Beranda: invalidasi seluruh data buku. */
function useBookInvalidate(bookId: string) {
  const qc = useQueryClient()
  // Tidak ditunggu: umpan balik (snackbar) tampil segera, data menyusul.
  return () => {
    void qc.invalidateQueries({ queryKey: qk.book(bookId) })
  }
}

export function useUpdateTransaction(bookId: string) {
  const onSuccess = useBookInvalidate(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: CreateTransactionInput }) => updateTransaction(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteTransaction(bookId: string) {
  const qc = useQueryClient()
  const invalidate = useBookInvalidate(bookId)
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(bookId, id),
    onSuccess: (_v, id) => {
      // Detail transaksi yang dihapus tidak perlu dimuat ulang (akan 404).
      qc.removeQueries({ queryKey: qk.transactionDetail(bookId, id) })
      invalidate()
    },
  })
}

export function useRestoreTransaction(bookId: string) {
  const onSuccess = useBookInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => restoreTransaction(bookId, id), onSuccess })
}
