import { createFileRoute } from "@tanstack/react-router"
import { TabsLayout } from "@/pages/root/TabsLayout"

export const Route = createFileRoute("/_tabs")({ component: TabsLayout })
