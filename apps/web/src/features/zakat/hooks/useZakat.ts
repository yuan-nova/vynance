import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ZakatPaymentInput, ZakatSummary } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchZakat, payZakat, saveHaulStart } from "../services/zakat.service"

/** Ringkasan zakat; harga emas manual ikut jadi kunci query. */
export function useZakat(bookId: string, goldPrice: bigint | null): UseQueryResult<ZakatSummary> {
  return useQuery({
    queryKey: qk.zakatSummary(bookId, goldPrice?.toString() ?? "auto"),
    queryFn: () => fetchZakat(bookId, goldPrice),
    enabled: Boolean(bookId),
  })
}

/** Pembayaran membuat transaksi: saldo, anggaran, dan Beranda ikut berubah. */
export function usePayZakat(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { input: ZakatPaymentInput; key: string }) => payZakat(bookId, v.input, v.key),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.book(bookId) }),
  })
}

export function useSaveHaulStart(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (start: string | null) => saveHaulStart(bookId, start),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.zakat(bookId) }),
  })
}
