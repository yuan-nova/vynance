import { createFileRoute } from "@tanstack/react-router"
import { apiHealthQueryOptions } from "@/features/health"
import { HomePage } from "@/pages/home/HomePage"

export const Route = createFileRoute("/_tabs/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(apiHealthQueryOptions())
  },
  component: HomePage,
})
