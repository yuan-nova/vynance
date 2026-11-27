import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { formatMonth, monthOf } from "@vynance/shared"
import { ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { useCategories } from "@/features/categories"
import { PlanWizard, usePlan } from "@/features/plans"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/_tabs/anggaran_/wizard")

/** Wizard anggaran layar penuh (design/08-budget-wizard.svg, FR-41). */
export function BudgetWizardPage() {
  const navigate = useNavigate()
  const { bulan } = route.useSearch()
  const month = bulan ?? monthOf(new Date())
  const bookId = useActiveBook()?.id ?? ""
  const plan = usePlan(bookId, month)
  const categories = useCategories(bookId, "expense")
  const back = () => void navigate({ to: "/anggaran", search: { bulan: month } })

  return (
    <>
      <TopBar
        level={2}
        title={`Wizard anggaran · ${formatMonth(month)}`}
        backLabel="Kembali ke Anggaran"
        onBack={back}
      />
      {plan.isPending || categories.isPending ? <Skeleton rows={4} /> : null}
      {plan.isError ? (
        <ErrorState message="Rencana gagal dimuat." onRetry={() => void plan.refetch()} retrying={plan.isFetching} />
      ) : null}
      {plan.data && categories.data ? (
        <PlanWizard
          bookId={bookId}
          plan={plan.data}
          categories={categories.data}
          onCancel={back}
          onDone={() => {
            showSnackbar("Rencana bulan ini disimpan")
            back()
          }}
        />
      ) : null}
    </>
  )
}
