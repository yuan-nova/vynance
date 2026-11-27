import {
  type Asset,
  assetSchema,
  type CreateAssetInput,
  type CreateInvestmentTypeInput,
  type InvestmentType,
  investmentTypeSchema,
  moneyToJson,
  type Portfolio,
  portfolioSchema,
  type UpdateAssetInput,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const b = api.books[":bookId"]

export async function fetchPortfolio(bookId: string): Promise<Portfolio> {
  const res = await b.investments.$get({ param: { bookId } })
  await ensureOk(res)
  return portfolioSchema.parse((await res.json()).data)
}

export async function saveInvestmentType(
  bookId: string,
  id: string | null,
  input: CreateInvestmentTypeInput,
): Promise<InvestmentType> {
  const json = { ...input, targetValue: input.targetValue === null ? null : moneyToJson(input.targetValue) }
  const res = id
    ? await b["investment-types"][":id"].$put({ param: { bookId, id }, json })
    : await b["investment-types"].$post({ param: { bookId }, json })
  await ensureOk(res)
  return investmentTypeSchema.parse((await res.json()).data)
}

export async function deleteInvestmentType(bookId: string, id: string): Promise<void> {
  const res = await b["investment-types"][":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}

export async function createAsset(bookId: string, input: CreateAssetInput): Promise<Asset> {
  const res = await b.assets.$post({
    param: { bookId },
    json: { ...input, costBasis: moneyToJson(input.costBasis), currentValue: moneyToJson(input.currentValue) },
  })
  await ensureOk(res)
  return assetSchema.parse((await res.json()).data)
}

export async function updateAsset(bookId: string, id: string, input: UpdateAssetInput): Promise<Asset> {
  const res = await b.assets[":id"].$patch({
    param: { bookId, id },
    json: { ...input, currentValue: input.currentValue === undefined ? undefined : moneyToJson(input.currentValue) },
  })
  await ensureOk(res)
  return assetSchema.parse((await res.json()).data)
}

export async function deleteAsset(bookId: string, id: string): Promise<void> {
  const res = await b.assets[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}
