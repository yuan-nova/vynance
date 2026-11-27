import {
  type ChildPlan,
  type CreateChildInput,
  DEFAULT_EDUCATION_INFLATION_BP,
  dateOnlyOf,
  type EducationPlan,
  educationPlan,
  type ServiceCtx,
  type UpdateChildInput,
  type UpdateEducationSettingsInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { EducationRepository } from "./education.repository"

type Repos = { education: EducationRepository; activity: ActivityRepository }
type Deps = {
  education: Pick<EducationRepository, "list" | "inflationBp">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

/** Dana pendidikan anak (PB-09, FR-120). Rumus ada di shared `educationPlan`. */
export class EducationService {
  constructor(private readonly d: Deps) {}

  async plan(ctx: ServiceCtx): Promise<EducationPlan> {
    const today = dateOnlyOf(this.d.now())
    const [rows, bp] = await Promise.all([this.d.education.list(ctx.bookId), this.d.education.inflationBp(ctx.bookId)])
    const inflationBp = bp ?? DEFAULT_EDUCATION_INFLATION_BP
    const kids: ChildPlan[] = rows.map((r) => {
      const stages = educationPlan({ birthYear: r.birthYear, savings: r.educationSavings, inflationBp, today })
      const monthly = stages.reduce((s, x) => s + (x.monthly ?? 0n), 0n)
      return {
        id: r.id,
        name: r.name,
        birthYear: r.birthYear,
        savings: r.educationSavings.toString(),
        monthly: monthly.toString(),
        stages: stages.map((x) => ({
          ...x,
          futureCost: x.futureCost.toString(),
          allocated: x.allocated.toString(),
          shortfall: x.shortfall.toString(),
          monthly: x.monthly?.toString() ?? null,
        })),
      }
    })
    const total = kids.reduce((s, k) => s + BigInt(k.monthly), 0n)
    return { inflationBp, children: kids, monthly: total.toString() }
  }

  async createChild(ctx: ServiceCtx, input: CreateChildInput): Promise<EducationPlan> {
    const id = this.d.newId()
    await this.d.uow.withTransaction(async (r) => {
      await r.education.insert({
        id,
        bookId: ctx.bookId,
        name: input.name,
        birthYear: input.birthYear,
        educationSavings: input.savings,
        createdBy: ctx.userId,
      })
      await this.log(r, ctx, "child.created", id, { name: input.name })
    })
    return this.plan(ctx)
  }

  async updateChild(ctx: ServiceCtx, id: string, input: UpdateChildInput): Promise<EducationPlan> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.education.findById(ctx.bookId, id)
      if (!current) throw new NotFound("CHILD_NOT_FOUND")
      await r.education.update(ctx.bookId, id, {
        name: input.name,
        birthYear: input.birthYear,
        educationSavings: input.savings,
      })
      await this.log(r, ctx, "child.updated", id, { name: input.name ?? current.name })
    })
    return this.plan(ctx)
  }

  async removeChild(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.education.findById(ctx.bookId, id)
      if (!current) throw new NotFound("CHILD_NOT_FOUND")
      await r.education.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "child.deleted", id, { name: current.name })
    })
  }

  async updateSettings(ctx: ServiceCtx, input: UpdateEducationSettingsInput): Promise<EducationPlan> {
    await this.d.uow.withTransaction(async (r) => {
      await r.education.setInflationBp(ctx.bookId, input.inflationBp)
      await this.log(r, ctx, "education.inflation_updated", ctx.bookId, { inflationBp: String(input.inflationBp) })
    })
    return this.plan(ctx)
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, summary: Record<string, string>) {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "child",
      entityId: id,
      summary,
    })
  }
}
