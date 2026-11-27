import {
  BUDGET_GROUP_LABEL,
  BUDGET_GROUPS,
  type BudgetGroup,
  CATEGORY_ICONS,
  type Category,
  type CategoryIcon,
  type CategoryKind,
  createCategorySchema,
} from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { IconPicker } from "@/components/IconPicker"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type Values = { name: string; budgetGroup: BudgetGroup | null; icon: CategoryIcon; monthlyBudget: bigint | null }
type Field = "name" | "budgetGroup" | "icon" | "monthlyBudget"

type CategoryFormProps = {
  kind: CategoryKind
  initial?: Category
  pending: boolean
  onSubmit: (v: Values, onError: (err: unknown) => void) => void
  onDelete?: () => void
}

const GROUP_OPTIONS = BUDGET_GROUPS.map((g) => ({ value: g, label: BUDGET_GROUP_LABEL[g] }))

/** Form kategori (≤ 4 kolom isian → sheet, DS-SHEET-01). Grup dan anggaran hanya untuk uang keluar. */
export function CategoryForm({ kind, initial, pending, onSubmit, onDelete }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [group, setGroup] = useState<BudgetGroup>(initial?.budgetGroup ?? "needs")
  const [icon, setIcon] = useState<CategoryIcon>(CATEGORY_ICONS.find((i) => i === initial?.icon) ?? "tag")
  const [budget, setBudget] = useState<bigint | null>(initial?.monthlyBudget ? BigInt(initial.monthlyBudget) : null)
  const [errors, setErrors] = useState<Partial<Record<Field | "form", string>>>({})
  const expense = kind === "expense"

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createCategorySchema.safeParse({
      name,
      kind,
      icon,
      budgetGroup: expense ? group : null,
      monthlyBudget: expense && budget !== null ? budget.toString() : null,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setErrors({ [(issue?.path[0] as Field | undefined) ?? "form"]: issue?.message })
      return
    }
    setErrors({})
    onSubmit(
      {
        name: parsed.data.name,
        icon,
        budgetGroup: expense ? group : null,
        monthlyBudget: parsed.data.monthlyBudget ?? null,
      },
      (err) => {
        const { fields, formError } = splitApiError(err, ["name", "budgetGroup", "icon", "monthlyBudget"] as const)
        setErrors({ ...fields, form: formError ?? undefined })
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Nama kategori"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!initial}
      />
      {expense ? <ChipGroup label="Grup" options={GROUP_OPTIONS} value={group} onChange={setGroup} /> : null}
      <IconPicker label="Ikon" options={CATEGORY_ICONS} value={icon} onChange={setIcon} />
      {expense ? (
        <MoneyInput
          label="Anggaran bulanan (opsional)"
          value={budget}
          onChange={setBudget}
          error={errors.monthlyBudget}
        />
      ) : null}
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <div className="stack">
        <Button type="submit" full loading={pending}>
          Simpan
        </Button>
        {onDelete ? (
          <Button variant="ghost" full icon="trash" onClick={onDelete}>
            Hapus kategori
          </Button>
        ) : null}
      </div>
    </form>
  )
}
