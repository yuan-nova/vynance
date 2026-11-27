import {
  addMonths,
  type CreateContributionInput,
  type CreateGoalInput,
  dateOnlyOf,
  type Goal,
  type GoalList,
  goalProgress,
  monthOfDate,
  type ServiceCtx,
  type UpdateGoalInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { GoalsRepository } from "./goals.repository"

type Row = NonNullable<Awaited<ReturnType<GoalsRepository["findById"]>>>
type Repos = { goals: GoalsRepository; activity: ActivityRepository }
type Deps = {
  goals: Pick<GoalsRepository, "list" | "findById" | "contributionTotals" | "monthlyContributions">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

/** Target tabungan (PB-07, FR-60). Terkumpul = awal + Σ setoran; status BR-20/BR-21 dihitung di shared. */
export class GoalsService {
  constructor(private readonly d: Deps) {}

  async list(ctx: ServiceCtx): Promise<GoalList> {
    const today = dateOnlyOf(this.d.now())
    const [rows, totals, recent] = await Promise.all([
      this.d.goals.list(ctx.bookId),
      this.d.goals.contributionTotals(ctx.bookId),
      this.d.goals.monthlyContributions(ctx.bookId, windowStart(today)),
    ])
    const goals = rows.map((r) => toGoal(r, totals.get(r.id) ?? 0n, recent, today))
    const sumOf = (pick: (g: Goal) => string) => goals.reduce((s, g) => s + BigInt(pick(g)), 0n).toString()
    return {
      goals,
      summary: { collected: sumOf((g) => g.collected), target: sumOf((g) => g.targetAmount), count: goals.length },
    }
  }

  async get(ctx: ServiceCtx, id: string): Promise<Goal> {
    const today = dateOnlyOf(this.d.now())
    const row = await this.d.goals.findById(ctx.bookId, id)
    if (!row) throw new NotFound("GOAL_NOT_FOUND")
    const [totals, recent] = await Promise.all([
      this.d.goals.contributionTotals(ctx.bookId, id),
      this.d.goals.monthlyContributions(ctx.bookId, windowStart(today), id),
    ])
    return toGoal(row, totals.get(id) ?? 0n, recent, today)
  }

  async create(ctx: ServiceCtx, input: CreateGoalInput): Promise<Goal> {
    const id = this.d.newId()
    await this.d.uow.withTransaction(async (r) => {
      await r.goals.insert({ id, bookId: ctx.bookId, ...input, createdBy: ctx.userId })
      await this.log(r, ctx, "goal.created", id, { name: input.name })
    })
    return this.get(ctx, id)
  }

  async update(ctx: ServiceCtx, id: string, input: UpdateGoalInput): Promise<Goal> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.goals.findById(ctx.bookId, id)
      if (!current) throw new NotFound("GOAL_NOT_FOUND")
      await r.goals.update(ctx.bookId, id, input)
      await this.log(r, ctx, "goal.updated", id, { name: input.name ?? current.name })
    })
    return this.get(ctx, id)
  }

  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.goals.findById(ctx.bookId, id)
      if (!current) throw new NotFound("GOAL_NOT_FOUND")
      await r.goals.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "goal.deleted", id, { name: current.name })
    })
  }

  /** Catat setoran (PB-07). Tidak membuat transaksi; uang tetap di rekening yang sama. */
  async contribute(ctx: ServiceCtx, id: string, input: CreateContributionInput): Promise<Goal> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.goals.findById(ctx.bookId, id)
      if (!current) throw new NotFound("GOAL_NOT_FOUND")
      await r.goals.insertContribution({
        id: this.d.newId(),
        bookId: ctx.bookId,
        goalId: id,
        amount: input.amount,
        contributedOn: input.contributedOn,
        createdBy: ctx.userId,
      })
      await this.log(r, ctx, "goal.contributed", id, { name: current.name, amount: input.amount.toString() })
    })
    return this.get(ctx, id)
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, summary: Record<string, string>) {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "goal",
      entityId: id,
      summary,
    })
  }
}

/** Hari pertama 2 bulan sebelum bulan ini: jendela 3 bulan BR-21. */
function windowStart(today: string): string {
  return `${addMonths(monthOfDate(today), -2)}-01`
}

function toGoal(
  r: Row,
  contributed: bigint,
  recent: readonly { goalId: string; month: string; amount: bigint }[],
  today: string,
): Goal {
  const collected = r.initialAmount + contributed
  const p = goalProgress({
    targetAmount: r.targetAmount,
    collected,
    targetDate: r.targetDate,
    createdOn: dateOnlyOf(r.createdAt),
    recentContributions: recent.filter((c) => c.goalId === r.id),
    today,
  })
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    targetAmount: r.targetAmount.toString(),
    initialAmount: r.initialAmount.toString(),
    collected: collected.toString(),
    targetDate: r.targetDate,
    note: r.note,
    percentBp: p.percentBp,
    remaining: p.remaining.toString(),
    monthsLeft: p.monthsLeft,
    monthlyNeeded: p.monthlyNeeded?.toString() ?? null,
    pace: p.pace.toString(),
    status: p.status,
  }
}
