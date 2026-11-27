import { z } from "zod"
import type { IconName } from "../icons"
import { moneySchema } from "../money/money"

export const CATEGORY_KINDS = ["expense", "income"] as const
export const categoryKindSchema = z.enum(CATEGORY_KINDS)
export type CategoryKind = z.infer<typeof categoryKindSchema>

/** Grup 50/30/20: Kebutuhan, Keinginan, Tabungan (FR-30). Hanya untuk kategori pengeluaran. */
export const BUDGET_GROUPS = ["needs", "wants", "savings"] as const
export const budgetGroupSchema = z.enum(BUDGET_GROUPS)
export type BudgetGroup = z.infer<typeof budgetGroupSchema>

export const BUDGET_GROUP_LABEL: Record<BudgetGroup, string> = {
  needs: "Kebutuhan",
  wants: "Keinginan",
  savings: "Tabungan",
}

/** Ikon yang boleh dipilih untuk kategori (subset registri DS-ICON-01). */
export const CATEGORY_ICONS = [
  "food",
  "bag",
  "car",
  "zap",
  "heart",
  "school",
  "repeat",
  "tag",
  "brief",
  "coins",
  "moon",
  "user",
  "users",
  "doc",
  "send",
  "trend",
] as const satisfies readonly IconName[]
export const categoryIconSchema = z.enum(CATEGORY_ICONS)
export type CategoryIcon = (typeof CATEGORY_ICONS)[number]

const nameSchema = z.string().trim().min(1, "Nama kategori wajib diisi").max(40, "Nama kategori maksimal 40 karakter")

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: categoryKindSchema,
  budgetGroup: budgetGroupSchema.nullable(),
  icon: z.string(),
  monthlyBudget: z.string().nullable(),
  sortOrder: z.number().int(),
  archivedAt: z.string().nullable(),
})
export type Category = z.infer<typeof categorySchema>

export const createCategorySchema = z
  .object({
    name: nameSchema,
    kind: categoryKindSchema,
    budgetGroup: budgetGroupSchema.nullable().optional(),
    icon: categoryIconSchema,
    monthlyBudget: moneySchema
      .refine((v) => v >= 0n, "Anggaran tidak boleh minus")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((v) => v.kind === "expense" || v.budgetGroup == null, {
    message: "Grup hanya untuk kategori uang keluar",
    path: ["budgetGroup"],
  })
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    budgetGroup: budgetGroupSchema.nullable().optional(),
    icon: categoryIconSchema.optional(),
    monthlyBudget: moneySchema
      .refine((v) => v >= 0n, "Anggaran tidak boleh minus")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Tidak ada perubahan")
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

/** Urutan baru satu jenis kategori: semua ID kategori aktif jenis itu, urut. */
export const reorderCategoriesSchema = z
  .object({ kind: categoryKindSchema, ids: z.array(z.string()).min(1).max(200) })
  .strict()
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>

export const categoryListQuerySchema = z.object({
  kind: categoryKindSchema.optional(),
  archived: z.enum(["include", "only"]).optional(),
})
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>
