import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateWalletInput, UpdateWalletInput, WalletList } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { createWallet, deleteWallet, fetchWallets, updateWallet } from "../services/wallets.service"

export const walletsQueryOptions = (bookId: string) =>
  queryOptions({ queryKey: qk.wallets(bookId), queryFn: () => fetchWallets(bookId) })

export function useWallets(bookId: string): UseQueryResult<WalletList> {
  return useQuery(walletsQueryOptions(bookId))
}

/** Rekening memengaruhi saldo di semua layar buku: invalidasi seluruh data buku (CODING-GUIDELINES §7.2 butir 3). */
function useInvalidateBook(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.book(bookId) })
}

export function useCreateWallet(bookId: string) {
  const invalidate = useInvalidateBook(bookId)
  return useMutation({ mutationFn: (input: CreateWalletInput) => createWallet(bookId, input), onSuccess: invalidate })
}

export function useUpdateWallet(bookId: string) {
  const invalidate = useInvalidateBook(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateWalletInput }) => updateWallet(bookId, v.id, v.input),
    onSuccess: invalidate,
  })
}

export function useDeleteWallet(bookId: string) {
  const invalidate = useInvalidateBook(bookId)
  return useMutation({ mutationFn: (id: string) => deleteWallet(bookId, id), onSuccess: invalidate })
}
