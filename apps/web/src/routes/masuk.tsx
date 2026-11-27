import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import { authProvidersQueryOptions, meQueryOptions } from "@/features/auth"
import { LoginPage } from "@/pages/login/LoginPage"

export const Route = createFileRoute("/masuk")({
  validateSearch: z.object({ redirect: z.string().startsWith("/").optional() }),
  beforeLoad: async ({ context, search }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions())
    if (me) throw redirect({ to: search.redirect ?? "/" })
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(authProvidersQueryOptions())
  },
  component: LoginPage,
})
