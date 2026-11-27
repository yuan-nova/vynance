import {
  type CreateIncomeSourceInput,
  DEFAULT_PASSIVE_TARGET_BP,
  type IncomeList,
  incomeSummary,
  type ServiceCtx,
  type UpdateIncomeSourceInput,
  type UpdatePassiveTargetInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { IncomesRepository } from "./incomes.repository"

type Repos = { incomes: IncomesRepository; activity: ActivityRepository }
type Deps = {
  incomes: Pick<IncomesRepository, "list" | "targetBp">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

/** Sumber penghasilan aktif dan pasif (PB-10, FR-130). Porsi pasif dihitung di shared. */
export class IncomesService {
  constructor(private readonly d: Deps) {}

  async list(ctx: ServiceCtx): Promise<IncomeList> {
    const [rows, bp] = await Promise.all([this.d.incomes.list(ctx.bookId), this.d.incomes.targetBp(ctx.bookId)])
    const s = incomeSummary(rows, bp ?? DEFAULT_PASSIVE_TARGET_BP)
    return {
      sources: rows.map((r) => ({ ...r, monthlyAmount: r.monthlyAmount.toString() })),
      summary: {
        active: s.active.toString(),
        passive: s.passive.toString(),
        total: s.total.toString(),
        passiveBp: s.passiveBp,
        targetBp: s.targetBp,
        metTarget: s.metTarget,
      },
    }
  }

  async create(ctx: ServiceCtx, input: CreateIncomeSourceInput): Promise<IncomeList> {
    const id = this.d.newId()
    await this.d.uow.withTransaction(async (r) => {
      await r.incomes.insert({ id, bookId: ctx.bookId, ...input, createdBy: ctx.userId })
      await this.log(r, ctx, "income_source.created", id, { name: input.name })
    })
    return this.list(ctx)
  }

  async update(ctx: ServiceCtx, id: string, input: UpdateIncomeSourceInput): Promise<IncomeList> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.incomes.findById(ctx.bookId, id)
      if (!current) throw new NotFound("INCOME_SOURCE_NOT_FOUND")
      await r.incomes.update(ctx.bookId, id, input)
      await this.log(r, ctx, "income_source.updated", id, { name: input.name ?? current.name })
    })
    return this.list(ctx)
  }

  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.incomes.findById(ctx.bookId, id)
      if (!current) throw new NotFound("INCOME_SOURCE_NOT_FOUND")
      await r.incomes.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "income_source.deleted", id, { name: current.name })
    })
  }

  async setTarget(ctx: ServiceCtx, input: UpdatePassiveTargetInput): Promise<IncomeList> {
    await this.d.uow.withTransaction(async (r) => {
      await r.incomes.setTargetBp(ctx.bookId, input.targetBp)
      await this.log(r, ctx, "income_target.updated", ctx.bookId, { targetBp: String(input.targetBp) })
    })
    return this.list(ctx)
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, summary: Record<string, string>) {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "income_source",
      entityId: id,
      summary,
    })
  }
}
