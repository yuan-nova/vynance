import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateAssetInput, CreateInvestmentTypeInput, Portfolio, UpdateAssetInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  createAsset,
  deleteAsset,
  deleteInvestmentType,
  fetchPortfolio,
  saveInvestmentType,
  updateAsset,
} from "../services/investments.service"

export function usePortfolio(bookId: string): UseQueryResult<Portfolio> {
  return useQuery({ queryKey: qk.portfolio(bookId), queryFn: () => fetchPortfolio(bookId), enabled: Boolean(bookId) })
}

/** Investasi memengaruhi kekayaan bersih di Beranda dan skor: invalidasi seluruh data buku. */
function useInvalidateBook(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.book(bookId) })
}

export function useSaveInvestmentType(bookId: string) {
  const onSuccess = useInvalidateBook(bookId)
  return useMutation({
    mutationFn: (v: { id: string | null; input: CreateInvestmentTypeInput }) =>
      saveInvestmentType(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteInvestmentType(bookId: string) {
  const onSuccess = useInvalidateBook(bookId)
  return useMutation({ mutationFn: (id: string) => deleteInvestmentType(bookId, id), onSuccess })
}

export function useCreateAsset(bookId: string) {
  const onSuccess = useInvalidateBook(bookId)
  return useMutation({ mutationFn: (v: CreateAssetInput) => createAsset(bookId, v), onSuccess })
}

export function useUpdateAsset(bookId: string) {
  const onSuccess = useInvalidateBook(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateAssetInput }) => updateAsset(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteAsset(bookId: string) {
  const onSuccess = useInvalidateBook(bookId)
  return useMutation({ mutationFn: (id: string) => deleteAsset(bookId, id), onSuccess })
}
