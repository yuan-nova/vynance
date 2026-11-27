import { type PayslipList, payslipTrend, type SavePayslipInput, type ServiceCtx } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { PayslipsRepository } from "./payslips.repository"

type Repos = { payslips: PayslipsRepository; activity: ActivityRepository }
type Deps = {
  payslips: Pick<PayslipsRepository, "latest">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

/**
 * Slip gaji (PB-10, FR-140). Server hanya menerima angka yang sudah ditinjau; PDF dibaca di perangkat (ADR 0007).
 * Satu slip per periode: menyimpan periode yang sudah ada menggantikan angkanya.
 */
export class PayslipsService {
  constructor(private readonly d: Deps) {}

  async list(ctx: ServiceCtx): Promise<PayslipList> {
    const rows = await this.d.payslips.latest(ctx.bookId)
    return {
      payslips: payslipTrend(rows).map((r) => ({
        id: r.id,
        period: r.period,
        gross: r.gross.toString(),
        deductions: r.deductions.toString(),
        net: r.net.toString(),
        changeBp: r.changeBp,
      })),
    }
  }

  async save(ctx: ServiceCtx, input: SavePayslipInput): Promise<PayslipList> {
    await this.d.uow.withTransaction(async (r) => {
      const amounts = { gross: input.gross, deductions: input.deductions, net: input.net }
      const existing = await r.payslips.findByPeriod(ctx.bookId, input.period)
      const id = existing?.id ?? this.d.newId()
      if (existing) await r.payslips.updateAmounts(ctx.bookId, id, amounts)
      else await r.payslips.insert({ id, bookId: ctx.bookId, period: input.period, ...amounts, createdBy: ctx.userId })
      await this.log(r, ctx, existing ? "payslip.updated" : "payslip.created", id, input.period)
    })
    return this.list(ctx)
  }

  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.payslips.findById(ctx.bookId, id)
      if (!current) throw new NotFound("PAYSLIP_NOT_FOUND")
      await r.payslips.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "payslip.deleted", id, current.period)
    })
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, period: string) {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "payslip",
      entityId: id,
      summary: { period },
    })
  }
}
