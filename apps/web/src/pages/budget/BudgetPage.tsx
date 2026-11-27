import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { addMonths, formatMonth, monthOf } from "@vynance/shared"
import { useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import { useCategories } from "@/features/categories"
import { PlanEditor, useCarryOver, useInvestmentTypes, usePlan } from "@/features/plans"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/_tabs/anggaran")

/** Anggaran (design/07-budget.svg, PB-04): rencana bulanan per bulan di URL. */
export function BudgetPage() {
  const navigate = useNavigate({ from: "/anggaran" })
  const { bulan } = route.useSearch()
  const month = bulan ?? monthOf(new Date())
  const bookId = useActiveBook()?.id ?? ""
  const plan = usePlan(bookId, month)
  const categories = useCategories(bookId, "expense")
  const types = useInvestmentTypes(bookId)
  const carry = useCarryOver(bookId, month)
  // Dinaikkan saat konflik supaya editor dipasang ulang dengan data terbaru.
  const [reload, setReload] = useState(0)

  const ready = plan.data && categories.data && types.data
  return (
    <>
      <TopBar level={1} title="Anggaran" />
      <div className="month-nav">
        <IconButton
          icon="chev_l"
          label="Bulan sebelumnya"
          onClick={() => void navigate({ search: { bulan: addMonths(month, -1) } })}
        />
        <span className="month-label">{formatMonth(month)}</span>
        <IconButton
          icon="chev_r"
          label="Bulan berikutnya"
          onClick={() => void navigate({ search: { bulan: addMonths(month, 1) } })}
        />
      </div>
      <Button
        variant="soft"
        full
        icon="spark"
        onClick={() => void navigate({ to: "/anggaran/wizard", search: { bulan: month } })}
      >
        Susun dengan wizard 50/30/20
      </Button>
      <Button
        variant="ghost"
        full
        icon="repeat"
        loading={carry.isPending}
        onClick={() =>
          carry.mutate(undefined, {
            onSuccess: () => {
              setReload((n) => n + 1)
              showSnackbar(`Sisa ${formatMonth(addMonths(month, -1))} dibawa ke bulan ini`)
            },
            onError: (e) => showSnackbar(e.message, { tone: "error" }),
          })
        }
      >
        Bawa sisa bulan lalu
      </Button>
      {!ready && !plan.isError ? <Skeleton rows={4} height={88} /> : null}
      {plan.isError ? (
        <ErrorState message="Rencana gagal dimuat." onRetry={() => void plan.refetch()} retrying={plan.isFetching} />
      ) : null}
      {ready ? (
        <PlanEditor
          key={`${month}-${reload}`}
          bookId={bookId}
          plan={plan.data}
          categories={categories.data}
          investmentTypes={types.data}
          onConflict={() => {
            void plan.refetch().then(() => setReload((n) => n + 1))
          }}
        />
      ) : null}
    </>
  )
}
