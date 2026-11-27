import { createFileRoute, redirect } from "@tanstack/react-router"
import { pickActiveBook } from "@vynance/shared"
import { meQueryOptions } from "@/features/auth"
import { booksQueryOptions } from "@/features/books"
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage"

// PB-01 langkah 3: saldo awal. Tanpa bottom nav (DS-NAV-01 pengecualian Onboarding).
export const Route = createFileRoute("/mulai")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions())
    if (!me) throw redirect({ to: "/masuk", search: { redirect: location.href } })
    const books = await context.queryClient.ensureQueryData(booksQueryOptions())
    if (!pickActiveBook(books, me.lastBookId)) throw redirect({ to: "/buku-baru" })
  },
  component: OnboardingPage,
})
