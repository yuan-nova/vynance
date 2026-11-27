import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type PayslipList, parsePayslip, type SavePayslipInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { deletePayslip, fetchPayslips, savePayslip } from "../services/payslips.service"
import { pdfToText } from "../services/pdf-text"

export function usePayslips(bookId: string): UseQueryResult<PayslipList> {
  return useQuery({ queryKey: qk.payslips(bookId), queryFn: () => fetchPayslips(bookId), enabled: Boolean(bookId) })
}

function useInvalidate(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.payslips(bookId) })
}

export function useSavePayslip(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (input: SavePayslipInput) => savePayslip(bookId, input), onSuccess })
}

export function useDeletePayslip(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => deletePayslip(bookId, id), onSuccess })
}

/** Baca PDF slip di perangkat lalu urai angkanya (ADR 0007). Tidak menyentuh server. */
export function useReadPayslipPdf() {
  return useMutation({ mutationFn: async (file: File) => parsePayslip(await pdfToText(file)) })
}
