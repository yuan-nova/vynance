import type { InvestmentType, ServiceCtx } from "@vynance/shared"
import type { InvestmentTypesRepository } from "./investment-types.repository"

/** Jenis investasi (FR-70). Tambah/ubah/target + aset di #31. */
export class InvestmentsService {
  constructor(private readonly types: Pick<InvestmentTypesRepository, "list">) {}

  listTypes(ctx: ServiceCtx): Promise<InvestmentType[]> {
    return this.types.list(ctx.bookId)
  }
}
