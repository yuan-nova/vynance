import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { CategoriesPage } from "@/pages/categories/CategoriesPage"

// Jenis kategori disimpan di URL (CODING-GUIDELINES §7.2 butir 4).
export const Route = createFileRoute("/_tabs/lainnya/kategori")({
  validateSearch: z.object({ jenis: z.enum(["keluar", "masuk"]).catch("keluar").default("keluar") }),
  component: CategoriesPage,
})
