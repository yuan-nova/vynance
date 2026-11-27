import {
  type Asset,
  assetGain,
  type CreateAssetInput,
  type CreateInvestmentTypeInput,
  type InvestmentType,
  type Portfolio,
  portfolioTotals,
  type ServiceCtx,
  targetProgressBp,
  type UpdateAssetInput,
  type UpdateInvestmentTypeInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { AssetsRepository } from "./assets.repository"
import type { InvestmentTypesRepository } from "./investment-types.repository"

type Repos = { types: InvestmentTypesRepository; assets: AssetsRepository; activity: ActivityRepository }
type Deps = {
  types: Pick<InvestmentTypesRepository, "list">
  assets: Pick<AssetsRepository, "list" | "findById" | "totalValue">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}
type AssetRow = NonNullable<Awaited<ReturnType<AssetsRepository["findById"]>>>

function toAsset(r: AssetRow): Asset {
  const g = assetGain(r.costBasis, r.currentValue)
  return {
    id: r.id,
    investmentTypeId: r.investmentTypeId,
    typeName: r.typeName,
    name: r.name,
    units: r.units,
    costBasis: r.costBasis.toString(),
    currentValue: r.currentValue.toString(),
    gain: g.gain.toString(),
    gainBp: g.gainBp,
    valueUpdatedAt: r.valueUpdatedAt?.toISOString() ?? null,
  }
}

/** Investasi (FR-70, PB-06): jenis dengan target, aset, untung/rugi. Beli/jual lewat transaksi (#32). */
export class InvestmentsService {
  constructor(private readonly d: Deps) {}

  listTypes(ctx: ServiceCtx): Promise<InvestmentType[]> {
    return this.d.types.list(ctx.bookId)
  }

  /** Σ nilai kini aset, untuk kekayaan bersih di Beranda dan skor kesehatan (BR-04). */
  totalValue(ctx: ServiceCtx): Promise<bigint> {
    return this.d.assets.totalValue(ctx.bookId)
  }

  async portfolio(ctx: ServiceCtx): Promise<Portfolio> {
    const [types, rows] = await Promise.all([this.d.types.list(ctx.bookId), this.d.assets.list(ctx.bookId)])
    const totals = portfolioTotals(rows)
    return {
      totals: {
        cost: totals.cost.toString(),
        value: totals.value.toString(),
        gain: totals.gain.toString(),
        gainBp: totals.gainBp,
      },
      types: types.map((t) => {
        const mine = rows.filter((a) => a.investmentTypeId === t.id)
        const sums = portfolioTotals(mine)
        return {
          ...t,
          value: sums.value.toString(),
          cost: sums.cost.toString(),
          assetCount: mine.length,
          progressBp: targetProgressBp(sums.value, t.targetValue === null ? null : BigInt(t.targetValue)),
        }
      }),
      assets: rows.map(toAsset),
    }
  }

  async createType(ctx: ServiceCtx, input: CreateInvestmentTypeInput): Promise<InvestmentType> {
    const id = this.d.newId()
    const existing = await this.d.types.list(ctx.bookId)
    await this.d.uow.withTransaction(async (r) => {
      await r.types.insert({ id, bookId: ctx.bookId, ...input, sortOrder: existing.length, createdBy: ctx.userId })
      await this.log(r, ctx, "investment_type.created", id, input.name)
    })
    return this.typeOrThrow(ctx, id)
  }

  async updateType(ctx: ServiceCtx, id: string, input: UpdateInvestmentTypeInput): Promise<InvestmentType> {
    await this.d.uow.withTransaction(async (r) => {
      if (!(await r.types.existing(ctx.bookId, [id])).length) throw new NotFound("INVESTMENT_TYPE_NOT_FOUND")
      await r.types.update(ctx.bookId, id, input)
      await this.log(r, ctx, "investment_type.updated", id, input.name)
    })
    return this.typeOrThrow(ctx, id)
  }

  /** Jenis yang masih punya aset tidak bisa dihapus. */
  async removeType(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      if (!(await r.types.existing(ctx.bookId, [id])).length) throw new NotFound("INVESTMENT_TYPE_NOT_FOUND")
      if ((await r.assets.countByType(ctx.bookId, id)) > 0)
        throw new BusinessError("INVESTMENT_TYPE_HAS_ASSETS", undefined, 409)
      await r.types.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "investment_type.deleted", id, "")
    })
  }

  /** Tambah aset dengan modal dan nilai awal (PB-06 langkah 2). Beli dari rekening lewat transaksi (#32). */
  async createAsset(ctx: ServiceCtx, input: CreateAssetInput): Promise<Asset> {
    const id = this.d.newId()
    await this.d.uow.withTransaction(async (r) => {
      if (!(await r.types.existing(ctx.bookId, [input.investmentTypeId])).length) {
        throw new BusinessError("INVESTMENT_TYPE_NOT_FOUND", "investmentTypeId")
      }
      await r.assets.insert({ id, bookId: ctx.bookId, ...input, valueUpdatedAt: this.d.now(), createdBy: ctx.userId })
      await this.log(r, ctx, "asset.created", id, input.name)
    })
    return this.assetOrThrow(ctx, id)
  }

  /** Ubah nama/jenis/unit dan perbarui nilai kini secara manual (PB-06 langkah 4). */
  async updateAsset(ctx: ServiceCtx, id: string, input: UpdateAssetInput): Promise<Asset> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.assets.findById(ctx.bookId, id)
      if (!current) throw new NotFound("ASSET_NOT_FOUND")
      if (input.investmentTypeId && !(await r.types.existing(ctx.bookId, [input.investmentTypeId])).length) {
        throw new BusinessError("INVESTMENT_TYPE_NOT_FOUND", "investmentTypeId")
      }
      await r.assets.update(ctx.bookId, id, {
        ...input,
        ...(input.currentValue !== undefined ? { valueUpdatedAt: this.d.now() } : {}),
      })
      await this.log(r, ctx, "asset.updated", id, input.name ?? current.name)
    })
    return this.assetOrThrow(ctx, id)
  }

  /** Aset yang punya transaksi beli/jual tidak dihapus supaya riwayat tetap utuh. */
  async removeAsset(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.assets.findById(ctx.bookId, id)
      if (!current) throw new NotFound("ASSET_NOT_FOUND")
      if (await r.assets.hasTransactions(ctx.bookId, id))
        throw new BusinessError("ASSET_HAS_TRANSACTIONS", undefined, 409)
      await r.assets.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "asset.deleted", id, current.name)
    })
  }

  private async typeOrThrow(ctx: ServiceCtx, id: string): Promise<InvestmentType> {
    const t = (await this.d.types.list(ctx.bookId)).find((x) => x.id === id)
    if (!t) throw new NotFound("INVESTMENT_TYPE_NOT_FOUND")
    return t
  }

  private async assetOrThrow(ctx: ServiceCtx, id: string): Promise<Asset> {
    const row = await this.d.assets.findById(ctx.bookId, id)
    if (!row) throw new NotFound("ASSET_NOT_FOUND")
    return toAsset(row)
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, name: string): Promise<void> {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: action.split(".")[0] ?? "asset",
      entityId: id,
      summary: name ? { name } : {},
    })
  }
}
