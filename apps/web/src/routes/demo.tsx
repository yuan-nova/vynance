import { createFileRoute } from "@tanstack/react-router"
import { DemoPage } from "@/pages/demo/DemoPage"

export const Route = createFileRoute("/demo")({ component: DemoPage })
