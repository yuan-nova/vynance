import { z } from "zod"
import type { IconName } from "../icons"

// Tipe rekening (FR-10). Kartu kredit dan PayLater adalah utang (BR-03).

export const WALLET_TYPES = ["bank", "ewallet", "cash", "credit_card", "paylater", "rdn"] as const
export const walletTypeSchema = z.enum(WALLET_TYPES)
export type WalletType = z.infer<typeof walletTypeSchema>

export const DEBT_WALLET_TYPES: readonly WalletType[] = ["credit_card", "paylater"]

export function isDebtWallet(type: WalletType): boolean {
  return DEBT_WALLET_TYPES.includes(type)
}

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  bank: "Bank",
  ewallet: "E-wallet",
  cash: "Tunai",
  // biome-ignore lint/style/useNamingConvention: kunci mengikuti nilai enum DB
  credit_card: "Kartu kredit",
  paylater: "PayLater",
  rdn: "RDN",
}

/** Ikon per tipe (DS-ICON-01). */
export const WALLET_TYPE_ICON: Record<WalletType, IconName> = {
  bank: "bank",
  ewallet: "wallet",
  cash: "cash",
  // biome-ignore lint/style/useNamingConvention: kunci mengikuti nilai enum DB
  credit_card: "card",
  paylater: "card",
  rdn: "trend",
}

export const TX_TYPES = ["income", "expense", "transfer", "asset_buy", "asset_sell"] as const
export const txTypeSchema = z.enum(TX_TYPES)
export type TxType = z.infer<typeof txTypeSchema>
