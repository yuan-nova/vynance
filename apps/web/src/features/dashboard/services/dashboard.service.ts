import { type Dashboard, type DashboardCharts, dashboardChartsSchema, dashboardSchema } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

export async function fetchDashboard(bookId: string, month: string): Promise<Dashboard> {
  const res = await api.books[":bookId"].dashboard.$get({ param: { bookId }, query: { month } })
  await ensureOk(res)
  return dashboardSchema.parse((await res.json()).data)
}

export async function fetchDashboardCharts(bookId: string, month: string): Promise<DashboardCharts> {
  const res = await api.books[":bookId"].dashboard.charts.$get({ param: { bookId }, query: { month } })
  await ensureOk(res)
  return dashboardChartsSchema.parse((await res.json()).data)
}
