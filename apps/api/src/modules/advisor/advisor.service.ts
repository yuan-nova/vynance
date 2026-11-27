import {
  ADVISOR_SYSTEM,
  type AdvisorConsent,
  type AskLlm,
  advisorContext,
  monthOf,
  type ServiceCtx,
} from "@vynance/shared"
import { Forbidden, ServiceUnavailable } from "../../lib/errors"
import type { DashboardService } from "../dashboard/dashboard.service"
import type { GoalsService } from "../goals/goals.service"
import type { InvestmentsService } from "../investments/investments.service"
import type { AdvisorRepository } from "./advisor.repository"

type Deps = {
  advisor: Pick<AdvisorRepository, "consentAt" | "setConsent">
  dashboard: Pick<DashboardService, "get" | "charts">
  goals: Pick<GoalsService, "list">
  investments: Pick<InvestmentsService, "portfolio">
  llm: AskLlm | null
  now: () => Date
}

/** AI advisor (PB-11, FR-100). Tanpa persetujuan eksplisit, tidak ada data yang dikirim. */
export class AdvisorService {
  constructor(private readonly d: Deps) {}

  async consent(ctx: ServiceCtx): Promise<AdvisorConsent> {
    const at = await this.d.advisor.consentAt(ctx.userId)
    return { consentedAt: at?.toISOString() ?? null }
  }

  async setConsent(ctx: ServiceCtx, on: boolean): Promise<AdvisorConsent> {
    await this.d.advisor.setConsent(ctx.userId, on ? this.d.now() : null)
    return this.consent(ctx)
  }

  /** Ringkasan yang akan dikirim (juga ditampilkan ke pengguna sebelum setuju). */
  async context(ctx: ServiceCtx): Promise<string> {
    const month = monthOf(this.d.now())
    const [dash, charts, goals, portfolio] = await Promise.all([
      this.d.dashboard.get(ctx, month),
      this.d.dashboard.charts(ctx, month),
      this.d.goals.list(ctx),
      this.d.investments.portfolio(ctx),
    ])
    return advisorContext({
      month,
      netWorth: BigInt(dash.wealth.netWorth),
      cash: BigInt(dash.wealth.cash),
      investments: BigInt(dash.wealth.investments),
      creditCardDebt: BigInt(dash.wealth.debt),
      income: BigInt(dash.monthSummary.income),
      expense: BigInt(dash.monthSummary.expense),
      topCategories: charts.byCategory
        .filter((c) => c.name !== "Lainnya")
        .map((c) => ({ name: c.name, amount: BigInt(c.amount) })),
      score: dash.healthScore ? { score: dash.healthScore.score, label: dash.healthScore.levelLabel } : null,
      goals: goals.goals.map((g) => ({
        name: g.name,
        collected: BigInt(g.collected),
        target: BigInt(g.targetAmount),
        monthlyNeeded: g.monthlyNeeded === null ? null : BigInt(g.monthlyNeeded),
      })),
      topAssets: [...portfolio.assets]
        .sort((a, b) => Number(BigInt(b.currentValue) - BigInt(a.currentValue)))
        .slice(0, 5)
        .map((a) => ({ name: a.name, type: a.typeName, value: BigInt(a.currentValue), gainBp: a.gainBp })),
    })
  }

  /** Jawaban di-stream. Cek persetujuan dan konfigurasi SEBELUM data dikumpulkan/dikirim. */
  async ask(ctx: ServiceCtx, question: string): Promise<AsyncIterable<string>> {
    if (!(await this.d.advisor.consentAt(ctx.userId))) throw new Forbidden("AI_CONSENT_REQUIRED")
    const llm = this.d.llm
    if (!llm) throw new ServiceUnavailable("AI_UNAVAILABLE")
    const data = await this.context(ctx)
    return llm(ADVISOR_SYSTEM, `<data>\n${data}\n</data>\n\nPertanyaan: ${question}`)
  }
}
