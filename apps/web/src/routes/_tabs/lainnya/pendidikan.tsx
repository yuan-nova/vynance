import { createFileRoute } from "@tanstack/react-router"
import { EducationPage } from "@/pages/education/EducationPage"

export const Route = createFileRoute("/_tabs/lainnya/pendidikan")({ component: EducationPage })
