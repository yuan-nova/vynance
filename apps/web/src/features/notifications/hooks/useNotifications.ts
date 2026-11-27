import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { BookSettings, NotificationList } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  fetchBookSettings,
  fetchNotifications,
  readAllNotifications,
  saveBookSettings,
} from "../services/notifications.service"

/** Notifikasi pengguna di buku aktif; ikut diperbarui lewat realtime (awalan qk.book). */
export function useNotifications(bookId: string): UseQueryResult<NotificationList> {
  return useQuery({
    queryKey: qk.notifications(bookId),
    queryFn: () => fetchNotifications(bookId),
    enabled: Boolean(bookId),
  })
}

export function useReadAllNotifications(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => readAllNotifications(bookId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notifications(bookId) }),
  })
}

export function useBookSettings(bookId: string): UseQueryResult<BookSettings> {
  return useQuery({
    queryKey: qk.bookSettings(bookId),
    queryFn: () => fetchBookSettings(bookId),
    enabled: Boolean(bookId),
  })
}

export function useSaveBookSettings(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: BookSettings) => saveBookSettings(bookId, v),
    onSuccess: (s) => qc.setQueryData(qk.bookSettings(bookId), s),
  })
}
