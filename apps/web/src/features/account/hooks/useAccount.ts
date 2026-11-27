import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DeletionPreview } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { deleteAccount, fetchDeletionPreview } from "../services/account.service"

/** Akibat hapus akun; selalu diambil segar saat sheet dibuka. */
export function useDeletionPreview(enabled: boolean): UseQueryResult<DeletionPreview> {
  return useQuery({ queryKey: qk.deletionPreview(), queryFn: fetchDeletionPreview, enabled, staleTime: 0 })
}

/** Hapus akun: sesi berakhir di server, semua cache dibuang. */
export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteAccount, onSuccess: () => qc.clear() })
}
