import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Activity, Book, Member } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchActivities, fetchMembers, leaveBook, removeMember } from "../services/members.service"

export function useMembers(bookId: string): UseQueryResult<Member[]> {
  return useQuery({ queryKey: qk.members(bookId), queryFn: () => fetchMembers(bookId), enabled: Boolean(bookId) })
}

export function useActivities(bookId: string): UseQueryResult<Activity[]> {
  return useQuery({ queryKey: qk.activities(bookId), queryFn: () => fetchActivities(bookId), enabled: Boolean(bookId) })
}

export function useRemoveMember(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeMember(bookId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.book(bookId) })
      void qc.invalidateQueries({ queryKey: qk.books() })
    },
  })
}

/** Keluar dari buku (BR-53): cache buku dibuang; guard memilih buku lain atau Buat buku. */
export function useLeaveBook(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => leaveBook(bookId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: qk.book(bookId) })
      qc.setQueryData<Book[]>(qk.books(), (list) => (list ?? []).filter((b) => b.id !== bookId))
      void qc.invalidateQueries({ queryKey: qk.books() })
    },
  })
}
