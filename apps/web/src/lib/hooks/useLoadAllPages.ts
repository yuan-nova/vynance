import { useEffect } from "react"

type Pager = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => Promise<unknown>
}

/** Muat semua halaman query tak berujung selagi `enabled` (mis. total per kategori butuh semua baris). */
export function useLoadAllPages(q: Pager, enabled: boolean): void {
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = q
  useEffect(() => {
    if (enabled && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage()
  }, [enabled, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])
}
