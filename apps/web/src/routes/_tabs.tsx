import { createFileRoute, redirect } from "@tanstack/react-router"
import { pickActiveBook } from "@vynance/shared"
import { meQueryOptions } from "@/features/auth"
import { booksQueryOptions } from "@/features/books"
import { applyUserPrefs } from "@/lib/user-prefs"
import { TabsLayout } from "@/pages/root/TabsLayout"

// Guard: semua layar tab butuh login (FR-01) dan minimal satu buku (BR-54).
export const Route = createFileRoute("/_tabs")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions())
    if (!me) throw redirect({ to: "/masuk", search: { redirect: location.href } })
    applyUserPrefs(me)
    const books = await context.queryClient.ensureQueryData(booksQueryOptions())
    const activeBook = pickActiveBook(books, me.lastBookId)
    if (!activeBook) throw redirect({ to: "/buku-baru" })
    return { me, activeBook }
  },
  component: TabsLayout,
})
