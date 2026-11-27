import { createFileRoute } from "@tanstack/react-router"
import { InvitePage } from "@/pages/invite/InvitePage"

// Publik: pratinjau undangan sebelum login (TSD §5.4). Gabung butuh login lewat /masuk?redirect=.
export const Route = createFileRoute("/undangan/$token")({ component: InvitePage })
