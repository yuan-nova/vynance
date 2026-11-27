import { createFileRoute, redirect } from "@tanstack/react-router"
import { meQueryOptions } from "@/features/auth"
import { NewBookPage } from "@/pages/books/NewBookPage"

// BR-54: pengguna tanpa buku membuat buku dulu. Tanpa bottom nav.
export const Route = createFileRoute("/buku-baru")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions())
    if (!me) throw redirect({ to: "/masuk", search: { redirect: location.href } })
  },
  component: NewBookPage,
})
