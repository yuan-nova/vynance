import { createFileRoute, redirect } from "@tanstack/react-router"
import { meQueryOptions } from "@/features/auth"
import { applyUserPrefs } from "@/lib/user-prefs"
import { TabsLayout } from "@/pages/root/TabsLayout"

// Guard: semua layar tab butuh login (FR-01).
export const Route = createFileRoute("/_tabs")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions())
    if (!me) throw redirect({ to: "/masuk", search: { redirect: location.href } })
    applyUserPrefs(me)
    return { me }
  },
  component: TabsLayout,
})
