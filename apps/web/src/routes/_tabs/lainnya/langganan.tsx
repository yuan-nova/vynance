import { createFileRoute } from "@tanstack/react-router"
import { SubscriptionsPage } from "@/pages/subscriptions/SubscriptionsPage"

export const Route = createFileRoute("/_tabs/lainnya/langganan")({ component: SubscriptionsPage })
