import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { routeTree } from "./routeTree.gen"
import "./styles.css"

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
const router = createRouter({ routeTree, context: { queryClient }, defaultPreload: "intent" })

declare module "@tanstack/react-router" {
  // biome-ignore lint/style/useConsistentTypeDefinitions: TanStack Router butuh declaration merging (CODING-GUIDELINES §4.3)
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Elemen #root tidak ditemukan")

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
