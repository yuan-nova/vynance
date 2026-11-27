import {
  type CreateWalletInput,
  moneyToJson,
  type UpdateWalletInput,
  type Wallet,
  type WalletList,
  walletListSchema,
  walletSchema,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const w = api.books[":bookId"].wallets

/** bigint → string untuk JSON (CODING-GUIDELINES §6.8). */
const money = (v: bigint | null | undefined) => (v === undefined ? undefined : v === null ? null : moneyToJson(v))

export async function fetchWallets(bookId: string): Promise<WalletList> {
  const res = await w.$get({ param: { bookId } })
  await ensureOk(res)
  return walletListSchema.parse((await res.json()).data)
}

export async function createWallet(bookId: string, input: CreateWalletInput): Promise<Wallet> {
  const res = await w.$post({
    param: { bookId },
    json: {
      name: input.name,
      type: input.type,
      openingBalance: moneyToJson(input.openingBalance),
      creditLimit: money(input.creditLimit),
    },
  })
  await ensureOk(res)
  return walletSchema.parse((await res.json()).data)
}

export async function updateWallet(bookId: string, id: string, input: UpdateWalletInput): Promise<Wallet> {
  const res = await w[":id"].$patch({
    param: { bookId, id },
    json: {
      name: input.name,
      type: input.type,
      openingBalance: input.openingBalance === undefined ? undefined : moneyToJson(input.openingBalance),
      creditLimit: money(input.creditLimit),
    },
  })
  await ensureOk(res)
  return walletSchema.parse((await res.json()).data)
}

export async function deleteWallet(bookId: string, id: string): Promise<void> {
  const res = await w[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}

export async function saveOpeningBalances(
  bookId: string,
  balances: { walletId: string; openingBalance: bigint }[],
): Promise<void> {
  const res = await api.books[":bookId"].onboarding["opening-balances"].$post({
    param: { bookId },
    json: { balances: balances.map((b) => ({ walletId: b.walletId, openingBalance: moneyToJson(b.openingBalance) })) },
  })
  await ensureOk(res)
}
