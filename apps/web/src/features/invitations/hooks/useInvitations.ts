import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Invitation, InvitationPreview, Me } from "@vynance/shared"
import { ApiRequestError } from "@/lib/api-error"
import { qk } from "@/lib/query-keys"
import { saveActiveBookId } from "../services/active-book"
import {
  acceptInvitation,
  createInvitation,
  fetchInvitationPreview,
  fetchInvitations,
  revokeInvitation,
} from "../services/invitations.service"

export function useInvitations(bookId: string, enabled = true): UseQueryResult<Invitation[]> {
  return useQuery({
    queryKey: qk.invitations(bookId),
    queryFn: () => fetchInvitations(bookId),
    enabled: enabled && Boolean(bookId),
  })
}

export function useCreateInvitation(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createInvitation(bookId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.invitations(bookId) }),
  })
}

export function useRevokeInvitation(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(bookId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.invitations(bookId) }),
  })
}

/** Pratinjau publik; 404 tidak diulang supaya pesan tampil cepat. */
export function useInvitationPreview(token: string): UseQueryResult<InvitationPreview> {
  return useQuery({
    queryKey: qk.invitationPreview(token),
    queryFn: () => fetchInvitationPreview(token),
    retry: (n, e) => !(e instanceof ApiRequestError && e.status < 500) && n < 2,
  })
}

/** Gabung lalu jadikan buku undangan sebagai buku aktif. */
export function useAcceptInvitation(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { bookId } = await acceptInvitation(token)
      await saveActiveBookId(bookId)
      return bookId
    },
    onSuccess: async (bookId) => {
      qc.setQueryData<Me | null>(qk.me(), (me) => (me ? { ...me, lastBookId: bookId } : me))
      await qc.invalidateQueries({ queryKey: qk.books() })
    },
  })
}
